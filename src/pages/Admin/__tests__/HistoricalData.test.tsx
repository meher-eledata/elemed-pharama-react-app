global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import HistoricalData from '../HistoricalData';
import * as historicalFilesApi from '../../../redux/slices/historicalFilesApi';

const theme = createTheme();

// react-router: stub navigate (the "Back to Admin" button calls useNavigate).
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock the slice module wholesale (SupplierReports.test.tsx pattern) but keep
// the real exports (incl. getHistoricalFileUrl, which is a plain function the
// page imports — NOT a hook). The four hooks are overridden per test.
//
// CRITICAL (gotchas.md "New RTK Query hook breaks auto-mocked slice test suites"):
// EVERY hook the page consumes must be registered in beforeEach, or the lazy
// tuple destructure (`const [trigger] = useLazy...()`) throws "undefined is not
// iterable". The four hooks below are all registered.
jest.mock('../../../redux/slices/historicalFilesApi', () => {
  const actual = jest.requireActual('../../../redux/slices/historicalFilesApi');
  return {
    __esModule: true,
    ...actual,
    useGetHistoricalFilesQuery: jest.fn(),
    useUploadHistoricalFileMutation: jest.fn(),
    useLazyGetHistoricalFileDownloadLinkQuery: jest.fn(),
    useLazyGetHistoricalFileBlobQuery: jest.fn(),
  };
});

const mockedApi = historicalFilesApi as unknown as {
  useGetHistoricalFilesQuery: jest.Mock;
  useUploadHistoricalFileMutation: jest.Mock;
  useLazyGetHistoricalFileDownloadLinkQuery: jest.Mock;
  useLazyGetHistoricalFileBlobQuery: jest.Mock;
};

// A minimal store carrying the auth.token the page reads for the blob fetch.
const createStore = (token: string | null = 'JWT123') =>
  configureStore({
    reducer: {
      auth: (state = { token, user: null }) => state,
      [historicalFilesApi.historicalFilesApi.reducerPath]:
        historicalFilesApi.historicalFilesApi.reducer,
    },
    middleware: (gDM) =>
      gDM().concat(historicalFilesApi.historicalFilesApi.middleware),
  });

const renderPage = (token: string | null = 'JWT123') =>
  render(
    <Provider store={createStore(token)}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <HistoricalData />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );

const SAMPLE_FILES = [
  {
    id: 2,
    file_name: 'finance-2026.csv',
    file_type: 'text/csv',
    size_bytes: 2048,
    uploaded_at: '2026-06-17T10:00:00.000Z',
    uploaded_by: 7,
  },
  {
    id: 1,
    file_name: 'inventory.pdf',
    file_type: 'application/pdf',
    size_bytes: 4096,
    uploaded_at: '2026-06-16T10:00:00.000Z',
    uploaded_by: null,
  },
];

// Shared lazy-trigger spies, reset per test.
let downloadLinkTrigger: jest.Mock;
let blobTrigger: jest.Mock;
let uploadTrigger: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();

  // Default: list query resolves the sample rows.
  mockedApi.useGetHistoricalFilesQuery.mockReturnValue({
    data: SAMPLE_FILES,
    isLoading: false,
    isFetching: false,
    error: undefined,
  });

  // upload mutation tuple: [trigger, { isLoading }].
  uploadTrigger = jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });
  mockedApi.useUploadHistoricalFileMutation.mockReturnValue([
    uploadTrigger,
    { isLoading: false },
  ]);

  // lazy download-link tuple: [trigger]. trigger() returns an object with .unwrap().
  downloadLinkTrigger = jest.fn();
  mockedApi.useLazyGetHistoricalFileDownloadLinkQuery.mockReturnValue([
    downloadLinkTrigger,
    {},
    {},
  ]);

  // lazy blob tuple (present so destructure never throws) — page uses fetch() for
  // the fallback, but the hook must still be registered (gotcha).
  blobTrigger = jest.fn();
  mockedApi.useLazyGetHistoricalFileBlobQuery.mockReturnValue([blobTrigger, {}, {}]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('HistoricalData page', () => {
  it('renders a table row for each file from the mocked list', () => {
    renderPage();
    expect(screen.getByText('finance-2026.csv')).toBeInTheDocument();
    expect(screen.getByText('inventory.pdf')).toBeInTheDocument();
    // file_type cells render too.
    expect(screen.getByText('text/csv')).toBeInTheDocument();
    expect(screen.getByText('application/pdf')).toBeInTheDocument();
  });

  it('renders the upload control', () => {
    renderPage();
    expect(screen.getByText('Upload File')).toBeInTheDocument();
    // Hidden native file input is present (the upload mechanism).
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
  });

  it('shows the empty state when there are no files', () => {
    mockedApi.useGetHistoricalFilesQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      error: undefined,
    });
    renderPage();
    expect(screen.getByText('No historical files uploaded yet.')).toBeInTheDocument();
  });

  it('download with a non-null url opens it directly (presigned S3) and does NOT fetch', async () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    downloadLinkTrigger.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        id: 2,
        url: 'https://s3.example/presigned',
        file_name: 'finance-2026.csv',
        file_type: 'text/csv',
        expires_in: 300,
      }),
    });

    renderPage();
    fireEvent.click(screen.getAllByText('Download')[0]);

    await waitFor(() => {
      expect(downloadLinkTrigger).toHaveBeenCalledWith(2);
      expect(openSpy).toHaveBeenCalledWith(
        'https://s3.example/presigned',
        '_blank',
        'noopener,noreferrer'
      );
    });
    // Presigned URL is self-authenticating — no blob fetch needed.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('download with url null falls back to an AUTHENTICATED fetch of the /file endpoint (Bearer header), not anchor navigation', async () => {
    const blob = new Blob(['filedata']);
    const fetchSpy = jest
      .fn()
      .mockResolvedValue({ ok: true, blob: jest.fn().mockResolvedValue(blob) });
    global.fetch = fetchSpy as unknown as typeof fetch;

    // Capture any anchor created for the blob save so we can assert it never points
    // at the protected /file route (only at a blob: object URL).
    const createdAnchors: HTMLAnchorElement[] = [];
    const realCreate = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === 'a') {
        (el as HTMLAnchorElement).click = jest.fn();
        createdAnchors.push(el as HTMLAnchorElement);
      }
      return el;
    });
    const createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURL = jest.fn();
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL;
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = revokeObjectURL;

    downloadLinkTrigger.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        id: 1,
        url: null, // disk driver → fallback path
        file_name: 'inventory.pdf',
        file_type: 'application/pdf',
        expires_in: null,
      }),
    });

    renderPage('JWT123');
    fireEvent.click(screen.getAllByText('Download')[1]);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    // The fallback fetch targets the protected /file endpoint WITH the Bearer header.
    const [fetchUrl, fetchOpts] = fetchSpy.mock.calls[0];
    expect(String(fetchUrl)).toMatch(/admin\/historical-files\/1\/file$/);
    expect(fetchOpts).toMatchObject({
      headers: { Authorization: 'Bearer JWT123' },
    });

    // The save anchor must point at the blob object URL — NEVER a plain navigation
    // to the protected /file route (the 2026-06-17 "Token missing" bug).
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledWith(blob));
    expect(createdAnchors.length).toBeGreaterThan(0);
    createdAnchors.forEach((a) => {
      expect(a.href).not.toMatch(/admin\/historical-files\/\d+\/file/);
    });
  });
});
