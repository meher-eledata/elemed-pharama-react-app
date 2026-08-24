global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import SupplierReceiptReport from '../SupplierReceiptReport';
import * as reportsApi from '../../../redux/slices/reportsApi';
import * as masterApi from '../../../redux/slices/masterApi';

const theme = createTheme();

// react-router: stub navigate (the BackLink calls useNavigate).
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Stub heavy deps so the render is stable and free of ESM/canvas dependencies.
// - MUI x-charts BarChart (via ReportBarChart) and the DateRangeFilter (x-date-pickers)
//   are replaced with trivial markers; react-csv with a no-op link.
jest.mock('../../../components/AdminReports/ReportBarChart', () => ({
  __esModule: true,
  default: () => <div data-testid="report-bar-chart" />,
}));
jest.mock('../../../components/mainDashboard/DateRangeFilter/DateRangeFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="date-range-filter" />,
}));
// The CSV export is a SEPARATE code path from the table columns, so the mock captures
// the rows handed to CSVLink and the tests assert on them directly.
const mockCsvRows: Record<string, string>[] = [];
const mockCsvMeta = { filename: '' };
jest.mock('react-csv', () => ({
  __esModule: true,
  CSVLink: ({ data, filename }: { data: Record<string, string>[]; filename?: string }) => {
    mockCsvRows.length = 0;
    mockCsvRows.push(...data);
    mockCsvMeta.filename = filename ?? '';
    return <div data-testid="csv-link" />;
  },
}));

// Mock the RTK Query slices wholesale, keeping real exports (types, the api object)
// but overriding the hooks the page consumes.
jest.mock('../../../redux/slices/reportsApi', () => {
  const actual = jest.requireActual('../../../redux/slices/reportsApi');
  return { __esModule: true, ...actual, useGetSupplierReceiptReportQuery: jest.fn() };
});
jest.mock('../../../redux/slices/masterApi', () => {
  const actual = jest.requireActual('../../../redux/slices/masterApi');
  return { __esModule: true, ...actual, useGetSuppliersQuery: jest.fn() };
});

const mockedReports = reportsApi as unknown as {
  useGetSupplierReceiptReportQuery: jest.Mock;
};
const mockedMaster = masterApi as unknown as { useGetSuppliersQuery: jest.Mock };

// Money fields arrive from pg as STRINGS — the fixture honours that so the test
// exercises the page's toNum/format pipeline.
const FIXTURE: reportsApi.SupplierReceiptReportResponse = {
  rows: [
    {
      receipt_id: 501,
      receipt_number: 'GRN-000501',
      receipt_date: '2026-06-10',
      invoice_number: 'SUP-INV-1',
      po_number: 'PO-9001',
      supplier_id: 1,
      supplier_name: 'Acme Pharma',
      supplier_gst: 'GST123',
      supplier_contact: 'Jane',
      supplier_phone: '555-0100',
      product_id: 11,
      product_name: 'Amoxicillin 500mg',
      product_code: 'AMX-500',
      hsn_code: '3004',
      mrp: '120.00',
      purchase_price: '100.00',
      received_qty: '50.00',
      cgst: '6.00',
      sgst: '6.00',
      igst: '0.00',
      total_tax: '12.00',
      discount: '5.00',
      total_value: '5000.00',
    },
  ],
  rows_by_receipt: [
    {
      receipt_id: 501,
      receipt_number: 'GRN-000501',
      receipt_date: '2026-06-10',
      invoice_number: 'SUP-INV-1',
      po_number: 'PO-9001',
      supplier_id: 1,
      supplier_name: 'Acme Pharma',
      supplier_gst: 'GST123',
      line_count: '1',
      product_count: '1',
      total_qty: '50.00',
      cgst: '6.00',
      sgst: '6.00',
      igst: '0.00',
      total_tax: '12.00',
      discount_amount: '250.00',
      total_value: '5000.00',
    },
    // Older receipt with every nullable field null (unlinked supplier, no
    // invoice/PO) — exercises the '-' fallbacks and the date-desc default sort.
    {
      receipt_id: 400,
      receipt_number: 'GRN-000400',
      receipt_date: '2026-06-05',
      invoice_number: null,
      po_number: null,
      supplier_id: null,
      supplier_name: null,
      supplier_gst: null,
      line_count: '3',
      product_count: '2',
      total_qty: '10.00',
      cgst: '0.00',
      sgst: '0.00',
      igst: '0.00',
      total_tax: '0.00',
      discount_amount: '0.00',
      total_value: '750.00',
    },
  ],
  summary: {
    total_spend: '1234.50',
    total_qty_received: '50.00',
    receipt_count: 1,
    product_count: 1,
    supplier_count: 1,
  },
  charts: {
    spend_by_date: [{ date: '2026-06-10', spend: '1234.50' }],
    qty_by_date: [{ date: '2026-06-10', qty: '50.00' }],
    top_products_by_value: [{ product_name: 'Amoxicillin 500mg', value: '1234.50', qty: '50.00' }],
    top_suppliers_by_value: [{ supplier_name: 'Acme Pharma', value: '1234.50', qty: '50.00' }],
  },
};

const createStore = () =>
  configureStore({
    reducer: {
      auth: (state = { token: 'JWT123', user: null }) => state,
      [reportsApi.reportsApi.reducerPath]: reportsApi.reportsApi.reducer,
      [masterApi.masterApi.reducerPath]: masterApi.masterApi.reducer,
    },
    middleware: (gDM) =>
      gDM().concat(reportsApi.reportsApi.middleware, masterApi.masterApi.middleware),
  });

const renderPage = () =>
  render(
    <Provider store={createStore()}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <SupplierReceiptReport />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockedMaster.useGetSuppliersQuery.mockReturnValue({ data: [], isLoading: false, error: undefined });
  mockedReports.useGetSupplierReceiptReportQuery.mockReturnValue({
    data: FIXTURE,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
});

describe('SupplierReceiptReport page', () => {
  it('renders the page title', () => {
    renderPage();
    expect(screen.getAllByText('Supplier Receipt Report').length).toBeGreaterThan(0);
  });

  it('renders the KPI labels (overview tab is default)', () => {
    renderPage();
    // KPI cards from the summary.
    expect(screen.getByText(/total spend/i)).toBeInTheDocument();
    expect(screen.getAllByText(/receipts/i).length).toBeGreaterThan(0);
  });

  it('formats a money value as ₹ and never renders NaN', () => {
    renderPage();
    // total_spend "1234.50" -> formatCurrency -> ₹1,234.50
    expect(screen.getAllByText('₹1,234.50').length).toBeGreaterThan(0);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  // MUI Select with the '' "all" sentinel renders BLANK unless displayEmpty is set —
  // the closed control must show the default label (bugs.md 2026-08-20).
  it('shows "All Suppliers" as the closed supplier-filter value by default', () => {
    renderPage();
    expect(screen.getByText('All Suppliers')).toBeInTheDocument();
  });

  // MRP is a rupee value like Purchase Price — on screen it is currency-formatted,
  // while the CSV keeps the raw numeric string under the "MRP (₹)" heading.
  it('formats MRP as currency on the Detailed tab but exports it numeric in the CSV', () => {
    renderPage();
    fireEvent.click(screen.getByText('Item-wise'));
    const row = screen.getByText('GRN-000501').closest('tr')!;
    expect(within(row).getByText('₹120.00')).toBeInTheDocument(); // mrp '120.00'
    expect(within(row).queryByText('120.00')).not.toBeInTheDocument(); // no unformatted copy
    expect(mockCsvRows[0]['MRP (₹)']).toBe('120.00');
  });

  // The "Receipt #" column used to render receipt_id (the internal PK). It must show the
  // server-generated GRN number, which is opaque and never rebuilt client-side.
  it('renders the generated receipt number in the Receipt # column, not the internal PK', () => {
    renderPage();
    fireEvent.click(screen.getByText('Item-wise'));
    expect(screen.getByText('GRN-000501')).toBeInTheDocument();
    expect(screen.queryByText('501')).not.toBeInTheDocument();
  });

  it('exports the generated receipt number in the CSV, not the internal PK', () => {
    renderPage();
    expect(mockCsvRows[0]['Receipt #']).toBe('GRN-000501');
  });

  it('renders a custom-template receipt number verbatim', () => {
    mockedReports.useGetSupplierReceiptReportQuery.mockReturnValue({
      data: { ...FIXTURE, rows: [{ ...FIXTURE.rows[0], receipt_number: 'GRN/26-27/000042' }] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    renderPage();
    fireEvent.click(screen.getByText('Item-wise'));
    expect(screen.getByText('GRN/26-27/000042')).toBeInTheDocument();
    expect(mockCsvRows[0]['Receipt #']).toBe('GRN/26-27/000042');
  });
});

// ===========================================================================
// "Receipt-wise" tab — rows_by_receipt rollup (contract addition 2026-08-20).
// One table row per receipt; counts are pg bigint-as-string and must be
// Number()ed; discount_amount is a RUPEE AMOUNT, distinct from the detail
// tab's percent discount.
// ===========================================================================
describe('SupplierReceiptReport — Receipt-wise tab', () => {
  // GRN cells in DOCUMENT order — with one table on screen this is row order.
  const grnOrder = () => screen.getAllByText(/^GRN-000/).map((el) => el.textContent);

  it('renders the receipt-level table: receipt number, supplier, numeric counts and ₹ values', () => {
    renderPage();
    fireEvent.click(screen.getByText('Receipt-wise'));

    const row501 = screen.getByText('GRN-000501').closest('tr')!;
    expect(within(row501).getByText('Acme Pharma')).toBeInTheDocument();
    expect(within(row501).getByText('50.00')).toBeInTheDocument(); // total_qty via formatNumber
    expect(within(row501).getByText('₹250.00')).toBeInTheDocument(); // discount_amount — currency
    expect(within(row501).getByText('₹5,000.00')).toBeInTheDocument(); // total_value — currency

    // line_count '3' / product_count '2' arrive as bigint STRINGS; the page must
    // Number() them and render plain counts (not "3.00", never NaN).
    const row400 = screen.getByText('GRN-000400').closest('tr')!;
    expect(within(row400).getByText('3')).toBeInTheDocument(); // Lines
    expect(within(row400).getByText('2')).toBeInTheDocument(); // Products
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('labels the two discount columns distinctly: "Discount (%)" on detail, "Discount (₹)" by receipt', () => {
    renderPage();

    fireEvent.click(screen.getByText('Item-wise'));
    expect(screen.getByText('Discount (%)')).toBeInTheDocument();
    expect(screen.queryByText('Discount (₹)')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Receipt-wise'));
    expect(screen.getByText('Discount (₹)')).toBeInTheDocument();
    expect(screen.queryByText('Discount (%)')).not.toBeInTheDocument();
  });

  it('sorts by receipt_date desc by default and resets sort state on tab switch', () => {
    renderPage();
    fireEvent.click(screen.getByText('Receipt-wise'));
    // Default: receipt_date desc — newest receipt first.
    expect(grnOrder()).toEqual(['GRN-000501', 'GRN-000400']);

    // User flips the sort (receipt_number asc) via the arrow indicator…
    const sortArrow = screen.getByText('Receipt #').parentElement!.querySelector('svg')!;
    fireEvent.click(sortArrow);
    expect(grnOrder()).toEqual(['GRN-000400', 'GRN-000501']);

    // …and the WHOLE header cell is clickable too — clicking the label text
    // toggles the same column back to desc.
    fireEvent.click(screen.getByText('Receipt #'));
    expect(grnOrder()).toEqual(['GRN-000501', 'GRN-000400']);
    fireEvent.click(screen.getByText('Receipt #'));
    expect(grnOrder()).toEqual(['GRN-000400', 'GRN-000501']);

    // …then a tab round-trip restores the date-desc default (no stale sort key,
    // no crash from carrying detail-tab sort state onto the rollup table).
    fireEvent.click(screen.getByText('Item-wise'));
    fireEvent.click(screen.getByText('Receipt-wise'));
    expect(grnOrder()).toEqual(['GRN-000501', 'GRN-000400']);
  });

  it('renders "-" for null invoice / PO / supplier / GST fields', () => {
    renderPage();
    fireEvent.click(screen.getByText('Receipt-wise'));

    const row400 = screen.getByText('GRN-000400').closest('tr')!;
    // invoice_number, po_number, supplier_name, supplier_gst — all null → '-'.
    expect(within(row400).getAllByText('-')).toHaveLength(4);
    // The nulls are confined to their row: the fully-populated receipt has none.
    const row501 = screen.getByText('GRN-000501').closest('tr')!;
    expect(within(row501).queryByText('-')).not.toBeInTheDocument();
  });

  it('CSV follows the active tab: per-tab columns and a by_receipt vs detailed filename suffix', () => {
    renderPage();

    fireEvent.click(screen.getByText('Item-wise'));
    expect(mockCsvMeta.filename).toMatch(
      /^supplier_receipt_report_detailed_\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.csv$/
    );
    expect(mockCsvRows).toHaveLength(1);
    expect(mockCsvRows[0]['Product']).toBe('Amoxicillin 500mg');
    expect(mockCsvRows[0]['Discount (%)']).toBe('5.00'); // PERCENT on the detail export

    fireEvent.click(screen.getByText('Receipt-wise'));
    expect(mockCsvMeta.filename).toMatch(
      /^supplier_receipt_report_by_receipt_\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.csv$/
    );
    expect(mockCsvRows).toHaveLength(2);
    // Sorted date-desc, so the newest receipt exports first.
    expect(mockCsvRows[0]['Receipt #']).toBe('GRN-000501');
    expect(mockCsvRows[0]['Lines']).toBe('1');
    expect(mockCsvRows[0]['Products']).toBe('1');
    expect(mockCsvRows[0]['Discount (₹)']).toBe('250.00'); // RUPEE AMOUNT on the rollup export
    expect(mockCsvRows[1]['Receipt #']).toBe('GRN-000400');
  });

  it('download control: absent on Overview, enabled on both table tabs', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: 'Download CSV' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Receipt-wise'));
    expect(screen.getByRole('button', { name: 'Download CSV' })).toBeEnabled();

    fireEvent.click(screen.getByText('Item-wise'));
    expect(screen.getByRole('button', { name: 'Download CSV' })).toBeEnabled();
  });
});
