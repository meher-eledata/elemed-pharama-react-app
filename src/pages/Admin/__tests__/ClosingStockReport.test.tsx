global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
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
let pickerProps: any = null;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));
jest.mock('../../../components/mainDashboard/DateRangeFilter/DateRangeFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="date-range-filter" />,
}));
jest.mock('react-csv', () => ({
  __esModule: true,
  CSVLink: (props: any) => {
    csvProps = props;
    return <div data-testid="csv-link" />;
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
    },
  ],
  summary: {
    ...ZERO_COUNTERS,
    product_count: 2,
    total_quantity: '106.00',
    total_value_cost_ex_gst: '900.00',
    total_value_cost_inc_gst: '1008.00',
    total_value_mrp: '1650.00',
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

const renderPage = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <ClosingStockReport />
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  csvProps = null;
  pickerProps = null;
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
    expect(screen.getAllByText('Value @ Cost excl. GST').length).toBeGreaterThan(0);
    expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();
    expect(screen.getAllByText('₹1,008.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getAllByText('106.00').length).toBeGreaterThan(0);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('shows NULL values as an em dash and negative quantity in red', () => {
    renderPage();
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.getByText('-4.00')).toHaveStyle({ color: '#DC2626' });
  });

  it('shows the data-quality strip only when a counter is > 0, and always the MRP note', () => {
    const { unmount } = renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('1 product has no purchase cost on record');
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
    // Named after the date the server echoed for THIS data set.
    expect(csvProps.filename).toBe('closing_stock_report_2026-10-15.csv');
    expect(csvProps.data).toHaveLength(3);
    expect(Object.keys(csvProps.data[0])).toEqual([
      'Brand',
      'Product',
      'Product Code',
      'Qty (units)',
      'Value @ Cost excl. GST (₹)',
      'Value @ Cost incl. GST (₹)',
      'Value @ MRP (₹)',
    ]);
    expect(csvProps.data[1]['Value @ Cost excl. GST (₹)']).toBe('');
    expect(csvProps.data[2]).toEqual({
      Brand: 'Total',
      Product: '',
      'Product Code': '',
      'Qty (units)': '106.00',
      'Value @ Cost excl. GST (₹)': '900.00',
      'Value @ Cost incl. GST (₹)': '1008.00',
      'Value @ MRP (₹)': '1650.00',
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
        },
      ],
      summary: { ...FIXTURE.summary, ...ZERO_COUNTERS, total_quantity: '0.00', total_value_cost_ex_gst: '0.00', total_value_cost_inc_gst: '0.00', total_value_mrp: '0.00' },
    });
    renderPage();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
    // 3 value cells + 3 footer totals + 3 summary-bar stats
    expect(screen.getAllByText('₹0.00')).toHaveLength(9);
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
    expect(csvProps.data).toEqual([]);
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
    expect(csvProps.data[0]['Value @ MRP (₹)']).toBe('100.00');
  });
});
