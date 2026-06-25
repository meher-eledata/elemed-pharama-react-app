import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { activityApi } from '../../../../redux/slices/activityApi';
import MasterViewModal from '../MasterViewModal';
import { MASTER_VIEW_LABELS } from '../../../../config/label/MasterView.labels';
import {
  MASTER_VIEW_CONFIG,
  type MasterCategory,
} from '../../../../config/constants/MasterView.constants';

/**
 * Frontend-only feature under test: the admin-gated "Download" button on the master
 * VIEW modal. The button is rendered ONLY when `showDownload` is true AND there is at
 * least one row; clicking it exports the rows to an .xlsx file via SheetJS.
 *
 * We mock the `xlsx` module so no real file I/O happens. The component boundary we
 * assert is the call to XLSX.writeFile (the side effect that produces the download),
 * including the per-category filename from MASTER_VIEW_LABELS.DOWNLOAD_FILENAMES.
 *
 * MasterViewModal takes all of its data via props (rows + the onUpdate callback) but
 * also calls useLogDownloadMutation() (RTK Query) to record download activity, so it
 * must be rendered inside a Redux <Provider> wired with the activityApi slice.
 */

// Mock SheetJS. utils.* are no-ops that just need to exist; writeFile is the spy we assert.
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

// Imported AFTER the mock so we get the mocked module's writeFile spy.
import * as XLSX from 'xlsx';

const CUSTOMER_ROWS: Record<string, unknown>[] = [
  {
    id: 1,
    name: 'Acme Health',
    phone: '9876548919',
    email: 'acme@example.com',
    city: 'Oldtown',
    state: 'OldState',
  },
  {
    id: 2,
    name: 'Beta Care',
    phone: '9123456780',
    email: 'beta@example.com',
    city: 'Newtown',
    state: 'NewState',
  },
];

// MasterViewModal uses an RTK Query hook (useLogDownloadMutation), so it must be
// rendered inside a Provider whose store wires up the activityApi reducer + middleware.
const createStore = () =>
  configureStore({
    reducer: {
      auth: (state = { token: 'JWT123', user: null }) => state,
      [activityApi.reducerPath]: activityApi.reducer,
    },
    middleware: (gDM) => gDM().concat(activityApi.middleware),
  });

const renderModal = (
  overrides: Partial<React.ComponentProps<typeof MasterViewModal>> = {}
) => {
  const onClose = jest.fn();
  const onUpdate = jest.fn().mockResolvedValue(undefined);
  const utils = render(
    <Provider store={createStore()}>
      <MasterViewModal
        open
        category="customer"
        rows={CUSTOMER_ROWS}
        isLoading={false}
        isError={false}
        onClose={onClose}
        onUpdate={onUpdate}
        {...overrides}
      />
    </Provider>
  );
  return { onClose, onUpdate, ...utils };
};

const queryDownloadButton = () =>
  screen.queryByRole('button', { name: MASTER_VIEW_LABELS.DOWNLOAD_BUTTON });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MasterViewModal — admin download button visibility', () => {
  // A. showDownload true + non-empty rows -> button renders
  it('renders the Download button when showDownload is true and rows are non-empty', () => {
    renderModal({ showDownload: true });
    expect(queryDownloadButton()).toBeInTheDocument();
  });

  // B. showDownload false (default) -> no button
  it('does NOT render the Download button when showDownload defaults to false', () => {
    renderModal();
    expect(queryDownloadButton()).not.toBeInTheDocument();
  });

  it('does NOT render the Download button when showDownload is explicitly false', () => {
    renderModal({ showDownload: false });
    expect(queryDownloadButton()).not.toBeInTheDocument();
  });

  // C. showDownload true but rows empty -> no button
  it('does NOT render the Download button when showDownload is true but rows are empty', () => {
    renderModal({ showDownload: true, rows: [] });
    expect(queryDownloadButton()).not.toBeInTheDocument();
  });
});

describe('MasterViewModal — Download triggers the xlsx export', () => {
  // D. Clicking Download calls XLSX.writeFile with the per-category filename.
  it('calls XLSX.writeFile with the customer filename on click', () => {
    renderModal({ showDownload: true });

    fireEvent.click(queryDownloadButton()!);

    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
    const [, filename] = (XLSX.writeFile as jest.Mock).mock.calls[0];
    expect(filename).toBe(MASTER_VIEW_LABELS.DOWNLOAD_FILENAMES.customer);
  });

  it('builds the worksheet from the rows before writing the file', () => {
    renderModal({ showDownload: true });

    fireEvent.click(queryDownloadButton()!);

    // The export path runs json_to_sheet over a row-per-record array, then writes once.
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(1);
    const sheetData = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0][0];
    expect(Array.isArray(sheetData)).toBe(true);
    expect(sheetData).toHaveLength(CUSTOMER_ROWS.length);
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
  });

  it.each(['supplier', 'product', 'doctor'] as MasterCategory[])(
    'uses the %s filename when exporting that category',
    (category) => {
      // One representative row keyed by the category PK so a row is present.
      const pk = MASTER_VIEW_CONFIG[category].pkKey;
      renderModal({ showDownload: true, category, rows: [{ [pk]: 1 }] });

      fireEvent.click(queryDownloadButton()!);

      const [, filename] = (XLSX.writeFile as jest.Mock).mock.calls[0];
      expect(filename).toBe(MASTER_VIEW_LABELS.DOWNLOAD_FILENAMES[category]);
    }
  );
});

describe('MasterViewModal — customer phone is masked in the EXPORT only', () => {
  // The Phone column header from the customer config; the export keys rows by header.
  const PHONE_HEADER = MASTER_VIEW_CONFIG.customer.columns.find(
    (c) => c.key === 'phone',
  )!.header;

  // E. The xlsx export masks all but the last 4 digits of each customer phone.
  it('passes masked customer phones to XLSX.utils.json_to_sheet', () => {
    renderModal({ showDownload: true });

    fireEvent.click(queryDownloadButton()!);

    const sheetData = (XLSX.utils.json_to_sheet as jest.Mock).mock
      .calls[0][0] as Record<string, string>[];
    expect(sheetData).toHaveLength(CUSTOMER_ROWS.length);
    expect(sheetData[0][PHONE_HEADER]).toBe('******8919');
    expect(sheetData[1][PHONE_HEADER]).toBe('******6780');
    // Sanity: the raw (unmasked) phone never reaches the export.
    expect(sheetData[0][PHONE_HEADER]).not.toBe('9876548919');
  });

  // F. The on-screen table shows the MASKED phone (last 4 digits only) for customers.
  it('renders the masked phone in the on-screen table', () => {
    renderModal({ showDownload: true });

    expect(screen.getByText('******8919')).toBeInTheDocument();
    expect(screen.getByText('******6780')).toBeInTheDocument();
    // The raw, unmasked phone is never shown on screen.
    expect(screen.queryByText('9876548919')).not.toBeInTheDocument();
    expect(screen.queryByText('9123456780')).not.toBeInTheDocument();
  });

  // G. (optional) supplier/doctor phones are NOT masked in the export.
  it('does NOT mask supplier phone in the export', () => {
    renderModal({
      showDownload: true,
      category: 'supplier',
      rows: [{ id: 1, supplier_name: 'S1', phone_number: '9876548919' }],
    });

    fireEvent.click(queryDownloadButton()!);

    const supplierPhoneHeader = MASTER_VIEW_CONFIG.supplier.columns.find(
      (c) => c.key === 'phone_number',
    )!.header;
    const sheetData = (XLSX.utils.json_to_sheet as jest.Mock).mock
      .calls[0][0] as Record<string, string>[];
    expect(sheetData[0][supplierPhoneHeader]).toBe('9876548919');
  });

  it('masks doctor phone in the export (last 4 digits only)', () => {
    renderModal({
      showDownload: true,
      category: 'doctor',
      rows: [{ id: 1, name: 'Dr. A', phone: '9876548919' }],
    });

    fireEvent.click(queryDownloadButton()!);

    const doctorPhoneHeader = MASTER_VIEW_CONFIG.doctor.columns.find(
      (c) => c.key === 'phone',
    )!.header;
    const sheetData = (XLSX.utils.json_to_sheet as jest.Mock).mock
      .calls[0][0] as Record<string, string>[];
    expect(sheetData[0][doctorPhoneHeader]).toBe('******8919');
    expect(sheetData[0][doctorPhoneHeader]).not.toBe('9876548919');
  });
});

describe('MasterViewModal — doctor view shows only Name + masked Phone', () => {
  const DOCTOR_ROWS: Record<string, unknown>[] = [
    { id: 1, name: 'Dr. A', phone: '9876548919', email: 'a@example.com', city: 'Oldtown' },
  ];

  it('renders exactly the Name and Phone column headers for doctors', () => {
    renderModal({ category: 'doctor', rows: DOCTOR_ROWS });

    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent);
    expect(headers).toContain('Name');
    expect(headers).toContain('Phone');
    expect(headers).not.toContain('Email');
    expect(headers).not.toContain('City');
    expect(headers).not.toContain('ID');
    expect(headers).not.toContain('Branch');
  });

  it('renders the masked doctor phone on screen', () => {
    renderModal({ category: 'doctor', rows: DOCTOR_ROWS });

    expect(screen.getByText('******8919')).toBeInTheDocument();
    expect(screen.queryByText('9876548919')).not.toBeInTheDocument();
  });
});

describe('MasterViewModal — customer view shows only Name + masked Phone', () => {
  it('renders exactly the Name and Phone column headers', () => {
    renderModal();

    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent);
    // Name + Phone + the Actions column header.
    expect(headers).toContain('Name');
    expect(headers).toContain('Phone');
    expect(headers).not.toContain('City');
    expect(headers).not.toContain('State');
    expect(headers).not.toContain('Email');
    expect(headers).not.toContain('ID');
  });

  it('does not render other customer columns (city/state/email) in the view', () => {
    renderModal();

    // Values from CUSTOMER_ROWS for city/state/email must not appear in the table.
    expect(screen.queryByText('Oldtown')).not.toBeInTheDocument();
    expect(screen.queryByText('OldState')).not.toBeInTheDocument();
    expect(screen.queryByText('acme@example.com')).not.toBeInTheDocument();
    // Names still render.
    expect(screen.getByText('Acme Health')).toBeInTheDocument();
  });
});
