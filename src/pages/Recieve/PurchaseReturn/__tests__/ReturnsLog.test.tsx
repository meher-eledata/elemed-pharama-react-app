import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import ReturnsLog from '../ReturnsLog';
import {
  useListReturnsQuery,
  useGetReturnDetailsQuery,
  useRecordCreditReceivedMutation,
  useUploadCreditNoteFileMutation,
  useLazyGetCreditNoteFileLinkQuery,
  useLazyGetCreditNoteFileQuery,
  SupplierReturnRow,
} from '../../../../redux/slices/supplierReturnsApi';
import { useGetSuppliersQuery } from '../../../../redux/slices/masterApi';

const theme = createTheme();
const mockNavigate = jest.fn();

jest.mock('../../../../redux/slices/supplierReturnsApi');
jest.mock('../../../../redux/slices/masterApi');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Stub exposes the client-side page state and the footer (a real <tr>, so it is
// mounted inside a table to keep the DOM valid).
jest.mock('../../../../components/PharmaTable', () => ({
  ReusableTable: ({ data, columns, emptyMessage, currentPage, onPageChange, footerContent }: any) => (
    <div data-testid="reusable-table">
      <div data-testid="table-data-count">{data?.length || 0}</div>
      <div data-testid="table-current-page">{currentPage}</div>
      <button onClick={() => onPageChange(2)}>go-page-2</button>
      {(!data || data.length === 0) && <div data-testid="table-empty">{emptyMessage}</div>}
      {data?.map((row: any, idx: number) => (
        <div key={row.supplier_return_id ?? idx} data-testid={`table-row-${idx}`}>
          {columns.map((col: any) => (
            <div key={col.key} data-testid={`cell-${col.key}-${idx}`}>
              {col.render ? col.render(row) : row[col.key]}
            </div>
          ))}
        </div>
      ))}
      <table>
        <tbody data-testid="table-footer">{footerContent}</tbody>
      </table>
    </div>
  ),
}));

// The real DateRangeFilter drives an MUI calendar; swap in buttons that push a
// fixed Dayjs range so the date-filter wiring is still exercised.
jest.mock('../../../../components/mainDashboard/DateRangeFilter/DateRangeFilter', () => {
  const dayjsLib = require('dayjs');
  return {
    __esModule: true,
    default: ({ onDateRangeChange }: { onDateRangeChange: (r: [unknown, unknown]) => void }) => (
      <div>
        <span>Filter by Dates</span>
        <button onClick={() => onDateRangeChange([dayjsLib('2026-07-01'), dayjsLib('2026-07-31')])}>
          set-range
        </button>
        <button onClick={() => onDateRangeChange([null, null])}>clear-range</button>
      </div>
    ),
  };
});

jest.mock('../../../../components/CommonModal/CommonModal', () => ({
  __esModule: true,
  default: ({ open, onClose, title, content, actionButtons }: any) =>
    open ? (
      <div data-testid="common-modal">
        <div>{title}</div>
        {content}
        {actionButtons}
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

// PharmaDatePicker needs a LocalizationProvider; mock the Common barrel with a
// plain input (StandardButton kept as a plain button).
jest.mock('../../../../components/Common', () => ({
  StandardButton: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  PharmaDatePicker: ({ value, onChange }: any) => (
    <input
      data-testid="date-picker"
      value={value ? value.format('YYYY-MM-DD') : ''}
      onChange={() => onChange(value)}
      readOnly
    />
  ),
}));

const makeRow = (over: Partial<SupplierReturnRow> = {}): SupplierReturnRow => ({
  supplier_return_id: 42,
  return_number: 'SR-000042',
  supplier_id: 3,
  supplier_name: 'SupCo',
  return_date: '2026-08-11T09:00:00.000Z',
  created_by: 'currentUser',
  reason: null,
  notes: null,
  return_status: 'AWAITING_CREDIT',
  gst_treatment: 'WITH_GST',
  value_basis: 'PURCHASE_PRICE',
  settlement_mode: 'CREDIT_NOTE',
  settlement_reference: null,
  taxable_value: 30,
  cgst_amount: 1.8,
  sgst_amount: 1.8,
  total_amount: 33.6,
  credit_received_amount: null,
  credit_received_date: null,
  credit_received_reference: null,
  credit_note_file_name: null,
  credit_note_file_uploaded_at: null,
  line_count: 1,
  units_count: 3,
  ...over,
});

const rows: SupplierReturnRow[] = [
  makeRow(),
  makeRow({
    supplier_return_id: 43,
    return_number: 'SR-000043',
    supplier_name: 'OtherCo',
    return_status: 'SETTLED',
    settlement_mode: 'CASH',
  }),
  makeRow({
    supplier_return_id: 44,
    return_number: 'SR-000044',
    return_status: 'CREDIT_RECEIVED',
    credit_received_date: '2026-08-10',
    credit_received_reference: 'CN-9',
  }),
];

const mockUseListReturnsQuery = useListReturnsQuery as jest.MockedFunction<
  typeof useListReturnsQuery
>;
const mockUseGetReturnDetailsQuery = useGetReturnDetailsQuery as jest.MockedFunction<
  typeof useGetReturnDetailsQuery
>;
const mockUseRecordCreditReceivedMutation =
  useRecordCreditReceivedMutation as jest.MockedFunction<typeof useRecordCreditReceivedMutation>;
const mockUseUploadCreditNoteFileMutation =
  useUploadCreditNoteFileMutation as jest.MockedFunction<typeof useUploadCreditNoteFileMutation>;
const mockUseLazyGetCreditNoteFileLinkQuery =
  useLazyGetCreditNoteFileLinkQuery as jest.MockedFunction<typeof useLazyGetCreditNoteFileLinkQuery>;
const mockUseLazyGetCreditNoteFileQuery =
  useLazyGetCreditNoteFileQuery as jest.MockedFunction<typeof useLazyGetCreditNoteFileQuery>;
const mockUseGetSuppliersQuery = useGetSuppliersQuery as jest.MockedFunction<
  typeof useGetSuppliersQuery
>;

const SUPPLIERS = [
  { id: 3, supplier_name: 'SupCo' },
  { id: 7, supplier_name: 'OtherCo' },
];

const listResult = (data: any, extra: Record<string, unknown> = {}) =>
  ({ data, isLoading: false, isFetching: false, error: null, refetch: jest.fn(), ...extra } as any);

const lastListArgs = () =>
  mockUseListReturnsQuery.mock.calls.at(-1)![0] as Record<string, unknown>;

// jsdom lacks the object-URL APIs; the blob-fallback view path and the upload
// control's image preview/cleanup need them.
if (typeof URL.createObjectURL !== 'function') {
  (URL as any).createObjectURL = () => 'blob:mock-url';
}
if (typeof URL.revokeObjectURL !== 'function') {
  (URL as any).revokeObjectURL = () => { };
}

let recordCreditTrigger: jest.Mock;
let uploadTrigger: jest.Mock;
let fileLinkTrigger: jest.Mock;
let fileBlobTrigger: jest.Mock;

const wireDefaults = ({ total = rows.length }: { total?: number } = {}) => {
  mockUseListReturnsQuery.mockReturnValue(
    listResult({ rows, total, total_amount_owed: 4200, total_awaiting_credit: 1200 })
  );
  mockUseGetSuppliersQuery.mockReturnValue({ data: SUPPLIERS } as any);
  mockUseGetReturnDetailsQuery.mockReturnValue(
    ({ data: undefined, isFetching: false, error: null } as any)
  );
  recordCreditTrigger = jest.fn(() => ({
    unwrap: jest.fn().mockResolvedValue({
      message: 'Credit received recorded',
      supplier_return_id: 42,
      return_number: 'SR-000042',
      return_status: 'CREDIT_RECEIVED',
      credit_received: {
        amount: 33.6,
        date: '2026-08-11',
        reference: null,
        by: 'currentUser',
        cumulative_received: 33.6,
        remaining: 0,
        fully_received: true,
      },
    }),
  }));
  mockUseRecordCreditReceivedMutation.mockReturnValue([
    recordCreditTrigger,
    { isLoading: false },
  ] as any);
  uploadTrigger = jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue({}) }));
  mockUseUploadCreditNoteFileMutation.mockReturnValue([
    uploadTrigger,
    { isLoading: false },
  ] as any);
  fileLinkTrigger = jest.fn(() => ({
    unwrap: jest
      .fn()
      .mockResolvedValue({ url: 'https://s3/presigned-cn', name: 'cn.png', type: 'image/png' }),
  }));
  mockUseLazyGetCreditNoteFileLinkQuery.mockReturnValue([fileLinkTrigger, {} as any] as any);
  fileBlobTrigger = jest.fn(() => ({
    unwrap: jest.fn().mockResolvedValue(new Blob(['x'], { type: 'image/png' })),
  }));
  mockUseLazyGetCreditNoteFileQuery.mockReturnValue([fileBlobTrigger, {} as any] as any);
};

const createMockStore = () =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
    },
  });

const renderPage = () =>
  render(
    <Provider store={createMockStore()}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <ReturnsLog />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );

describe('ReturnsLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    wireDefaults();
  });

  describe('rendering & per-status action column', () => {
    it('renders the returns with ref, supplier and status', () => {
      renderPage();
      expect(screen.getByText('Purchase Returns Log')).toBeInTheDocument();
      expect(screen.getByText('SR-000042')).toBeInTheDocument();
      expect(screen.getByText('SR-000043')).toBeInTheDocument();
      expect(screen.getAllByText('SupCo')).toHaveLength(2); // rows 0 and 2
      expect(screen.getByText('OtherCo')).toBeInTheDocument();
    });

    it('AWAITING_CREDIT shows the record button; CREDIT_RECEIVED and SETTLED show summaries', () => {
      renderPage();
      // Only the AWAITING_CREDIT row gets the action button.
      expect(screen.getAllByText('Record credit received')).toHaveLength(1);
      expect(
        within(screen.getByTestId('cell-action-0')).getByText('Record credit received')
      ).toBeInTheDocument();
      expect(
        within(screen.getByTestId('cell-action-1')).getByText('Settled via Cash')
      ).toBeInTheDocument();
      expect(
        within(screen.getByTestId('cell-action-2')).getByText(/Credit received .*CN-9/)
      ).toBeInTheDocument();
    });
  });

  describe('status filter', () => {
    it('queries without a status key by default (All)', () => {
      renderPage();
      const args = mockUseListReturnsQuery.mock.calls[0][0] as Record<string, unknown>;
      expect(args).toMatchObject({ limit: 200, offset: 0 });
      expect(args).not.toHaveProperty('status');
    });

    it('passes the selected status to list-returns', async () => {
      renderPage();
      // Status Select shows 'All' by default.
      fireEvent.mouseDown(screen.getByText('All'));
      fireEvent.click(within(screen.getByRole('listbox')).getByText('Awaiting credit'));

      await waitFor(() => {
        const lastArgs = mockUseListReturnsQuery.mock.calls.at(-1)![0] as Record<string, unknown>;
        expect(lastArgs).toMatchObject({ status: 'AWAITING_CREDIT', limit: 200, offset: 0 });
      });
    });
  });

  describe('supplier + date-range filters (server-side)', () => {
    const selectSupplier = (label: string) => {
      fireEvent.mouseDown(screen.getByPlaceholderText('All suppliers'));
      fireEvent.click(within(screen.getByRole('listbox')).getByText(label));
    };

    it('sends neither supplier_id nor the dates until they are set', () => {
      renderPage();
      const args = lastListArgs();
      expect(args).not.toHaveProperty('supplier_id');
      expect(args).not.toHaveProperty('start_date');
      expect(args).not.toHaveProperty('end_date');
    });

    it('passes the picked date range as start_date / end_date and drops them on clear', async () => {
      renderPage();
      fireEvent.click(screen.getByText('set-range'));
      await waitFor(() =>
        expect(lastListArgs()).toMatchObject({
          start_date: '2026-07-01',
          end_date: '2026-07-31',
          limit: 200,
          offset: 0,
        })
      );

      fireEvent.click(screen.getByText('clear-range'));
      await waitFor(() => expect(lastListArgs()).not.toHaveProperty('start_date'));
      expect(lastListArgs()).not.toHaveProperty('end_date');
    });

    it('passes the selected supplier as supplier_id', async () => {
      renderPage();
      selectSupplier('OtherCo');
      await waitFor(() => expect(lastListArgs()).toMatchObject({ supplier_id: 7 }));
    });

    it('ANDs supplier, dates, status and the free-text search in one request', async () => {
      renderPage();
      selectSupplier('SupCo');
      fireEvent.click(screen.getByText('set-range'));
      fireEvent.mouseDown(screen.getByText('All'));
      fireEvent.click(within(screen.getByRole('listbox')).getByText('Awaiting credit'));
      fireEvent.change(screen.getByPlaceholderText('Search by return ref or supplier...'), {
        target: { value: 'SR-0000' },
      });

      await waitFor(
        () =>
          expect(lastListArgs()).toEqual({
            limit: 200,
            offset: 0,
            search: 'SR-0000',
            status: 'AWAITING_CREDIT',
            supplier_id: 3,
            start_date: '2026-07-01',
            end_date: '2026-07-31',
          }),
        { timeout: 2000 }
      );
    });

    it('Reset clears every filter and is hidden until one is set', async () => {
      renderPage();
      expect(screen.queryByText('Reset filters')).not.toBeInTheDocument();

      selectSupplier('SupCo');
      fireEvent.click(screen.getByText('set-range'));
      fireEvent.click(await screen.findByText('Reset filters'));

      await waitFor(() =>
        expect(lastListArgs()).toEqual({ limit: 200, offset: 0 })
      );
      expect(screen.queryByText('Reset filters')).not.toBeInTheDocument();
    });

    it('resets pagination to page 1 whenever a filter changes', async () => {
      renderPage();
      const page = () => screen.getByTestId('table-current-page').textContent;

      fireEvent.click(screen.getByText('go-page-2'));
      expect(page()).toBe('2');
      fireEvent.click(screen.getByText('set-range'));
      expect(page()).toBe('1');

      fireEvent.click(screen.getByText('go-page-2'));
      expect(page()).toBe('2');
      selectSupplier('SupCo');
      await waitFor(() => expect(page()).toBe('1'));
    });
  });

  describe('amount-owed footer total', () => {
    const footer = () => within(screen.getByTestId('table-footer'));

    it('renders the SERVER total for the whole filtered set, not a sum of the fetched rows', () => {
      // rows sum to 100.80 — the footer must show the server aggregate instead.
      wireDefaults({ total: 300 });
      renderPage();
      expect(footer().getByText('₹4,200.00')).toBeInTheDocument();
      expect(footer().getByText('Total owed')).toBeInTheDocument();
      expect(footer().getByText('all 300 returns')).toBeInTheDocument();
      expect(footer().getByText('₹1,200.00 still awaiting credit')).toBeInTheDocument();
    });

    it('hides the awaiting-credit line when it equals the headline total', () => {
      mockUseListReturnsQuery.mockReturnValue(
        listResult({ rows, total: 3, total_amount_owed: 900, total_awaiting_credit: 900 })
      );
      renderPage();
      expect(footer().getByText('₹900.00')).toBeInTheDocument();
      expect(footer().queryByText(/still awaiting credit/)).not.toBeInTheDocument();
    });

    it('updates when a filter changes', async () => {
      renderPage();
      expect(footer().getByText('₹4,200.00')).toBeInTheDocument();

      mockUseListReturnsQuery.mockReturnValue(
        listResult({ rows: [rows[0]], total: 1, total_amount_owed: 33.6, total_awaiting_credit: 33.6 })
      );
      fireEvent.click(screen.getByText('set-range'));

      await waitFor(() => expect(footer().getByText('₹33.60')).toBeInTheDocument());
      expect(footer().getByText('all 1 return')).toBeInTheDocument();
    });

    it('suppresses the footer entirely for an empty result set', () => {
      // "Total owed ₹0.00 / all 0 returns" under the empty-state message is noise —
      // the empty-state message already communicates the zero.
      mockUseListReturnsQuery.mockReturnValue(
        listResult({ rows: [], total: 0, total_amount_owed: 0, total_awaiting_credit: 0 })
      );
      renderPage();
      expect(footer().queryByText('Total owed')).not.toBeInTheDocument();
      expect(footer().queryByText(/all 0 returns/)).not.toBeInTheDocument();
    });

    it('falls back to a zero total (never blank or NaN) when the server omits the aggregates', () => {
      mockUseListReturnsQuery.mockReturnValue(listResult({ rows, total: 3 }));
      renderPage();
      expect(footer().getByText('₹0.00')).toBeInTheDocument();
      expect(footer().getByText('all 3 returns')).toBeInTheDocument();
    });
  });

  describe('record-credit modal flow', () => {
    const openModal = () => {
      fireEvent.click(screen.getByText('Record credit received'));
      return screen.getByTestId('common-modal');
    };
    const amountInput = () =>
      within(screen.getByTestId('common-modal')).getByRole('spinbutton') as HTMLInputElement;
    const submitButton = () =>
      within(screen.getByTestId('common-modal')).getByText('Record Credit');

    it('opens prefilled with the amount owed and today in the date picker', () => {
      renderPage();
      openModal();
      expect(screen.getByText('Record Credit Received')).toBeInTheDocument();
      expect(amountInput()).toHaveValue(33.6);
      expect((screen.getByTestId('date-picker') as HTMLInputElement).value).toMatch(
        /^\d{4}-\d{2}-\d{2}$/
      );
    });

    it('rejects a non-positive amount client-side without firing the mutation', async () => {
      renderPage();
      openModal();
      fireEvent.change(amountInput(), { target: { value: '0' } });
      fireEvent.click(submitButton());

      expect(await screen.findByText('Enter an amount greater than 0.')).toBeInTheDocument();
      expect(recordCreditTrigger).not.toHaveBeenCalled();
    });

    it('submits { supplier_return_id, amount, date, reference } and closes with a success snackbar', async () => {
      renderPage();
      openModal();
      fireEvent.change(amountInput(), { target: { value: '30' } });
      const referenceInput = within(screen.getByTestId('common-modal'))
        .getByPlaceholderText(/Credit note \/ reference number/i);
      fireEvent.change(referenceInput, { target: { value: '  CN-9  ' } });
      fireEvent.click(submitButton());

      await waitFor(() =>
        expect(recordCreditTrigger).toHaveBeenCalledWith({
          supplier_return_id: 42,
          amount: 30,
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          reference: 'CN-9', // trimmed
        })
      );
      await waitFor(() =>
        expect(screen.queryByTestId('common-modal')).not.toBeInTheDocument()
      );
      expect(screen.getByText('Credit fully received.')).toBeInTheDocument();
    });

    it('omits the reference key when left blank', async () => {
      renderPage();
      openModal();
      fireEvent.click(submitButton()); // prefilled amount 33.6, no reference

      await waitFor(() => expect(recordCreditTrigger).toHaveBeenCalledTimes(1));
      const body = recordCreditTrigger.mock.calls[0][0];
      expect(body).not.toHaveProperty('reference');
      expect(body.amount).toBe(33.6);
    });

    it('shows the API error (e.g. 409 non-AWAITING) inside the modal and keeps it open', async () => {
      recordCreditTrigger = jest.fn(() => ({
        unwrap: jest.fn().mockRejectedValue({
          status: 409,
          data: {
            error: 'Credit can only be recorded while status is AWAITING_CREDIT (current: SETTLED)',
          },
        }),
      }));
      mockUseRecordCreditReceivedMutation.mockReturnValue([
        recordCreditTrigger,
        { isLoading: false },
      ] as any);

      renderPage();
      openModal();
      fireEvent.click(submitButton());

      expect(
        await screen.findByText(/Credit can only be recorded while status is AWAITING_CREDIT/)
      ).toBeInTheDocument();
      expect(screen.getByTestId('common-modal')).toBeInTheDocument();
    });
  });

  describe('partial credit (FIX #2)', () => {
    const partialList = () =>
      mockUseListReturnsQuery.mockReturnValue(
        listResult({
          rows: [makeRow({ credit_received_amount: 10, total_amount: 33.6 })],
          total: 1,
          total_amount_owed: 33.6,
          total_awaiting_credit: 23.6,
        })
      );

    it('keeps AWAITING_CREDIT and shows progress + a Record remaining button', () => {
      partialList();
      renderPage();
      const action = within(screen.getByTestId('cell-action-0'));
      expect(action.getByText('₹10.00 of ₹33.60 received')).toBeInTheDocument();
      expect(action.getByText('Record remaining')).toBeInTheDocument();
      // Status chip still Awaiting credit while only partially received.
      expect(
        within(screen.getByTestId('cell-return_status-0')).getByText('Awaiting credit')
      ).toBeInTheDocument();
    });

    it('prefills the record modal with the REMAINING amount, not the full total', () => {
      partialList();
      renderPage();
      fireEvent.click(screen.getByText('Record remaining'));
      const amount = within(screen.getByTestId('common-modal')).getByRole(
        'spinbutton'
      ) as HTMLInputElement;
      expect(amount).toHaveValue(23.6); // 33.6 total − 10 received
    });

    it('rejects an amount above the remaining owed without firing the mutation', async () => {
      partialList();
      renderPage();
      fireEvent.click(screen.getByText('Record remaining'));
      const modal = within(screen.getByTestId('common-modal'));
      fireEvent.change(modal.getByRole('spinbutton'), { target: { value: '30' } }); // > 23.6
      fireEvent.click(modal.getByText('Record Credit'));

      expect(await screen.findByText(/Amount cannot exceed the remaining ₹23.60/)).toBeInTheDocument();
      expect(recordCreditTrigger).not.toHaveBeenCalled();
    });

    it('shows a "partial credit recorded" snackbar when the server reports not fully received', async () => {
      recordCreditTrigger = jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue({
          message: 'Credit received recorded',
          supplier_return_id: 42,
          return_number: 'SR-000042',
          return_status: 'AWAITING_CREDIT',
          credit_received: {
            amount: 10,
            date: '2026-08-11',
            reference: null,
            by: 'currentUser',
            cumulative_received: 10,
            remaining: 23.6,
            fully_received: false,
          },
        }),
      }));
      mockUseRecordCreditReceivedMutation.mockReturnValue([
        recordCreditTrigger,
        { isLoading: false },
      ] as any);
      mockUseListReturnsQuery.mockReturnValue(listResult({ rows: [makeRow()], total: 1 }));
      renderPage();
      fireEvent.click(screen.getByText('Record credit received'));
      const modal = within(screen.getByTestId('common-modal'));
      fireEvent.change(modal.getByRole('spinbutton'), { target: { value: '10' } });
      fireEvent.click(modal.getByText('Record Credit'));

      await waitFor(() =>
        expect(screen.getByText('Partial credit recorded, ₹23.60 remaining.')).toBeInTheDocument()
      );
    });
  });

  describe('credit-note attachment', () => {
    const cnFile = () => new File(['scan'], 'cn.png', { type: 'image/png' });
    const openModal = () => fireEvent.click(screen.getByText('Record credit received'));
    const selectFile = () =>
      fireEvent.change(screen.getByTestId('credit-note-file-input'), {
        target: { files: [cnFile()] },
      });
    const submitButton = () =>
      within(screen.getByTestId('common-modal')).getByText('Record Credit');

    let openSpy: jest.SpyInstance;
    beforeEach(() => {
      openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    });
    afterEach(() => openSpy.mockRestore());

    it('uploads the selected file with the return id after recording credit', async () => {
      renderPage();
      openModal();
      selectFile();
      expect(within(screen.getByTestId('common-modal')).getByText('cn.png')).toBeInTheDocument();
      fireEvent.click(submitButton());

      await waitFor(() => expect(recordCreditTrigger).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(uploadTrigger).toHaveBeenCalledWith({
          supplierReturnId: 42,
          file: expect.any(File),
        })
      );
      expect((uploadTrigger.mock.calls[0][0].file as File).name).toBe('cn.png');
      await waitFor(() =>
        expect(screen.queryByTestId('common-modal')).not.toBeInTheDocument()
      );
      expect(screen.getByText('Credit fully received.')).toBeInTheDocument();
    });

    it('does not upload when no file is selected', async () => {
      renderPage();
      openModal();
      fireEvent.click(submitButton());
      await waitFor(() => expect(recordCreditTrigger).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(screen.queryByTestId('common-modal')).not.toBeInTheDocument()
      );
      expect(uploadTrigger).not.toHaveBeenCalled();
    });

    it('a failed upload is NON-FATAL: credit still recorded, warning snackbar shown', async () => {
      uploadTrigger = jest.fn(() => ({
        unwrap: jest.fn().mockRejectedValue({ status: 500, data: { error: 'Server error' } }),
      }));
      mockUseUploadCreditNoteFileMutation.mockReturnValue([
        uploadTrigger,
        { isLoading: false },
      ] as any);

      renderPage();
      openModal();
      selectFile();
      fireEvent.click(submitButton());

      await waitFor(() => expect(recordCreditTrigger).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(
          screen.getByText('Credit recorded, but the attachment failed to upload.')
        ).toBeInTheDocument()
      );
      expect(screen.queryByTestId('common-modal')).not.toBeInTheDocument();
    });

    it('shows an existing file with View + replace affordance, opening the presigned link', async () => {
      mockUseListReturnsQuery.mockReturnValue(
        listResult({
          rows: [
            makeRow({
              credit_note_file_name: 'cn-42.png',
              credit_note_file_uploaded_at: '2026-08-11T10:00:00.000Z',
            }),
          ],
          total: 1,
        })
      );
      renderPage();
      openModal();

      const modal = within(screen.getByTestId('common-modal'));
      expect(modal.getByText('Attached credit note')).toBeInTheDocument();
      expect(modal.getByText('cn-42.png')).toBeInTheDocument();
      expect(modal.getByText('Replace credit note photo/scan')).toBeInTheDocument();

      fireEvent.click(modal.getByText('View'));
      await waitFor(() => expect(fileLinkTrigger).toHaveBeenCalledWith(42));
      await waitFor(() =>
        expect(openSpy).toHaveBeenCalledWith(
          'https://s3/presigned-cn',
          '_blank',
          'noopener,noreferrer'
        )
      );
      expect(fileBlobTrigger).not.toHaveBeenCalled();
    });

    it('falls back to the authenticated blob fetch when the link url is null (disk driver)', async () => {
      fileLinkTrigger = jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue({ url: null, name: 'cn-42.png', type: 'image/png' }),
      }));
      mockUseLazyGetCreditNoteFileLinkQuery.mockReturnValue([fileLinkTrigger, {} as any] as any);
      mockUseListReturnsQuery.mockReturnValue(
        listResult({ rows: [makeRow({ credit_note_file_name: 'cn-42.png' })], total: 1 })
      );
      renderPage();
      openModal();

      fireEvent.click(within(screen.getByTestId('common-modal')).getByText('View'));
      await waitFor(() => expect(fileBlobTrigger).toHaveBeenCalledWith(42));
      await waitFor(() =>
        expect(openSpy).toHaveBeenCalledWith(
          expect.stringContaining('blob:'),
          '_blank',
          'noopener,noreferrer'
        )
      );
    });

    it('shows a "View credit note" link in the return-details modal when a file exists', async () => {
      mockUseGetReturnDetailsQuery.mockReturnValue(
        ({
          data: {
            id: 42,
            supplier_return_id: 42,
            return_number: 'SR-000042',
            supplier_name: 'SupCo',
            return_date: '2026-08-11T09:00:00.000Z',
            created_by: 'currentUser',
            return_status: 'AWAITING_CREDIT',
            gst_treatment: 'WITH_GST',
            value_basis: 'PURCHASE_PRICE',
            settlement_mode: 'CREDIT_NOTE',
            settlement_reference: null,
            taxable_value: 30,
            cgst_amount: 1.8,
            sgst_amount: 1.8,
            total_amount: 33.6,
            credit_received_date: null,
            credit_received_reference: null,
            credit_note_file_name: 'cn-42.png',
            credit_note_file_uploaded_at: '2026-08-11T10:00:00.000Z',
            reason: null,
            notes: null,
            lines: [],
          },
          isFetching: false,
          error: null,
        } as any)
      );
      renderPage();
      fireEvent.click(screen.getByText('SR-000042'));

      const modal = within(await screen.findByTestId('common-modal'));
      expect(modal.getByText('Credit note file')).toBeInTheDocument();
      fireEvent.click(modal.getByText('cn-42.png'));
      await waitFor(() => expect(fileLinkTrigger).toHaveBeenCalledWith(42));
      await waitFor(() => expect(openSpy).toHaveBeenCalled());
    });
  });

  describe('details modal', () => {
    it('shows IGST (not CGST/SGST) for an inter-state return so Taxable + tax == Total', async () => {
      mockUseGetReturnDetailsQuery.mockReturnValue(
        ({
          data: {
            id: 42,
            supplier_return_id: 42,
            return_number: 'SR-000042',
            supplier_name: 'SupCo',
            return_date: '2026-08-11T09:00:00.000Z',
            created_by: 'currentUser',
            return_status: 'AWAITING_CREDIT',
            gst_treatment: 'WITH_GST',
            value_basis: 'PURCHASE_PRICE',
            settlement_mode: 'CREDIT_NOTE',
            settlement_reference: null,
            taxable_value: 30,
            cgst_amount: 0,
            sgst_amount: 0,
            igst_amount: 3.6,
            total_amount: 33.6,
            credit_received_date: null,
            credit_received_reference: null,
            credit_note_file_name: null,
            credit_note_file_uploaded_at: null,
            reason: null,
            notes: null,
            lines: [],
          },
          isFetching: false,
          error: null,
        } as any)
      );
      renderPage();
      fireEvent.click(screen.getByText('SR-000042'));

      const modal = within(await screen.findByTestId('common-modal'));
      expect(modal.getByText('IGST')).toBeInTheDocument();
      expect(modal.getByText('₹3.60')).toBeInTheDocument();
      expect(modal.queryByText('CGST')).not.toBeInTheDocument();
      expect(modal.queryByText('SGST')).not.toBeInTheDocument();
    });

    it('clicking a return ref requests its details', async () => {
      renderPage();
      // Skipped while no row is selected.
      expect(mockUseGetReturnDetailsQuery.mock.calls[0][1]).toMatchObject({ skip: true });

      fireEvent.click(screen.getByText('SR-000042'));
      await waitFor(() => {
        const lastCall = mockUseGetReturnDetailsQuery.mock.calls.at(-1)!;
        expect(lastCall[0]).toEqual({ supplier_return_id: 42 });
        expect(lastCall[1]).toMatchObject({ skip: false });
      });
    });
  });

  describe('truncation notice', () => {
    it('shows "Showing first N of M returns" when total exceeds the fetched rows', () => {
      wireDefaults({ total: 300 });
      renderPage();
      expect(screen.getByText('Showing first 3 of 300 returns')).toBeInTheDocument();
    });

    it('hides the notice when everything fits in one fetch', () => {
      renderPage(); // total === rows.length
      expect(screen.queryByText(/Showing first/)).not.toBeInTheDocument();
    });
  });

  it('navigates back to the Purchase Return landing page', () => {
    renderPage();
    fireEvent.click(screen.getByText('Back to Purchase Return'));
    expect(mockNavigate).toHaveBeenCalledWith('/receive/purchase-return');
  });
});
