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
  SupplierReturnRow,
} from '../../../../redux/slices/supplierReturnsApi';

const theme = createTheme();
const mockNavigate = jest.fn();

jest.mock('../../../../redux/slices/supplierReturnsApi');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../components/PharmaTable', () => ({
  ReusableTable: ({ data, columns }: any) => (
    <div data-testid="reusable-table">
      <div data-testid="table-data-count">{data?.length || 0}</div>
      {data?.map((row: any, idx: number) => (
        <div key={row.supplier_return_id ?? idx} data-testid={`table-row-${idx}`}>
          {columns.map((col: any) => (
            <div key={col.key} data-testid={`cell-${col.key}-${idx}`}>
              {col.render ? col.render(row) : row[col.key]}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

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

const listResult = (data: any, extra: Record<string, unknown> = {}) =>
  ({ data, isLoading: false, isFetching: false, error: null, refetch: jest.fn(), ...extra } as any);

let recordCreditTrigger: jest.Mock;

const wireDefaults = ({ total = rows.length }: { total?: number } = {}) => {
  mockUseListReturnsQuery.mockReturnValue(listResult({ rows, total }));
  mockUseGetReturnDetailsQuery.mockReturnValue(
    ({ data: undefined, isFetching: false, error: null } as any)
  );
  recordCreditTrigger = jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue({}) }));
  mockUseRecordCreditReceivedMutation.mockReturnValue([
    recordCreditTrigger,
    { isLoading: false },
  ] as any);
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
      expect(screen.getByText('Credit received recorded.')).toBeInTheDocument();
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

  describe('details modal', () => {
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
