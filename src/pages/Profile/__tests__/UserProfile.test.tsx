import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UserProfile from '../UserProfile';
import {
  useGetProfileQuery,
  useGetProfileActivityQuery,
  useUpdateProfileMutation,
  useUploadProfileDocumentsMutation,
  useLazyGetProfileDocumentDownloadLinkQuery,
  useLazyGetProfileDocumentBlobQuery,
  Profile,
  ProfileActivity,
} from '../../../redux/slices/profileApi';
import { USER_PROFILE_LABELS as L } from '../../../config/label/UserProfile.labels';

const theme = createTheme();

// Auto-mock the slice. IMPORTANT: every hook the component consumes must be
// given a return value in beforeEach so the component's destructuring never
// reads from `undefined` (see agentic-control/.claude/memory/gotchas.md →
// "New RTK Query hook breaks auto-mocked slice test suites").
jest.mock('../../../redux/slices/profileApi');

const mockUseGetProfileQuery = useGetProfileQuery as jest.MockedFunction<
  typeof useGetProfileQuery
>;
const mockUseGetProfileActivityQuery =
  useGetProfileActivityQuery as jest.MockedFunction<
    typeof useGetProfileActivityQuery
  >;
const mockUseUpdateProfileMutation =
  useUpdateProfileMutation as jest.MockedFunction<
    typeof useUpdateProfileMutation
  >;
const mockUseUploadProfileDocumentsMutation =
  useUploadProfileDocumentsMutation as jest.MockedFunction<
    typeof useUploadProfileDocumentsMutation
  >;
const mockUseLazyGetProfileDocumentDownloadLinkQuery =
  useLazyGetProfileDocumentDownloadLinkQuery as jest.MockedFunction<
    typeof useLazyGetProfileDocumentDownloadLinkQuery
  >;
const mockUseLazyGetProfileDocumentBlobQuery =
  useLazyGetProfileDocumentBlobQuery as jest.MockedFunction<
    typeof useLazyGetProfileDocumentBlobQuery
  >;

// Minimal RTK Query result shape the component reads (data/isLoading/isError).
const queryResult = (
  data: any,
  { isLoading = false, isError = false }: { isLoading?: boolean; isError?: boolean } = {}
) =>
  ({
    data,
    isLoading,
    isError,
    isSuccess: !isLoading && !isError,
    isFetching: false,
    isUninitialized: false,
    error: isError ? { status: 500 } : undefined,
    refetch: jest.fn(),
  }) as any;

const mockProfile: Profile = {
  id: 5,
  username: 'jdoe',
  email: 'jdoe@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'pharmacist',
  status: 'active',
  last_login: '2026-06-17T10:00:00.000Z',
  created_at: '2025-01-01T00:00:00.000Z',
  mobile: '9876543210',
  address_line1: '12 Main St',
  address_line2: 'Apt 4',
  city: 'Mumbai',
  state: 'MH',
  postal_code: '400001',
  country: 'India',
  identity_document_type: 'Aadhaar',
  identity_document_number_masked: '••••9012',
  documents: {
    id_document: { uploaded: true, filename: 'aadhaar-card.png' },
    pharmacist_certificate: { uploaded: false, filename: null },
  },
};

const mockActivity: ProfileActivity[] = [
  {
    module: 'Sales',
    event_type: 'Sale Created',
    event_time: '2026-06-17T12:00:00.000Z',
    event_details: 'Invoice INV-1',
  },
  {
    module: 'Admin',
    event_type: 'Login',
    event_time: '2026-06-17T09:00:00.000Z',
    event_details: null,
  },
];

const renderPage = () =>
  render(
    <ThemeProvider theme={theme}>
      <UserProfile />
    </ThemeProvider>
  );

// Shared trigger spies, reset per test.
let updateTrigger: jest.Mock;
let uploadTrigger: jest.Mock;
let downloadLinkTrigger: jest.Mock;
let blobTrigger: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  // Sensible defaults so destructuring never throws; tests override per-case.
  mockUseGetProfileQuery.mockReturnValue(queryResult(mockProfile));
  mockUseGetProfileActivityQuery.mockReturnValue(
    queryResult({ activity: mockActivity })
  );
  // Mutation hooks return a [trigger, state] tuple; trigger returns { unwrap }.
  updateTrigger = jest
    .fn()
    .mockReturnValue({ unwrap: () => Promise.resolve(mockProfile) });
  mockUseUpdateProfileMutation.mockReturnValue([
    updateTrigger,
    { isLoading: false, reset: jest.fn() },
  ] as any);
  uploadTrigger = jest
    .fn()
    .mockReturnValue({ unwrap: () => Promise.resolve(mockProfile) });
  mockUseUploadProfileDocumentsMutation.mockReturnValue([
    uploadTrigger,
    { isLoading: false, reset: jest.fn() },
  ] as any);
  // Lazy hooks return a [trigger, ...] tuple; trigger returns { unwrap }.
  downloadLinkTrigger = jest.fn();
  mockUseLazyGetProfileDocumentDownloadLinkQuery.mockReturnValue([
    downloadLinkTrigger,
    {},
    {},
  ] as any);
  blobTrigger = jest.fn();
  mockUseLazyGetProfileDocumentBlobQuery.mockReturnValue([
    blobTrigger,
    {},
    {},
  ] as any);
});

describe('UserProfile', () => {
  it('renders a spinner while the profile is loading', () => {
    mockUseGetProfileQuery.mockReturnValue(queryResult(undefined, { isLoading: true }));
    mockUseGetProfileActivityQuery.mockReturnValue(
      queryResult(undefined, { isLoading: true })
    );

    const { container } = renderPage();
    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
    // The profile sections should not be present while loading.
    expect(screen.queryByText('jdoe@example.com')).not.toBeInTheDocument();
  });

  it('renders the error message when the profile query errors', () => {
    mockUseGetProfileQuery.mockReturnValue(queryResult(undefined, { isError: true }));

    renderPage();
    expect(screen.getByText(L.ERROR.PROFILE)).toBeInTheDocument();
  });

  it('renders name, role, status, email and masked identity number on success', () => {
    renderPage();

    // Header: full name + username + role/status chips. The username renders as
    // "@" + value across two text nodes, so match on the containing element.
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_content, el) =>
          el?.tagName.toLowerCase() === 'p' &&
          el?.textContent === `${L.HEADER.USERNAME_PREFIX}jdoe`
      )
    ).toBeInTheDocument();
    expect(screen.getByText('pharmacist')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();

    // Account + identity fields.
    expect(screen.getByText('jdoe@example.com')).toBeInTheDocument();
    expect(screen.getByText('Aadhaar')).toBeInTheDocument();
    expect(screen.getByText('••••9012')).toBeInTheDocument();
  });

  it('renders the recent-activity rows on success', () => {
    renderPage();

    expect(screen.getByText('Sale Created')).toBeInTheDocument();
    expect(screen.getByText('Invoice INV-1')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    // The activity section title is present.
    expect(screen.getByText(L.SECTIONS.RECENT_ACTIVITY.TITLE)).toBeInTheDocument();
  });

  it('renders the empty-state when the activity array is empty', () => {
    mockUseGetProfileActivityQuery.mockReturnValue(
      queryResult({ activity: [] })
    );

    renderPage();
    expect(screen.getByText(L.SECTIONS.RECENT_ACTIVITY.EMPTY)).toBeInTheDocument();
    // No activity row content from the default mock should appear.
    expect(screen.queryByText('Sale Created')).not.toBeInTheDocument();
  });

  describe('profile editing', () => {
    it('sends ONLY editable fields — never email/username/role/status, and no masked identity number', async () => {
      renderPage();
      fireEvent.click(screen.getByText(L.EDIT.BUTTON));
      fireEvent.click(screen.getByText(L.EDIT.SAVE));

      await waitFor(() => expect(updateTrigger).toHaveBeenCalledTimes(1));
      const body = updateTrigger.mock.calls[0][0];

      // Contact fields prefilled from the profile.
      expect(body).toMatchObject({
        first_name: 'John',
        last_name: 'Doe',
        mobile: '9876543210',
        city: 'Mumbai',
      });
      // identity_document derived from the mapped label ('Aadhaar' → 0).
      expect(body.identity_document).toBe(0);
      // Locked fields are NEVER sent (email is read-only by security decision).
      expect(body).not.toHaveProperty('email');
      expect(body).not.toHaveProperty('username');
      expect(body).not.toHaveProperty('role');
      expect(body).not.toHaveProperty('status');
      // The masked number is never round-tripped — omitted unless retyped.
      expect(body).not.toHaveProperty('identity_document_number');
    });

    it('sends identity_document_number only when the user types a new value', async () => {
      renderPage();
      fireEvent.click(screen.getByText(L.EDIT.BUTTON));

      // The number field shows the masked current value as a PLACEHOLDER only.
      const numberInput = screen.getByPlaceholderText('••••9012');
      expect(numberInput).toHaveValue('');
      fireEvent.change(numberInput, { target: { value: 'ABCD 1234 9012' } });
      fireEvent.click(screen.getByText(L.EDIT.SAVE));

      await waitFor(() => expect(updateTrigger).toHaveBeenCalledTimes(1));
      const body = updateTrigger.mock.calls[0][0];
      expect(body.identity_document_number).toBe('ABCD 1234 9012');
      expect(body).not.toHaveProperty('email');
    });
  });

  describe('documents section', () => {
    it('renders uploaded filename and the not-uploaded state', () => {
      renderPage();
      expect(screen.getByText(L.SECTIONS.DOCUMENTS.ID_DOCUMENT)).toBeInTheDocument();
      expect(
        screen.getByText(L.SECTIONS.DOCUMENTS.PHARMACIST_CERTIFICATE)
      ).toBeInTheDocument();
      // id_document is uploaded → display filename + View + Replace.
      expect(screen.getByText('aadhaar-card.png')).toBeInTheDocument();
      expect(screen.getByText(L.SECTIONS.DOCUMENTS.VIEW)).toBeInTheDocument();
      expect(screen.getByText(L.SECTIONS.DOCUMENTS.REPLACE)).toBeInTheDocument();
      // pharmacist_certificate is not uploaded → placeholder + Upload, no View.
      expect(screen.getByText(L.SECTIONS.DOCUMENTS.NOT_UPLOADED)).toBeInTheDocument();
      expect(screen.getByText(L.SECTIONS.DOCUMENTS.UPLOAD)).toBeInTheDocument();
    });

    it('upload calls the mutation with the picked file under the right field', async () => {
      renderPage();
      // "Upload" belongs to the (missing) pharmacist_certificate row.
      fireEvent.click(screen.getByText(L.SECTIONS.DOCUMENTS.UPLOAD));

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['png-bytes'], 'certificate.png', { type: 'image/png' });
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() =>
        expect(uploadTrigger).toHaveBeenCalledWith({ pharmacist_certificate: file })
      );
    });

    it('rejects a file over 50MB client-side with a friendly error and no mutation call', async () => {
      renderPage();
      fireEvent.click(screen.getByText(L.SECTIONS.DOCUMENTS.UPLOAD));

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const bigFile = new File(['x'], 'huge.pdf', { type: 'application/pdf' });
      Object.defineProperty(bigFile, 'size', { value: 50 * 1024 * 1024 + 1 });
      fireEvent.change(input, { target: { files: [bigFile] } });

      expect(
        await screen.findByText(L.SECTIONS.DOCUMENTS.FILE_TOO_LARGE)
      ).toBeInTheDocument();
      expect(uploadTrigger).not.toHaveBeenCalled();
    });

    it('rejects an unsupported extension client-side', async () => {
      renderPage();
      fireEvent.click(screen.getByText(L.SECTIONS.DOCUMENTS.UPLOAD));

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const badFile = new File(['x'], 'notes.txt', { type: 'text/plain' });
      fireEvent.change(input, { target: { files: [badFile] } });

      expect(
        await screen.findByText(L.SECTIONS.DOCUMENTS.UNSUPPORTED_TYPE)
      ).toBeInTheDocument();
      expect(uploadTrigger).not.toHaveBeenCalled();
    });

    it('download with a non-null url opens it directly and skips the blob fallback', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
      downloadLinkTrigger.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({
          url: 'https://s3.example/presigned',
          file_name: 'aadhaar-card.png',
          file_type: 'image/png',
          expires_in: 300,
        }),
      });

      renderPage();
      fireEvent.click(screen.getByText(L.SECTIONS.DOCUMENTS.VIEW));

      await waitFor(() => {
        expect(downloadLinkTrigger).toHaveBeenCalledWith('id_document');
        expect(openSpy).toHaveBeenCalledWith(
          'https://s3.example/presigned',
          '_blank',
          'noopener,noreferrer'
        );
      });
      expect(blobTrigger).not.toHaveBeenCalled();
      openSpy.mockRestore();
    });

    it('download with url null falls back to the authenticated blob fetch', async () => {
      const blob = new Blob(['filedata']);
      downloadLinkTrigger.mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({
          url: null, // disk driver → fallback path
          file_name: 'aadhaar-card.png',
          file_type: 'image/png',
          expires_in: null,
        }),
      });
      blobTrigger.mockReturnValue({ unwrap: jest.fn().mockResolvedValue(blob) });

      // Stub the blob-save plumbing (jsdom has no createObjectURL) and neuter
      // the anchor click so no navigation is attempted.
      const createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURL = jest.fn();
      (URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL;
      (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = revokeObjectURL;
      const realCreate = document.createElement.bind(document);
      const createSpy = jest
        .spyOn(document, 'createElement')
        .mockImplementation((tag: string) => {
          const el = realCreate(tag);
          if (tag === 'a') (el as HTMLAnchorElement).click = jest.fn();
          return el;
        });

      renderPage();
      fireEvent.click(screen.getByText(L.SECTIONS.DOCUMENTS.VIEW));

      await waitFor(() => expect(blobTrigger).toHaveBeenCalledWith('id_document'));
      await waitFor(() => expect(createObjectURL).toHaveBeenCalledWith(blob));
      createSpy.mockRestore();
    });
  });
});
