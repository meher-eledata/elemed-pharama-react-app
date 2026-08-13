import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import SalesReturnsLog from '../SalesReturnsLog';
import {
  useListSalesReturnsQuery,
  useGetSalesReturnDetailsQuery,
  SalesReturnRow,
  SalesReturnLine,
  SalesReturnDetailsResponse,
} from '../../../../redux/slices/salesApi';
import { SALES_RETURNS_LOG_CONSTANTS as C } from '../../../../config/constants/SalesReturnsLog.constants';

// Sale History → "Returns" tab. Contract: api-contract.md
// "POST /api/sales/list-sales-returns" + "POST /api/sales/get-sales-return-details".
// Setup mirrors src/pages/Recieve/PurchaseReturn/__tests__/ReturnsLog.test.tsx
// (store/provider/router + mocked RTK Query hooks + stubbed table/modal).

const theme = createTheme();
const mockNavigate = jest.fn();

jest.mock('../../../../redux/slices/salesApi');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// ReusableTable stubbed to expose each column's rendered cell directly, plus the
// emptyMessage the component passes when there are no rows.
jest.mock('../../../../components/PharmaTable', () => ({
  ReusableTable: ({ data, columns, emptyMessage }: any) => (
    <div data-testid="reusable-table">
      <div data-testid="table-data-count">{data?.length || 0}</div>
      {(!data || data.length === 0) && <div data-testid="table-empty">{emptyMessage}</div>}
      {data?.map((row: any, idx: number) => (
        <div key={row.sales_return_id ?? idx} data-testid={`table-row-${idx}`}>
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

// The real DateRangeFilter drives an MUI calendar; swap in buttons that push
// fixed Dayjs ranges so the date-filter wiring is still exercised.
jest.mock('../../../../components/mainDashboard/DateRangeFilter/DateRangeFilter', () => {
  const dayjsLib = require('dayjs');
  return {
    __esModule: true,
    default: ({ onDateRangeChange }: { onDateRangeChange: (r: [unknown, unknown]) => void }) => (
      <div>
        <span>Filter by Dates</span>
        <button onClick={() => onDateRangeChange([dayjsLib('2026-08-01'), dayjsLib('2026-08-13')])}>
          set-range
        </button>
        <button onClick={() => onDateRangeChange([null, null])}>clear-range</button>
      </div>
    ),
  };
});

// --- Fixtures -------------------------------------------------------------
// Midday-UTC timestamp so the LOCAL-time "DD MMM YYYY" render is 12 Aug 2026
// for every real timezone offset.
const RETURN_DATE = '2026-08-12T12:00:00.000Z';

const makeRow = (over: Partial<SalesReturnRow> = {}): SalesReturnRow => ({
  sales_return_id: 42,
  return_number: 'CRN-000042',
  invoice_id: 7,
  invoice_number: '100',
  customer_id: 5,
  customer_name: 'Invicta Health',
  return_date: RETURN_DATE,
  created_by: 'pharmacist1',
  reason: 'Damaged strip',
  notes: null,
  return_type: 'PARTIAL',
  return_status: 'COMPLETED',
  refund_method: 'CASH',
  total_amount: 1250,
  line_count: 2,
  units_count: 3,
  ...over,
});

const rows: SalesReturnRow[] = [
  makeRow(),
  makeRow({
    sales_return_id: 43,
    return_number: 'CRN-000043',
    invoice_id: 8,
    invoice_number: '101',
    customer_name: 'RB Pharma',
    total_amount: 400,
    line_count: 1,
    units_count: 1,
  }),
];

const lines: SalesReturnLine[] = [
  {
    id: 1,
    sales_return_id: 42,
    invoice_line_id: 500,
    product_id: 11,
    product_name: 'Paracetamol 500mg',
    batch_number: 'B1',
    quantity: 2,
    refund_amount: 1000,
    restock_action: 'RESTOCK',
  },
  {
    id: 2,
    sales_return_id: 42,
    invoice_line_id: 501,
    product_id: 12,
    product_name: 'Amoxicillin 250mg',
    batch_number: 'B2',
    quantity: 1,
    refund_amount: 250,
    restock_action: 'DAMAGE',
  },
];

const makeDetails = (
  over: Partial<SalesReturnDetailsResponse> = {},
): SalesReturnDetailsResponse => ({ ...makeRow(), lines, ...over });

const mockUseListSalesReturnsQuery = useListSalesReturnsQuery as jest.MockedFunction<
  typeof useListSalesReturnsQuery
>;
const mockUseGetSalesReturnDetailsQuery = useGetSalesReturnDetailsQuery as jest.MockedFunction<
  typeof useGetSalesReturnDetailsQuery
>;

const listResult = (data: any, extra: Record<string, unknown> = {}) =>
  ({ data, isLoading: false, isFetching: false, error: null, refetch: jest.fn(), ...extra } as any);

const detailsResult = (data: any, extra: Record<string, unknown> = {}) =>
  ({ data, isFetching: false, error: null, ...extra } as any);

const wireDefaults = ({ total = rows.length }: { total?: number } = {}) => {
  mockUseListSalesReturnsQuery.mockReturnValue(listResult({ rows, total }));
  mockUseGetSalesReturnDetailsQuery.mockReturnValue(detailsResult(undefined));
};

const TEST_ORG = {
  id: 1,
  name: 'Test Pharmacy',
  invoice_number_enabled: false,
  invoice_number_template: null,
  invoice_number_reset: 'none',
  invoice_seq_start: null,
};

const createMockStore = (org: Record<string, unknown> = TEST_ORG) =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
      org: (state = { organization: org, activeModules: ['pharmacy'], loaded: true }) => state,
    },
  });

const renderPage = (store = createMockStore()) =>
  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <SalesReturnsLog />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );

const lastListArgs = () =>
  mockUseListSalesReturnsQuery.mock.calls.at(-1)![0] as Record<string, unknown>;

describe('SalesReturnsLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    wireDefaults();
  });

  // =========================================================================
  describe('table rendering', () => {
    it('renders each return: id, date, invoice, customer, items, units, refund, returned-by', () => {
      renderPage();

      expect(screen.getByTestId('table-data-count')).toHaveTextContent('2');
      expect(within(screen.getByTestId('cell-return_number-0')).getByText('CRN-000042')).toBeInTheDocument();
      expect(within(screen.getByTestId('cell-return_date-0')).getByText('12 Aug 2026')).toBeInTheDocument();
      // Legacy numbering (scheme OFF) -> the stored "100" DISPLAYS as "INV100".
      expect(within(screen.getByTestId('cell-invoice_number-0')).getByText('INV100')).toBeInTheDocument();
      expect(within(screen.getByTestId('cell-customer_name-0')).getByText('Invicta Health')).toBeInTheDocument();
      expect(within(screen.getByTestId('cell-line_count-0')).getByText('2')).toBeInTheDocument();
      expect(within(screen.getByTestId('cell-units_count-0')).getByText('3')).toBeInTheDocument();
      // formatWholeCurrency — invoice-level totals carry no paise tail.
      expect(within(screen.getByTestId('cell-total_amount-0')).getByText('₹1,250')).toBeInTheDocument();
      expect(within(screen.getByTestId('cell-created_by-0')).getByText('pharmacist1')).toBeInTheDocument();

      expect(within(screen.getByTestId('cell-return_number-1')).getByText('CRN-000043')).toBeInTheDocument();
      expect(within(screen.getByTestId('cell-invoice_number-1')).getByText('INV101')).toBeInTheDocument();
      expect(within(screen.getByTestId('cell-customer_name-1')).getByText('RB Pharma')).toBeInTheDocument();
    });

    // Imported/historical rows store the prefix as part of invoice_number. Decorating THAT
    // produced "INVINV-2026-000007" — a label that disagreed with the Invoices tab and that
    // matched nothing when pasted back into the search box.
    it('shows a stored invoice_number that already carries a prefix VERBATIM (never "INVINV-")', () => {
      mockUseListSalesReturnsQuery.mockReturnValue(
        listResult({ rows: [makeRow({ invoice_number: 'INV-2026-000007' })], total: 1 })
      );
      renderPage();
      const cell = screen.getByTestId('cell-invoice_number-0');
      expect(within(cell).getByText('INV-2026-000007')).toBeInTheDocument();
      expect(cell).not.toHaveTextContent('INVINV');
    });

    it('requests the full server page (limit 200 = the server cap, offset 0) with no filters', () => {
      renderPage();
      const args = lastListArgs();
      expect(args).toMatchObject({ limit: C.LOG_FETCH_LIMIT, offset: 0 });
      expect(args).not.toHaveProperty('search');
      expect(args).not.toHaveProperty('start_date');
      expect(args).not.toHaveProperty('end_date');
    });

    it('falls back to #id / — for a null return_number and null customer', () => {
      mockUseListSalesReturnsQuery.mockReturnValue(
        listResult({ rows: [makeRow({ return_number: null, customer_name: null })], total: 1 })
      );
      renderPage();
      expect(within(screen.getByTestId('cell-return_number-0')).getByText('#42')).toBeInTheDocument();
      expect(within(screen.getByTestId('cell-customer_name-0')).getByText('—')).toBeInTheDocument();
    });

    it('shows "Showing first N of M returns" only when the server total exceeds the fetched page', () => {
      wireDefaults({ total: 275 });
      renderPage();
      expect(screen.getByText('Showing first 2 of 275 returns')).toBeInTheDocument();
    });

    it('hides the truncation notice when everything fits in one fetch', () => {
      renderPage();
      expect(screen.queryByText(/Showing first/)).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  describe('loading / error / empty states', () => {
    it('shows the spinner + loading copy while the first page loads', () => {
      mockUseListSalesReturnsQuery.mockReturnValue(
        listResult(undefined, { isLoading: true, isFetching: true })
      );
      renderPage();
      expect(screen.getByText('Loading sales returns...')).toBeInTheDocument();
      expect(screen.queryByTestId('reusable-table')).not.toBeInTheDocument();
    });

    // A refetch (every debounced keystroke / date change) must NOT blank the list out:
    // the table stays mounted and is only dimmed behind a slim progress bar.
    it('keeps the table mounted on a REFETCH (isFetching alone) — no full-block spinner', () => {
      mockUseListSalesReturnsQuery.mockReturnValue(
        listResult({ rows, total: 2 }, { isFetching: true })
      );
      renderPage();
      expect(screen.queryByText('Loading sales returns...')).not.toBeInTheDocument();
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('2');
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('a refetch that returns nothing shows the empty message, not a spinner or a stale list', () => {
      mockUseListSalesReturnsQuery.mockReturnValue(
        listResult({ rows: [], total: 0 }, { isFetching: true })
      );
      renderPage();
      expect(screen.queryByText('Loading sales returns...')).not.toBeInTheDocument();
      expect(screen.getByTestId('table-empty')).toHaveTextContent('No sales returns yet');
    });

    it('keeps the truncation notice visible during a refetch so the layout never shifts', () => {
      mockUseListSalesReturnsQuery.mockReturnValue(
        listResult({ rows, total: 275 }, { isFetching: true })
      );
      renderPage();
      expect(screen.getByText('Showing first 2 of 275 returns')).toBeInTheDocument();
    });

    it('surfaces the API error message instead of the table', () => {
      mockUseListSalesReturnsQuery.mockReturnValue(
        listResult(undefined, { error: { status: 500, data: { error: 'Server error' } } })
      );
      renderPage();
      expect(screen.getByText('Server error')).toBeInTheDocument();
      expect(screen.queryByTestId('reusable-table')).not.toBeInTheDocument();
    });

    it('falls back to the generic failure copy when the error carries no message', () => {
      mockUseListSalesReturnsQuery.mockReturnValue(
        listResult(undefined, { error: { status: 'FETCH_ERROR' } })
      );
      renderPage();
      expect(screen.getByText('Failed to load sales returns.')).toBeInTheDocument();
    });

    it('renders the empty-state copy when the org has no returns yet', () => {
      mockUseListSalesReturnsQuery.mockReturnValue(listResult({ rows: [], total: 0 }));
      renderPage();
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('0');
      expect(screen.getByTestId('table-empty')).toHaveTextContent('No sales returns yet');
      expect(screen.queryByText(/Showing first/)).not.toBeInTheDocument();
    });

    // "No sales returns yet" reads as "this pharmacy has never had a return" — wrong when the
    // list is empty only because a filter matched nothing.
    it('says the FILTERS matched nothing when a search is active', () => {
      mockUseListSalesReturnsQuery.mockReturnValue(listResult({ rows: [], total: 0 }));
      renderPage();
      fireEvent.change(screen.getByPlaceholderText('Search by return ID, invoice number or customer'), {
        target: { value: 'nothing-matches-this' },
      });
      expect(screen.getByTestId('table-empty')).toHaveTextContent('No returns match your filters');
    });

    it('says the FILTERS matched nothing when only a date range is active', async () => {
      mockUseListSalesReturnsQuery.mockReturnValue(listResult({ rows: [], total: 0 }));
      renderPage();
      fireEvent.click(screen.getByText('set-range'));
      await waitFor(() =>
        expect(screen.getByTestId('table-empty')).toHaveTextContent('No returns match your filters')
      );

      fireEvent.click(screen.getByText('Reset filters'));
      await waitFor(() =>
        expect(screen.getByTestId('table-empty')).toHaveTextContent('No sales returns yet')
      );
    });
  });

  // =========================================================================
  describe('return preview dialog', () => {
    const openPreview = () => fireEvent.click(screen.getByText('CRN-000042'));

    it('is skipped until a return is picked, then queries that sales_return_id', async () => {
      renderPage();
      expect(mockUseGetSalesReturnDetailsQuery.mock.calls[0][1]).toMatchObject({ skip: true });
      expect(screen.queryByTestId('common-modal')).not.toBeInTheDocument();

      openPreview();
      await waitFor(() => {
        const lastCall = mockUseGetSalesReturnDetailsQuery.mock.calls.at(-1)!;
        expect(lastCall[0]).toEqual({ sales_return_id: 42 });
        expect(lastCall[1]).toMatchObject({ skip: false });
      });
      expect(screen.getByTestId('common-modal')).toBeInTheDocument();
    });

    it('CORE PROMISE: lists every returned line with its product, batch, QUANTITY and refund', () => {
      mockUseGetSalesReturnDetailsQuery.mockReturnValue(detailsResult(makeDetails()));
      renderPage();
      openPreview();

      const modal = within(screen.getByTestId('common-modal'));
      expect(modal.getByText('Sales Return Details')).toBeInTheDocument();
      expect(modal.getByText('Quantity returned')).toBeInTheDocument();

      // Each line is one row: product + batch + quantity + refund + restock action.
      const lineRow = (product: string) =>
        within(modal.getByText(product).closest('tr') as HTMLElement);

      const para = lineRow('Paracetamol 500mg');
      expect(para.getByText('B1')).toBeInTheDocument();
      expect(para.getByText('2')).toBeInTheDocument(); // quantity returned
      expect(para.getByText('₹1,000.00')).toBeInTheDocument();
      expect(para.getByText('RESTOCK')).toBeInTheDocument();

      const amox = lineRow('Amoxicillin 250mg');
      expect(amox.getByText('B2')).toBeInTheDocument();
      expect(amox.getByText('1')).toBeInTheDocument(); // quantity returned
      expect(amox.getByText('₹250.00')).toBeInTheDocument();
      expect(amox.getByText('DAMAGE')).toBeInTheDocument();
    });

    it('shows the header fields (return id, date, invoice, customer, returned by, method, status, reason)', () => {
      mockUseGetSalesReturnDetailsQuery.mockReturnValue(detailsResult(makeDetails()));
      renderPage();
      openPreview();

      const modal = within(screen.getByTestId('common-modal'));
      expect(modal.getAllByText('CRN-000042').length).toBeGreaterThan(0);
      expect(modal.getByText('12 Aug 2026')).toBeInTheDocument();
      expect(modal.getAllByText('INV100').length).toBeGreaterThan(0);
      expect(modal.getByText('Invicta Health')).toBeInTheDocument();
      expect(modal.getByText('pharmacist1')).toBeInTheDocument();
      expect(modal.getByText('CASH')).toBeInTheDocument();
      expect(modal.getByText('COMPLETED')).toBeInTheDocument();
      expect(modal.getByText('Damaged strip')).toBeInTheDocument();
    });

    it('the lines Total row sums the QUANTITIES into "N units"', () => {
      mockUseGetSalesReturnDetailsQuery.mockReturnValue(detailsResult(makeDetails()));
      renderPage();
      openPreview();
      expect(within(screen.getByTestId('common-modal')).getByText('3 units')).toBeInTheDocument();
    });

    it('singularises the units total for a one-unit return', () => {
      mockUseGetSalesReturnDetailsQuery.mockReturnValue(
        detailsResult(makeDetails({ lines: [lines[1]], total_amount: 250 }))
      );
      renderPage();
      openPreview();
      expect(within(screen.getByTestId('common-modal')).getByText('1 unit')).toBeInTheDocument();
    });

    it('Total Refund and the lines Total row BOTH come from details.total_amount (they can never disagree)', () => {
      // Deliberately make the line refunds sum to something ELSE (1000 + 250 = 1250)
      // than the server header total (1180 — e.g. after editSale's
      // recalcSalesReturnHeader). A client-side line sum would show ₹1,250.00.
      mockUseGetSalesReturnDetailsQuery.mockReturnValue(
        detailsResult(makeDetails({ total_amount: 1180 }))
      );
      renderPage();
      openPreview();

      const modal = within(screen.getByTestId('common-modal'));
      const shown = modal.getAllByText('₹1,180.00');
      expect(shown).toHaveLength(2); // the "Total refund" field AND the Total row
      expect(modal.queryByText('₹1,250.00')).not.toBeInTheDocument();
    });

    it('shows the details loading and error states', () => {
      mockUseGetSalesReturnDetailsQuery.mockReturnValue(
        detailsResult(undefined, { isFetching: true })
      );
      const { unmount } = renderPage();
      openPreview();
      expect(screen.getByText('Loading return details...')).toBeInTheDocument();
      unmount();

      mockUseGetSalesReturnDetailsQuery.mockReturnValue(
        detailsResult(undefined, { error: { status: 404, data: { error: 'Sales return not found for id=42' } } })
      );
      renderPage();
      openPreview();
      expect(screen.getByText('Sales return not found for id=42')).toBeInTheDocument();
    });

    it('closing the dialog re-skips the details query', async () => {
      mockUseGetSalesReturnDetailsQuery.mockReturnValue(detailsResult(makeDetails()));
      renderPage();
      openPreview();
      fireEvent.click(screen.getByText('Close Modal'));

      await waitFor(() =>
        expect(screen.queryByTestId('common-modal')).not.toBeInTheDocument()
      );
      expect(mockUseGetSalesReturnDetailsQuery.mock.calls.at(-1)![1]).toMatchObject({ skip: true });
    });
  });

  // =========================================================================
  describe('navigation to the original invoice', () => {
    const EXPECTED_STATE = {
      isReturnDetailsMode: true,
      invoiceId: 7,
      invoiceNumber: 'INV100',
      customerName: 'Invicta Health',
    };

    it('clicking the invoice link opens /sales/receipt in return-details mode', () => {
      renderPage();
      fireEvent.click(within(screen.getByTestId('cell-invoice_number-0')).getByText('INV100'));
      expect(mockNavigate).toHaveBeenCalledWith(C.RECEIPT_ROUTE, { state: EXPECTED_STATE });
      expect(C.RECEIPT_ROUTE).toBe('/sales/receipt');
    });

    it('the dialog\'s "View original invoice" button navigates with the same state', () => {
      mockUseGetSalesReturnDetailsQuery.mockReturnValue(detailsResult(makeDetails()));
      renderPage();
      fireEvent.click(screen.getByText('CRN-000042'));
      fireEvent.click(within(screen.getByTestId('common-modal')).getByText('View original invoice'));
      expect(mockNavigate).toHaveBeenCalledWith(C.RECEIPT_ROUTE, { state: EXPECTED_STATE });
    });

    it('a null customer_name is passed as an empty string, never null', () => {
      mockUseListSalesReturnsQuery.mockReturnValue(
        listResult({ rows: [makeRow({ customer_name: null })], total: 1 })
      );
      renderPage();
      fireEvent.click(within(screen.getByTestId('cell-invoice_number-0')).getByText('INV100'));
      expect(mockNavigate).toHaveBeenCalledWith(C.RECEIPT_ROUTE, {
        state: expect.objectContaining({ customerName: '' }),
      });
    });

    // SalesReceipt maps this back with invoiceLookupKey, so it must carry the STORED value.
    it('an already-prefixed stored number reaches the receipt verbatim (scheme OFF)', () => {
      mockUseListSalesReturnsQuery.mockReturnValue(
        listResult({ rows: [makeRow({ invoice_number: 'INV-2026-000007' })], total: 1 })
      );
      renderPage();
      fireEvent.click(within(screen.getByTestId('cell-invoice_number-0')).getByText('INV-2026-000007'));
      expect(mockNavigate).toHaveBeenCalledWith(C.RECEIPT_ROUTE, {
        state: expect.objectContaining({ invoiceNumber: 'INV-2026-000007' }),
      });
    });

    it('with the org invoice scheme ON the stored number is passed verbatim (no INV cosmetic)', () => {
      mockUseListSalesReturnsQuery.mockReturnValue(
        listResult({ rows: [makeRow({ invoice_number: 'EM/26-27/000100' })], total: 1 })
      );
      renderPage(createMockStore({ ...TEST_ORG, invoice_number_enabled: true }));
      fireEvent.click(
        within(screen.getByTestId('cell-invoice_number-0')).getByText('EM/26-27/000100')
      );
      expect(mockNavigate).toHaveBeenCalledWith(C.RECEIPT_ROUTE, {
        state: expect.objectContaining({ invoiceNumber: 'EM/26-27/000100' }),
      });
    });
  });

  // =========================================================================
  // Search is SERVER-SIDE and debounced. The box searches three things at once
  // (return_number, invoice_number, customer name) — so only an unambiguously
  // DECORATED invoice number ("INV12" = the cosmetic on a bare number) is mapped
  // back to its stored form before it is sent; a customer name like "Invicta", a
  // return number, and an invoice_number that stores its own prefix all go verbatim.
  // =========================================================================
  describe('search (debounced, server-side)', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const typeSearch = (value: string) => {
      fireEvent.change(screen.getByPlaceholderText('Search by return ID, invoice number or customer'), {
        target: { value },
      });
    };
    const tick = (ms: number) => act(() => { jest.advanceTimersByTime(ms); });

    it(`waits ${C.SEARCH_DEBOUNCE_MS}ms before sending the term to the server`, () => {
      renderPage();
      typeSearch('Invicta');

      tick(C.SEARCH_DEBOUNCE_MS - 1);
      expect(lastListArgs()).not.toHaveProperty('search');

      tick(1);
      expect(lastListArgs()).toMatchObject({ search: 'Invicta', limit: C.LOG_FETCH_LIMIT, offset: 0 });
    });

    it('keystrokes inside the debounce window collapse into ONE server term', () => {
      renderPage();
      typeSearch('I');
      tick(100);
      typeSearch('Inv');
      tick(100);
      typeSearch('Invicta');
      tick(C.SEARCH_DEBOUNCE_MS);

      const searched = mockUseListSalesReturnsQuery.mock.calls
        .map((call) => (call[0] as Record<string, unknown>).search)
        .filter(Boolean);
      expect(new Set(searched)).toEqual(new Set(['Invicta']));
    });

    it('a customer-name term is sent VERBATIM even though it starts with "Inv"', () => {
      renderPage();
      typeSearch('Invicta');
      tick(C.SEARCH_DEBOUNCE_MS);
      expect(lastListArgs().search).toBe('Invicta');
    });

    it('a decorated invoice number ("INV12") is converted to the STORED number "12"', () => {
      renderPage();
      typeSearch('INV12');
      tick(C.SEARCH_DEBOUNCE_MS);
      expect(lastListArgs().search).toBe('12');
    });

    it('the invoice gate is case-insensitive and tolerates the hyphen form ("inv-12")', () => {
      renderPage();
      typeSearch('inv-12');
      tick(C.SEARCH_DEBOUNCE_MS);
      expect(lastListArgs().search).toBe('12');
    });

    // The other half of UI-1: the label the user SEES is always the term that finds the row.
    it('the DISPLAYED label of an already-prefixed invoice is searched VERBATIM', () => {
      renderPage();
      typeSearch('INV-2026-000007');
      tick(C.SEARCH_DEBOUNCE_MS);
      expect(lastListArgs().search).toBe('INV-2026-000007');
    });

    it('a return number ("CRN-000042") is sent verbatim — the gate must not touch it', () => {
      renderPage();
      typeSearch('CRN-000042');
      tick(C.SEARCH_DEBOUNCE_MS);
      expect(lastListArgs().search).toBe('CRN-000042');
    });

    it('with the org invoice scheme ON, "INV12" is a real stored number and is NOT stripped', () => {
      renderPage(createMockStore({ ...TEST_ORG, invoice_number_enabled: true }));
      typeSearch('INV12');
      tick(C.SEARCH_DEBOUNCE_MS);
      expect(lastListArgs().search).toBe('INV12');
    });

    it('the term is trimmed, and a whitespace-only term sends no search key at all', () => {
      renderPage();
      typeSearch('  Invicta  ');
      tick(C.SEARCH_DEBOUNCE_MS);
      expect(lastListArgs().search).toBe('Invicta');

      typeSearch('   ');
      tick(C.SEARCH_DEBOUNCE_MS);
      expect(lastListArgs()).not.toHaveProperty('search');
    });
  });

  // =========================================================================
  describe('date range + reset', () => {
    it('sends start_date / end_date as YYYY-MM-DD and offers a reset once filtered', async () => {
      renderPage();
      expect(screen.queryByText('Reset filters')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('set-range'));
      await waitFor(() =>
        expect(lastListArgs()).toMatchObject({ start_date: '2026-08-01', end_date: '2026-08-13' })
      );
      expect(screen.getByText('Reset filters')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Reset filters'));
      await waitFor(() => {
        expect(lastListArgs()).not.toHaveProperty('start_date');
        expect(lastListArgs()).not.toHaveProperty('end_date');
      });
    });
  });
});
