global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import dayjs from 'dayjs';
import { skipToken } from '@reduxjs/toolkit/query/react';
import ClosingStockReport from '../ClosingStockReport';
import * as reportsApi from '../../../redux/slices/reportsApi';
import * as inventoryApi from '../../../redux/slices/inventoryApi';
import * as activityApi from '../../../redux/slices/activityApi';

const theme = createTheme();
let csvProps: any = null;
let batchCsvProps: any = null;
let pickerProps: any = null;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));
jest.mock('../../../components/mainDashboard/DateRangeFilter/DateRangeFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="date-range-filter" />,
}));
jest.mock('../../../utils/csv', () => ({
  __esModule: true,
  ...jest.requireActual('../../../utils/csv'),
  downloadCsv: (filename: string, data: Record<string, string>[]) => {
    if (filename.includes('_batchwise_')) batchCsvProps = { filename, data };
    else csvProps = { filename, data };
  },
}));
jest.mock('../../../components/Common', () => {
  const actual = jest.requireActual('../../../components/Common');
  return {
    __esModule: true,
    ...actual,
    PharmaDatePicker: (props: any) => {
      pickerProps = props;
      return <div data-testid="as-of-date">{props.value?.isValid() ? props.value.format('YYYY-MM-DD') : 'invalid'}</div>;
    },
  };
});
jest.mock('../../../redux/slices/reportsApi', () => {
  const actual = jest.requireActual('../../../redux/slices/reportsApi');
  return { __esModule: true, ...actual, useGetClosingStockReportQuery: jest.fn() };
});
jest.mock('../../../redux/slices/inventoryApi', () => {
  const actual = jest.requireActual('../../../redux/slices/inventoryApi');
  return { __esModule: true, ...actual, useGetAllBrandsQuery: jest.fn() };
});
jest.mock('../../../redux/slices/activityApi', () => {
  const actual = jest.requireActual('../../../redux/slices/activityApi');
  return { __esModule: true, ...actual, useLogDownloadMutation: jest.fn() };
});

const mockedReports = reportsApi as unknown as { useGetClosingStockReportQuery: jest.Mock };
const mockedInventory = inventoryApi as unknown as { useGetAllBrandsQuery: jest.Mock };
const mockedActivity = activityApi as unknown as { useLogDownloadMutation: jest.Mock };

const ZERO_COUNTERS = {
  uncosted_product_count: 0,
  uncosted_quantity: '0',
  unpriced_mrp_product_count: 0,
  negative_batch_count: 0,
  ambiguous_movement_count: 0,
  unattributed_movement_count: 0,
  receipt_line_deletions_after_cutoff: 0,
  unknown_type_movement_count: 0,
  selling_at_mrp_batch_count: 0,
};

const BATCH: reportsApi.ClosingStockBatch = {
  batch_number: 'AMX-B2',
  expiry_date: '2027-03-31',
  is_expired: false,
  quantity: '100.00',
  unit_cost_ex_gst: '8.00',
  unit_cost_inc_gst: '8.96',
  mrp_per_unit: '15.00',
  value_cost_ex_gst: '800.00',
  value_cost_inc_gst: '896.00',
  value_mrp: '1500.00',
  cost_basis: 'RECEIPT',
  has_unpriced_mrp: false,
  // Last sold at a discount: ₹12 a unit against a ₹15 MRP.
  selling_price_per_unit: '12.00',
  selling_price_basis: 'LAST_SALE',
  value_selling: '1200.00',
};

const FIXTURE: reportsApi.ClosingStockReportResponse = {
  as_of_date: '2026-10-15',
  rows: [
    {
      product_id: 11,
      product_name: 'Amoxicillin 500mg',
      product_code: 'AMX-500',
      brand_id: 3,
      brand_name: 'Cipla',
      quantity: '110.00',
      value_cost_ex_gst: '900.00',
      value_cost_inc_gst: '1008.00',
      value_mrp: '1650.00',
      cost_basis: 'RECEIPT',
      uncosted_quantity: '0',
      has_negative_batches: false,
      has_unpriced_mrp: false,
      value_selling: '1350.00',
      has_selling_at_mrp: true,
      batches: [
        // Server order: expiry ASC — the expired batch first.
        {
          ...BATCH,
          batch_number: 'AMX-B1',
          expiry_date: '2026-09-30',
          is_expired: true,
          quantity: '10.00',
          unit_cost_ex_gst: '10.00',
          unit_cost_inc_gst: '11.20',
          value_cost_ex_gst: '100.00',
          value_cost_inc_gst: '112.00',
          value_mrp: '150.00',
          cost_basis: 'ESTIMATED',
          // Never sold by the date: priced at its current MRP per unit.
          selling_price_per_unit: '15.00',
          selling_price_basis: 'MRP',
          value_selling: '150.00',
        },
        BATCH,
      ],
    },
    {
      product_id: 12,
      product_name: 'Bandage Roll',
      product_code: null,
      brand_id: null,
      brand_name: null,
      quantity: '-4.00',
      value_cost_ex_gst: null,
      value_cost_inc_gst: null,
      value_mrp: null,
      cost_basis: 'MISSING',
      uncosted_quantity: '-4.00',
      has_negative_batches: true,
      has_unpriced_mrp: true,
      value_selling: null,
      has_selling_at_mrp: false,
      batches: [
        {
          batch_number: 'BND-9',
          expiry_date: null, // batch deleted from inventory
          is_expired: false,
          quantity: '-4.00',
          unit_cost_ex_gst: null,
          unit_cost_inc_gst: null,
          mrp_per_unit: null,
          value_cost_ex_gst: null,
          value_cost_inc_gst: null,
          value_mrp: null,
          cost_basis: 'MISSING',
          has_unpriced_mrp: true,
          selling_price_per_unit: null,
          selling_price_basis: null,
          value_selling: null,
        },
      ],
    },
  ],
  summary: {
    ...ZERO_COUNTERS,
    product_count: 2,
    batch_count: 3,
    total_quantity: '106.00',
    total_value_cost_ex_gst: '900.00',
    total_value_cost_inc_gst: '1008.00',
    total_value_mrp: '1650.00',
    total_value_selling: '1350.00',
    uncosted_product_count: 1,
    uncosted_quantity: '-4.00',
    unpriced_mrp_product_count: 1,
    negative_batch_count: 1,
  },
};

const mockQuery = (data: reportsApi.ClosingStockReportResponse | undefined, extra: object = {}) =>
  mockedReports.useGetClosingStockReportQuery.mockReturnValue({
    currentData: data,
    isFetching: false,
    isError: false,
    refetch: jest.fn(),
    ...extra,
  });

const allArgs = () => mockedReports.useGetClosingStockReportQuery.mock.calls.map((c) => c[0]);
const lastArgs = () => allArgs().at(-1);
const requestedDates = () =>
  [...new Set(allArgs().filter((a) => a !== skipToken).map((a) => a.as_of_date))];
const downloadButton = () => screen.getByRole('button', { name: /Download CSV/ });
const DATE_DEBOUNCE = 500;

const USER_ID = 7;
const VIEW_KEY = `closing_stock_view_${USER_ID}`;
const createStore = (userId: number) =>
  configureStore({ reducer: { auth: () => ({ user: { id: userId }, token: 't', isAuthenticated: true }) } });

const renderPage = (userId = USER_ID) =>
  render(
    <Provider store={createStore(userId)}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <ClosingStockReport />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );

const viewButton = (name: 'Product-wise' | 'Batch-wise') => screen.getByRole('button', { name });
const openDownloadMenu = () => {
  fireEvent.click(downloadButton());
  return screen.getByRole('menu');
};
const menuItem = (name: RegExp) => within(screen.getByRole('menu')).getByRole('menuitem', { name });
/** Download one of the two CSVs through the menu; returns what was handed to downloadCsv. */
const exportCsv = (kind: 'product' | 'batch') => {
  openDownloadMenu();
  fireEvent.click(menuItem(kind === 'batch' ? /Batch-wise CSV/ : /Product-wise CSV/));
  return kind === 'batch' ? batchCsvProps : csvProps;
};

beforeEach(() => {
  jest.clearAllMocks();
  csvProps = null;
  batchCsvProps = null;
  pickerProps = null;
  localStorage.clear();
  mockedInventory.useGetAllBrandsQuery.mockReturnValue({ data: [{ id: 3, brand_name: 'Cipla' }] });
  mockedActivity.useLogDownloadMutation.mockReturnValue([
    jest.fn(() => ({ catch: jest.fn() })),
    { isLoading: false },
  ]);
  mockQuery(FIXTURE);
});

describe('ClosingStockReport page', () => {
  it('defaults to today (local YYYY-MM-DD) with zero stock excluded and no brand/search', () => {
    renderPage();
    const today = dayjs().format('YYYY-MM-DD');
    expect(screen.getByTestId('as-of-date')).toHaveTextContent(today);
    expect(lastArgs()).toEqual({ as_of_date: today, include_zero_stock: false });
    // Single-date report: the shared range filter must not render.
    expect(screen.queryByTestId('date-range-filter')).not.toBeInTheDocument();
  });

  it('renders all value columns, formatted rows and the server totals footer', () => {
    renderPage();
    ['Brand', 'Product', 'Product Code', 'Qty (units)'].forEach((h) =>
      expect(screen.getAllByText(h).length).toBeGreaterThan(0)
    );
    expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();
    expect(screen.getAllByText('₹1,008.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Total')).toBeInTheDocument();
    // Quantities carry no decimals: footer total + summary card.
    expect(screen.getAllByText('106')).toHaveLength(2);
    expect(screen.getByText('110')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('shows NULL values as an em dash and negative quantity in red', () => {
    renderPage();
    // Bandage Roll: missing brand + product code, and its four null values.
    expect(screen.getAllByText('—')).toHaveLength(6);
    expect(screen.getByText('-4')).toHaveStyle({ color: '#DC2626' });
  });

  it('labels cost values "Purchase Value" in the subtitle, headers and summary cards', () => {
    renderPage();
    expect(
      screen.getByText('Stock on hand at the end of the selected date, valued at purchase cost, MRP and last selling price.')
    ).toBeInTheDocument();
    const headers = within(screen.getAllByRole('rowgroup')[0]);
    // Two-line headers: "Purchase Value" over the GST basis.
    ['excl. GST', 'incl. GST'].forEach((basis) =>
      expect(headers.getByText((_, el) => el?.textContent === `Purchase Value${basis}` && el.tagName === 'SPAN'))
        .toBeInTheDocument()
    );
    expect(screen.getByText('Purchase Value excl. GST')).toBeInTheDocument();
    expect(screen.getByText('Purchase Value incl. GST')).toBeInTheDocument();
    expect(screen.getAllByText('Value @ MRP').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Value @ Cost/)).not.toBeInTheDocument();
  });

  it('shows quantities without decimals, Indian-grouped, but never rounds a fraction away', () => {
    mockQuery({
      ...FIXTURE,
      rows: [
        { ...FIXTURE.rows[0], quantity: '16543.00' },
        { ...FIXTURE.rows[1], quantity: '2.50' },
      ],
      summary: { ...FIXTURE.summary, total_quantity: '16545.50' },
    });
    renderPage();
    expect(screen.getByText('16,543')).toBeInTheDocument();
    expect(screen.getByText('2.5')).toBeInTheDocument();
    expect(screen.getAllByText('16,545.5')).toHaveLength(2); // footer + summary card
    const csv = exportCsv('product').data;
    expect(csv.map((r: Record<string, string>) => r['Qty (units)'])).toEqual(['16543', '2.5', '16545.5']);
  });

  it('renders negative money as "-₹" in red, like negative quantities', () => {
    mockQuery({
      ...FIXTURE,
      rows: [{ ...FIXTURE.rows[0], quantity: '-38.00', value_cost_ex_gst: '-380.00', value_cost_inc_gst: '-425.60', value_mrp: '-570.00' }],
    });
    renderPage();
    ['-₹380.00', '-₹425.60', '-₹570.00'].forEach((v) => expect(screen.getByText(v)).toHaveStyle({ color: '#DC2626' }));
    expect(screen.queryByText(/₹-/)).not.toBeInTheDocument();
  });

  it('shows the data-quality strip only when a counter is > 0, and always the MRP note', () => {
    const { unmount } = renderPage();
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 product has no purchase cost on record (-4 units); excluded from purchase value totals.'
    );
    expect(screen.getByRole('status')).toHaveTextContent('1 batch has negative stock');
    expect(screen.getByText(/current MRP/)).toBeInTheDocument();
    unmount();

    mockQuery({ ...FIXTURE, rows: [FIXTURE.rows[0]], summary: { ...FIXTURE.summary, ...ZERO_COUNTERS } });
    renderPage();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText(/current MRP/)).toBeInTheDocument();
  });

  it('builds CSV 1:1 with the table columns plus a totals row', () => {
    renderPage();
    const csvProps = exportCsv('product');
    // Named after the date the server echoed for THIS data set.
    expect(csvProps.filename).toBe('closing_stock_report_2026-10-15.csv');
    expect(csvProps.data).toHaveLength(3);
    expect(Object.keys(csvProps.data[0])).toEqual([
      'Brand',
      'Product',
      'Product Code',
      'Qty (units)',
      'Purchase Value excl. GST (₹)',
      'Purchase Value incl. GST (₹)',
      'Value @ MRP (₹)',
      'Value @ Selling Price (₹)',
    ]);
    expect(csvProps.data[0]['Qty (units)']).toBe('110');
    expect(csvProps.data[0]['Value @ Selling Price (₹)']).toBe('1350.00');
    expect(csvProps.data[1]['Value @ Selling Price (₹)']).toBe('');
    expect(csvProps.data[1]).toMatchObject({ 'Qty (units)': '-4', 'Purchase Value excl. GST (₹)': '' });
    expect(csvProps.data[2]).toEqual({
      Brand: 'Total',
      Product: '',
      'Product Code': '',
      'Qty (units)': '106',
      'Purchase Value excl. GST (₹)': '900.00',
      'Purchase Value incl. GST (₹)': '1008.00',
      'Value @ MRP (₹)': '1650.00',
      'Value @ Selling Price (₹)': '1350.00',
    });
  });

  it('sends the search to the server only after the 300ms debounce, and the zero-stock toggle', () => {
    jest.useFakeTimers();
    try {
      renderPage();
      fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), { target: { value: ' amox ' } });
      expect(lastArgs().search).toBeUndefined();
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(lastArgs().search).toBe('amox');

      fireEvent.click(screen.getByRole('checkbox', { name: 'Include zero stock products' }));
      expect(lastArgs().include_zero_stock).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('renders a never-stocked row (zero stock on) as 0.00 values, not em dashes', () => {
    mockQuery({
      ...FIXTURE,
      rows: [
        {
          ...FIXTURE.rows[0],
          quantity: '0.00',
          value_cost_ex_gst: '0.00',
          value_cost_inc_gst: '0.00',
          value_mrp: '0.00',
          value_selling: '0.00',
          has_selling_at_mrp: false,
        },
      ],
      summary: { ...FIXTURE.summary, ...ZERO_COUNTERS, total_quantity: '0.00', total_value_cost_ex_gst: '0.00', total_value_cost_inc_gst: '0.00', total_value_mrp: '0.00', total_value_selling: '0.00' },
    });
    renderPage();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
    // 4 value cells + 4 footer totals + 4 summary-bar stats
    expect(screen.getAllByText('₹0.00')).toHaveLength(12);
    // Qty cell + footer total + summary-bar stat
    expect(screen.getAllByText('0')).toHaveLength(3);
  });

  it('explains receipt-line deletions after the date as approximate, with singular/plural', () => {
    mockQuery({ ...FIXTURE, summary: { ...FIXTURE.summary, ...ZERO_COUNTERS, receipt_line_deletions_after_cutoff: 2 } });
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent(
      '2 receipt lines were deleted after this date. Their stock is counted only if the line already existed by this date (partly inferred), so affected quantities may be approximate.'
    );
  });

  it('never renders or exports stale data: loading + download disabled while fetching new args', () => {
    // RTK keeps `data` from the previous args; the page must ignore it and use currentData.
    mockedReports.useGetClosingStockReportQuery.mockReturnValue({
      data: FIXTURE,
      currentData: undefined,
      isFetching: true,
      isError: false,
      refetch: jest.fn(),
    });
    renderPage();
    expect(screen.queryByText('Amoxicillin 500mg')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(downloadButton()).toBeDisabled();
    fireEvent.click(downloadButton());
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('shows the generic error (never raw API text) and disables download on error', () => {
    mockedReports.useGetClosingStockReportQuery.mockReturnValue({
      data: FIXTURE,
      currentData: undefined,
      isFetching: false,
      isError: true,
      error: { status: 400, data: { error: 'as_of_date cannot be in the future' } },
      refetch: jest.fn(),
    });
    renderPage();
    expect(screen.getByText('Failed to load report data. Please try again later.')).toBeInTheDocument();
    expect(screen.queryByText('as_of_date cannot be in the future')).not.toBeInTheDocument();
    expect(downloadButton()).toBeDisabled();
  });

  describe('typed dates', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('requests only the settled date, never intermediate or invalid parses', () => {
      renderPage();
      const today = dayjs();
      const target = today.subtract(4, 'day');
      act(() => {
        pickerProps.onChange(today.subtract(14, 'day'));
        pickerProps.onChange(dayjs('invalid'));
        pickerProps.onChange(dayjs('0202-10-11'));
        pickerProps.onChange(target);
      });
      act(() => {
        jest.advanceTimersByTime(DATE_DEBOUNCE);
      });
      expect(requestedDates()).toEqual([today.format('YYYY-MM-DD'), target.format('YYYY-MM-DD')]);
      expect(lastArgs().as_of_date).toBe(target.format('YYYY-MM-DD'));
    });

    it.each([
      ['an invalid date', () => dayjs('invalid'), 'Enter a valid date (DD/MM/YYYY) from 01/01/2000 onwards.'],
      ['a year before 2000', () => dayjs('0202-10-11'), 'Enter a valid date (DD/MM/YYYY) from 01/01/2000 onwards.'],
      ['a future date', () => dayjs().add(5, 'day'), 'The date cannot be later than today.'],
    ])('shows friendly copy and skips the request for %s', (_label, makeDate, message) => {
      renderPage();
      act(() => pickerProps.onChange(makeDate()));
      act(() => {
        jest.advanceTimersByTime(DATE_DEBOUNCE);
      });
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(lastArgs()).toBe(skipToken);
      expect(pickerProps.error).toBe(true);
      expect(downloadButton()).toBeDisabled();
    });
  });

  it('marks a partial MRP value (some batches unpriced) but keeps the number in the CSV', () => {
    mockQuery({
      ...FIXTURE,
      rows: [{ ...FIXTURE.rows[0], value_mrp: '100.00', has_unpriced_mrp: true }],
    });
    renderPage();
    expect(screen.getByText('partial')).toBeInTheDocument();
    expect(screen.getAllByText('₹100.00').length).toBeGreaterThan(0);
    expect(exportCsv('product').data[0]['Value @ MRP (₹)']).toBe('100.00');
  });

  describe('selling price', () => {
    const AT_MRP_TIP = 'Not sold by this date — priced at current MRP';
    const AT_MRP_PRODUCT_TIP = 'Some batches were not sold by this date — priced at current MRP';

    it('adds a Value @ Selling Price column, footer total and summary card', () => {
      renderPage();
      const headers = within(screen.getAllByRole('rowgroup')[0]);
      expect(headers.getByText((_, el) => el?.textContent === 'Value @Selling Price' && el.tagName === 'SPAN')).toBeInTheDocument();
      expect(screen.getByText('Value @ Selling Price')).toBeInTheDocument(); // summary card
      // Row value + footer total + summary card.
      expect(screen.getAllByText('₹1,350.00')).toHaveLength(3);
    });

    it('marks a product with batches priced at MRP, explained by a tooltip', () => {
      renderPage();
      const marked = screen.getByLabelText(AT_MRP_PRODUCT_TIP);
      expect(marked).toHaveTextContent('₹1,350.00MRP');
      expect(within(marked).getByText('MRP')).toHaveStyle({ color: '#F59E0B' }); // same amber as est./partial
    });

    it('shows a partial selling value when a stocked batch has no sale and no MRP', () => {
      mockQuery({
        ...FIXTURE,
        rows: [
          {
            ...FIXTURE.rows[0],
            value_selling: '1200.00',
            batches: [
              { ...FIXTURE.rows[0].batches[0], selling_price_per_unit: null, selling_price_basis: null, value_selling: null },
              BATCH,
            ],
          },
        ],
      });
      renderPage();
      expect(screen.getByLabelText('Partial: some batches of this product have no selling price')).toHaveTextContent(
        '₹1,200.00partial'
      );
      expect(exportCsv('product').data[0]['Value @ Selling Price (₹)']).toBe('1200.00');
    });

    it('does not call a product partial for a sold batch that has no MRP', () => {
      mockQuery({
        ...FIXTURE,
        rows: [
          {
            ...FIXTURE.rows[0],
            value_mrp: '1500.00',
            has_unpriced_mrp: true,
            has_selling_at_mrp: false,
            batches: [{ ...FIXTURE.rows[0].batches[0], mrp_per_unit: null, value_mrp: null, selling_price_basis: 'LAST_SALE' }, BATCH],
          },
        ],
      });
      renderPage();
      // MRP is partial, the selling value is complete.
      expect(screen.getAllByText('partial')).toHaveLength(1);
      expect(screen.getByLabelText('Partial: some batches of this product have no MRP')).toBeInTheDocument();
    });

    it('batch-wise: shows the per-unit selling price and marks both cells of an MRP-priced batch', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'Batch-wise' }));
      const headers = within(screen.getAllByRole('rowgroup')[0]);
      expect(headers.getByText((_, el) => el?.textContent === 'Selling Priceper unit' && el.tagName === 'SPAN')).toBeInTheDocument();
      expect(headers.getByText((_, el) => el?.textContent === 'Value @Selling Price' && el.tagName === 'SPAN')).toBeInTheDocument();
      expect(screen.getByText('₹12.00')).toBeInTheDocument(); // last sale, no marker
      // Like "est.": the per-unit price and the value of the MRP-priced batch are both marked.
      expect(screen.getAllByLabelText(AT_MRP_TIP).map((el) => el.textContent)).toEqual(['₹15.00MRP', '₹150.00MRP']);
      expect(screen.getAllByText('MRP')).toHaveLength(2);
      expect(screen.getByText('₹1,200.00')).toBeInTheDocument();
    });

    it('notes batches priced at MRP in the data-quality strip, singular and plural', () => {
      mockQuery({ ...FIXTURE, summary: { ...FIXTURE.summary, ...ZERO_COUNTERS, selling_at_mrp_batch_count: 1 } });
      const { unmount } = renderPage();
      expect(screen.getByRole('status')).toHaveTextContent(
        '1 batch was not sold by this date; its selling price is the current MRP.'
      );
      unmount();
      mockQuery({ ...FIXTURE, summary: { ...FIXTURE.summary, ...ZERO_COUNTERS, selling_at_mrp_batch_count: 3 } });
      renderPage();
      expect(screen.getByRole('status')).toHaveTextContent(
        '3 batches were not sold by this date; their selling price is the current MRP.'
      );
    });
  });

  describe('product-wise / batch-wise view', () => {
    const switchToBatch = () => fireEvent.click(viewButton('Batch-wise'));

    it('defaults to product-wise and switches to batch-wise without refetching', () => {
      renderPage();
      expect(viewButton('Product-wise')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByText('AMX-B1')).not.toBeInTheDocument();
      const argsBefore = lastArgs();

      switchToBatch();
      expect(viewButton('Batch-wise')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('AMX-B1')).toBeInTheDocument();
      // Every request since mount used the same args: the switch is client-only.
      expect(allArgs().every((a) => JSON.stringify(a) === JSON.stringify(argsBefore))).toBe(true);
      expect(mockedReports.useGetClosingStockReportQuery.mock.calls.at(-1)[1]).toEqual({
        refetchOnMountOrArgChange: true,
      });

      // Exclusive and never empty: clicking the active option keeps it selected.
      switchToBatch();
      expect(viewButton('Batch-wise')).toHaveAttribute('aria-pressed', 'true');
    });

    it('remembers the view per user', () => {
      const { unmount } = renderPage();
      switchToBatch();
      expect(localStorage.getItem(VIEW_KEY)).toBe('batch');
      unmount();

      renderPage();
      expect(viewButton('Batch-wise')).toHaveAttribute('aria-pressed', 'true');
    });

    it("does not give one user another user's saved view", () => {
      localStorage.setItem(VIEW_KEY, 'batch');
      renderPage(8);
      expect(viewButton('Product-wise')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByText('AMX-B1')).not.toBeInTheDocument();
    });

    it('still switches views when localStorage is unavailable', () => {
      const blocked = () => {
        throw new Error('blocked');
      };
      const get = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
      const set = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
      try {
        renderPage();
        expect(viewButton('Product-wise')).toHaveAttribute('aria-pressed', 'true');
        switchToBatch();
        expect(viewButton('Batch-wise')).toHaveAttribute('aria-pressed', 'true');
      } finally {
        get.mockRestore();
        set.mockRestore();
      }
    });

    it('renders one flat row per batch with batch columns, markers and the same totals', () => {
      renderPage();
      switchToBatch();
      ['Batch', 'Expiry', /^Unit Cost/].forEach((h) => expect(screen.getAllByText(h).length).toBeGreaterThan(0));
      // Brand + product repeated on each batch row.
      expect(screen.getAllByText('Amoxicillin 500mg')).toHaveLength(2);
      expect(screen.getAllByText('Cipla')).toHaveLength(2);
      expect(screen.getByText('31/03/2027')).toBeInTheDocument();
      expect(screen.getByText('₹896.00')).toBeInTheDocument();
      // Estimated cost marked on the unit cost and both value cells of the estimated batch.
      expect(screen.getAllByText('est.')).toHaveLength(3);
      // Negative batch in red; its null expiry / costs / MRP render as em dashes.
      expect(screen.getByText('-4')).toHaveStyle({ color: '#DC2626' });
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      // Bandage batch: missing brand + product code, plus null expiry, unit cost, two costs, MRP,
      // selling price and selling value.
      expect(screen.getAllByText('—')).toHaveLength(9);
      // Server totals in the footer and summary, count card shows batches.
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getAllByText('106')).toHaveLength(2);
      expect(screen.queryByText(/Value @ Cost/)).not.toBeInTheDocument();
      expect(screen.getByText('Batches')).toBeInTheDocument();
      expect(screen.queryByText('Products')).not.toBeInTheDocument();
      expect(screen.queryByText(/NaN|Invalid/)).not.toBeInTheDocument();
    });

    const batchOrder = () => screen.getAllByText(/^(AMX-B\d|BND-9)$/).map((el) => el.textContent);
    const productOrder = () =>
      screen.getAllByText(/^(Amoxicillin 500mg|Bandage Roll)$/).map((el) => el.textContent);
    const clickHeader = (name: string) =>
      fireEvent.click(within(screen.getAllByRole('rowgroup')[0]).getByText(name));

    it('sorts batch rows by Expiry ascending and descending, missing expiry always last', () => {
      renderPage();
      switchToBatch();
      clickHeader('Expiry');
      expect(batchOrder()).toEqual(['AMX-B1', 'AMX-B2', 'BND-9']);
      clickHeader('Expiry');
      expect(batchOrder()).toEqual(['AMX-B2', 'AMX-B1', 'BND-9']);
    });

    it('falls back to the default sort in product view and restores the Expiry sort in batch view', () => {
      renderPage();
      switchToBatch();
      clickHeader('Expiry');
      clickHeader('Expiry'); // descending
      fireEvent.click(viewButton('Product-wise'));
      expect(productOrder()).toEqual(['Amoxicillin 500mg', 'Bandage Roll']);
      // The default (Product ascending) is the active sort, so one click flips it to descending.
      clickHeader('Product');
      expect(productOrder()).toEqual(['Bandage Roll', 'Amoxicillin 500mg']);

      clickHeader('Product'); // back to ascending
      fireEvent.click(viewButton('Batch-wise'));
      expect(batchOrder()).toEqual(['AMX-B1', 'AMX-B2', 'BND-9']); // product sort carries over

      clickHeader('Expiry');
      clickHeader('Expiry');
      fireEvent.click(viewButton('Product-wise'));
      fireEvent.click(viewButton('Batch-wise'));
      expect(batchOrder()).toEqual(['AMX-B2', 'AMX-B1', 'BND-9']);
    });

    it('marks an expired batch with red date text and an Expired chip', () => {
      renderPage();
      switchToBatch();
      const date = screen.getByText('30/09/2026');
      expect(date).toHaveStyle({ color: '#DC2626' });
      expect(screen.getAllByText('Expired')).toHaveLength(1);
      expect(date.parentElement).toHaveTextContent('30/09/2026Expired');
      expect(screen.getByText('31/03/2027')).not.toHaveStyle({ color: '#DC2626' });
    });

    it('shows the unit cost of a zero-qty batch with 0.00 values (cost_basis null), not em dashes', () => {
      mockQuery({
        ...FIXTURE,
        rows: [
          {
            ...FIXTURE.rows[0],
            batches: [
              {
                ...BATCH,
                quantity: '0.00',
                value_cost_ex_gst: '0.00',
                value_cost_inc_gst: '0.00',
                value_mrp: '0.00',
                cost_basis: null,
              },
            ],
          },
        ],
        summary: { ...FIXTURE.summary, ...ZERO_COUNTERS, batch_count: 1 },
      });
      renderPage();
      switchToBatch();
      expect(screen.getByText('₹8.00')).toBeInTheDocument();
      expect(screen.queryByText('—')).not.toBeInTheDocument();
      expect(screen.queryByText('est.')).not.toBeInTheDocument();
      expect(exportCsv('batch').data[0]).toMatchObject({ 'Unit Cost excl. GST (₹)': '8.00', 'Cost Basis': null });
    });

    it('shows a batch-specific empty state when the products have no batches', () => {
      mockQuery({
        ...FIXTURE,
        rows: [{ ...FIXTURE.rows[0], quantity: '0.00', batches: [] }],
        summary: { ...FIXTURE.summary, batch_count: 0 },
      });
      renderPage();
      expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();
      switchToBatch();
      expect(
        screen.getByText('The matching products have never been stocked, so there are no batches to show.')
      ).toBeInTheDocument();
      openDownloadMenu();
      expect(menuItem(/Batch-wise CSV/)).toHaveAttribute('aria-disabled', 'true');
      expect(menuItem(/Product-wise CSV/)).not.toHaveAttribute('aria-disabled');
    });
  });

  describe('download menu', () => {
    it('offers both CSVs; product-wise is unchanged and logged as before', () => {
      renderPage();
      const button = downloadButton();
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
      expect(button).not.toHaveAttribute('aria-controls');
      const menu = openDownloadMenu();
      // The open menu is labelled by the button and the button points at the menu.
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(document.getElementById(button.getAttribute('aria-controls')!)).toContainElement(menu);
      expect(menu).toHaveAttribute('aria-labelledby', button.id);
      expect(menu).toHaveAccessibleName('Download CSV');
      expect(menuItem(/Batch-wise CSV/)).toBeInTheDocument();
      fireEvent.click(menuItem(/Product-wise CSV/));
      const [logDownload] = mockedActivity.useLogDownloadMutation.mock.results[0].value;
      expect(logDownload).toHaveBeenCalledWith({
        category: 'report',
        name: 'Closing Stock Report',
        format: 'csv',
        count: 2,
      });
      expect(csvProps.filename).toBe('closing_stock_report_2026-10-15.csv');
    });

    it('builds the batch-wise CSV: one row per batch, CSV-only columns and a totals row', () => {
      renderPage();
      const batchCsvProps = exportCsv('batch');
      expect(batchCsvProps.filename).toBe('closing_stock_report_batchwise_2026-10-15.csv');
      expect(batchCsvProps.data).toHaveLength(4);
      expect(Object.keys(batchCsvProps.data[0])).toEqual([
        'Brand',
        'Product',
        'Product Code',
        'Batch',
        'Expiry',
        'Expired',
        'Qty (units)',
        'Unit Cost excl. GST (₹)',
        'Unit Cost incl. GST (₹)',
        'MRP per Unit (₹)',
        'Selling Price per Unit (₹)',
        'Selling Price Basis',
        'Purchase Value excl. GST (₹)',
        'Purchase Value incl. GST (₹)',
        'Value @ MRP (₹)',
        'Value @ Selling Price (₹)',
        'Cost Basis',
      ]);
      expect(batchCsvProps.data[0]).toEqual({
        Brand: 'Cipla',
        Product: 'Amoxicillin 500mg',
        'Product Code': 'AMX-500',
        Batch: 'AMX-B1',
        Expiry: '2026-09-30',
        Expired: 'Yes',
        'Qty (units)': '10',
        'Unit Cost excl. GST (₹)': '10.00',
        'Unit Cost incl. GST (₹)': '11.20',
        'MRP per Unit (₹)': '15.00',
        'Selling Price per Unit (₹)': '15.00',
        'Selling Price Basis': 'MRP',
        'Purchase Value excl. GST (₹)': '100.00',
        'Purchase Value incl. GST (₹)': '112.00',
        'Value @ MRP (₹)': '150.00',
        'Value @ Selling Price (₹)': '150.00',
        'Cost Basis': 'ESTIMATED',
      });
      expect(batchCsvProps.data[1]).toMatchObject({
        Batch: 'AMX-B2',
        Expired: 'No',
        'Qty (units)': '100',
        'Selling Price per Unit (₹)': '12.00',
        'Selling Price Basis': 'Last sale',
        'Value @ Selling Price (₹)': '1200.00',
      });
      expect(batchCsvProps.data[2]).toMatchObject({
        Product: 'Bandage Roll',
        Expiry: null, // raw null: the CSV builder writes an empty cell
        'Qty (units)': '-4',
        'Unit Cost excl. GST (₹)': '',
        'Value @ MRP (₹)': '',
        'Selling Price per Unit (₹)': '',
        'Selling Price Basis': '',
        'Value @ Selling Price (₹)': '',
        'Cost Basis': 'MISSING',
      });
      expect(batchCsvProps.data[3]).toMatchObject({
        Brand: 'Total',
        Batch: '',
        'Qty (units)': '106',
        'Purchase Value excl. GST (₹)': '900.00',
        'Value @ MRP (₹)': '1650.00',
        'Value @ Selling Price (₹)': '1350.00',
        'Selling Price Basis': '',
      });

      const [logDownload] = mockedActivity.useLogDownloadMutation.mock.results[0].value;
      expect(logDownload).toHaveBeenCalledWith({
        category: 'report',
        name: 'Closing Stock Report (Batch-wise)',
        format: 'csv',
        count: 3,
      });
    });
  });
});
