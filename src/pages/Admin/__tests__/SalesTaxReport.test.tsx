global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import SalesTaxReport from '../SalesTaxReport';
import * as reportsApi from '../../../redux/slices/reportsApi';
import * as masterApi from '../../../redux/slices/masterApi';

const theme = createTheme();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../../components/mainDashboard/DateRangeFilter/DateRangeFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="date-range-filter" />,
}));
// Stub the chart components (canvas/measurement machinery jsdom can't run).
jest.mock('../../../components/AdminReports/ReportBarChart', () => ({
  __esModule: true,
  default: () => <div data-testid="report-bar-chart" />,
}));
jest.mock('../../../components/Charts/PaymentTypePieChart', () => ({
  __esModule: true,
  default: () => <div data-testid="pie-chart" />,
}));
jest.mock('react-csv', () => ({
  __esModule: true,
  CSVLink: () => <div data-testid="csv-link" />,
}));

jest.mock('../../../redux/slices/reportsApi', () => {
  const actual = jest.requireActual('../../../redux/slices/reportsApi');
  return { __esModule: true, ...actual, useGetSalesTaxReportQuery: jest.fn() };
});
jest.mock('../../../redux/slices/masterApi', () => {
  const actual = jest.requireActual('../../../redux/slices/masterApi');
  return { __esModule: true, ...actual, useGetProductsQuery: jest.fn() };
});

const mockedReports = reportsApi as unknown as { useGetSalesTaxReportQuery: jest.Mock };
const mockedMaster = masterApi as unknown as { useGetProductsQuery: jest.Mock };

// taxable_value + cgst/sgst/igst amounts + totals as STRINGS (pg numeric serialization).
const FIXTURE: reportsApi.SalesTaxReportResponse = {
  level: 'product',
  rows: [
    {
      invoice_line_id: 7001,
      invoice_id: 300,
      invoice_number: 'INV-300',
      sale_date: '2026-06-15',
      product_id: 11,
      product_name: 'Amoxicillin 500mg',
      product_code: 'AMX-500',
      hsn_code: '3004',
      batch_number: 'B-001',
      quantity: '10.00',
      mrp: '120.00',
      selling_price: '100.00',
      taxable_value: '847.46',
      discount_amount: '15.00',
      cgst_rate: '6.00',
      sgst_rate: '6.00',
      igst_rate: '0.00',
      cgst_amount: '50.85',
      sgst_amount: '50.85',
      igst_amount: '0.00',
      total_tax: '101.70',
      line_total: '1234.50',
      customer_details: 'Ward 4 follow-up',
    },
  ],
  summary: {
    line_count: 1,
    total_quantity: '10.00',
    total_taxable: '847.46',
    total_discount: '15.00',
    total_cgst: '50.85',
    total_sgst: '50.85',
    total_igst: '0.00',
    total_tax: '101.70',
    total_sales: '1234.50',
    // SIGNED 2dp round-off (negative here to exercise the '-' rendering).
    round_off: '-0.40',
    total_mrp_value: '1200.00',
    product_count: 1,
    invoice_count: 1,
    hsn_count: 1,
  },
};

// HSN rows are grouped by (hsn_code, cgst_rate, sgst_rate, igst_rate); rates are numeric-strings.
const HSN_FIXTURE: reportsApi.SalesTaxReportResponse = {
  level: 'hsn',
  rows: [
    {
      hsn_code: '3004',
      cgst_rate: '6.00',
      sgst_rate: '6.00',
      igst_rate: '0.00',
      line_count: 1,
      product_count: 1,
      quantity: '10.00',
      taxable_value: '847.46',
      discount_amount: '15.00',
      cgst_amount: '50.85',
      sgst_amount: '50.85',
      igst_amount: '0.00',
      total_tax: '101.70',
      line_total: '1234.50',
    },
  ],
  summary: FIXTURE.summary,
};

// One row per invoice; invoice_total is the WHOLE-RUPEE stored grand total ("457.00"
// is the 2dp pg cast of a whole-rupee value) and must render with no paise tail.
const INVOICE_FIXTURE: reportsApi.SalesTaxReportResponse = {
  level: 'invoice',
  rows: [
    {
      invoice_id: 300,
      invoice_number: 'INV-300',
      sale_date: '2026-06-15',
      customer_details: 'Ward 4 follow-up',
      line_count: 2,
      product_count: 2,
      quantity: '10.00',
      taxable_value: '847.46',
      discount_amount: '15.00',
      cgst_amount: '50.85',
      sgst_amount: '50.85',
      igst_amount: '0.00',
      total_tax: '101.70',
      line_total: '1234.50',
      invoice_total: '457.00',
      // Signed 2dp per-invoice round-off (positive: rounded up to the whole rupee).
      round_off: '0.50',
    },
  ],
  summary: FIXTURE.summary,
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
          <SalesTaxReport />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockedMaster.useGetProductsQuery.mockReturnValue({ data: [], isLoading: false, error: undefined });
  // The page issues two queries: the main one (current level) and a level:"hsn"
  // lookup for the HSN dropdown — resolve each by the requested level.
  mockedReports.useGetSalesTaxReportQuery.mockImplementation((args: { level?: string }) => ({
    data:
      args?.level === 'hsn'
        ? HSN_FIXTURE
        : args?.level === 'invoice'
          ? INVOICE_FIXTURE
          : FIXTURE,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }));
});

describe('SalesTaxReport page', () => {
  it('renders the page title', () => {
    renderPage();
    expect(screen.getAllByText('Sales Tax Report').length).toBeGreaterThan(0);
  });

  it('shows the Range Aggregates on the default Overview tab, without a table', () => {
    renderPage();
    expect(screen.getByText('Range Aggregates')).toBeInTheDocument();
    expect(screen.getByText('Total Taxable Value')).toBeInTheDocument();
    // Table rows belong to the detailed tabs only.
    expect(screen.queryByText('Amoxicillin 500mg')).not.toBeInTheDocument();
  });

  it('shows the Overview charts on the Overview tab only', () => {
    renderPage();
    expect(screen.getByText('Tax Collected by Date')).toBeInTheDocument();
    expect(screen.getByText('Top Products by Taxable Value')).toBeInTheDocument();
    expect(screen.getByText('Tax Composition')).toBeInTheDocument();
    expect(screen.getAllByTestId('report-bar-chart')).toHaveLength(2);
    // Composition legend: CGST/SGST present; IGST is 0 in the fixture — filtered out.
    expect(screen.getByText('CGST')).toBeInTheDocument();
    expect(screen.getByText('SGST')).toBeInTheDocument();
    expect(screen.queryByText('IGST')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Product-wise'));
    expect(screen.queryByTestId('report-bar-chart')).not.toBeInTheDocument();
    expect(screen.queryByText('Tax Collected by Date')).not.toBeInTheDocument();
  });

  it('renders key tax table columns and the row product on the Product-wise tab', () => {
    renderPage();
    fireEvent.click(screen.getByText('Product-wise'));
    expect(screen.getByText('Taxable Value')).toBeInTheDocument();
    expect(screen.getAllByText('Total Tax').length).toBeGreaterThan(0);
    expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();
    // Aggregates live on Overview only.
    expect(screen.queryByText('Range Aggregates')).not.toBeInTheDocument();
  });

  it('shows the Customer Details column on the product-wise tab only', () => {
    renderPage();
    // Product-wise carries the per-invoice detail.
    fireEvent.click(screen.getByText('Product-wise'));
    expect(screen.getByText('Customer Details')).toBeInTheDocument();
    expect(screen.getByText('Ward 4 follow-up')).toBeInTheDocument();
    // HSN-wise rows are aggregated and must NOT show the column.
    fireEvent.click(screen.getByText('HSN-wise'));
    expect(screen.queryByText('Customer Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Ward 4 follow-up')).not.toBeInTheDocument();
  });

  it('shows CGST/SGST/IGST rate columns and values in the HSN-level table', () => {
    renderPage();
    fireEvent.click(screen.getByText('HSN-wise'));
    expect(screen.getByText('CGST%')).toBeInTheDocument();
    expect(screen.getByText('SGST%')).toBeInTheDocument();
    expect(screen.getByText('IGST%')).toBeInTheDocument();
    // cgst_rate/sgst_rate "6.00" -> 6.00% via formatPercent; igst_rate "0.00" -> 0.00%.
    expect(screen.getAllByText('6.00%').length).toBe(2);
    expect(screen.getByText('0.00%')).toBeInTheDocument();
  });

  it('offers an Invoice-wise switcher option rendering the invoice-level table', () => {
    renderPage();
    fireEvent.click(screen.getByText('Invoice-wise'));
    expect(screen.getByText('Invoice No')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Lines')).toBeInTheDocument();
    expect(screen.getByText('Invoice Total')).toBeInTheDocument();
    expect(screen.getByText('INV-300')).toBeInTheDocument();
    expect(screen.getByText('Ward 4 follow-up')).toBeInTheDocument();
  });

  it('shows the SIGNED 2dp summary Round-off figure on the Overview tab', () => {
    renderPage();
    // Overview: summary round_off "-0.40" -> -₹0.40.
    expect(screen.getByText('Round-off')).toBeInTheDocument();
    expect(screen.getByText('-₹0.40')).toBeInTheDocument();
  });

  it('renders a signed 2dp Round-off column in the invoice-wise table', () => {
    renderPage();
    fireEvent.click(screen.getByText('Invoice-wise'));
    expect(screen.getByText('Round-off')).toBeInTheDocument();
    // Per-row round_off "0.50" -> +₹0.50 (signed, paise kept).
    expect(screen.getByText('+₹0.50')).toBeInTheDocument();
    // Totals-footer figure stays signed 2dp.
    expect(screen.getByText('-₹0.40')).toBeInTheDocument();
  });

  it('renders invoice_total as a WHOLE-RUPEE amount (no ".00" paise tail)', () => {
    renderPage();
    fireEvent.click(screen.getByText('Invoice-wise'));
    // invoice_total "457.00" (whole-rupee value, 2dp pg cast) -> ₹457.
    expect(screen.getByText('₹457')).toBeInTheDocument();
    expect(screen.queryByText('₹457.00')).not.toBeInTheDocument();
  });

  it('formats the line total as ₹ and never renders NaN', () => {
    renderPage();
    fireEvent.click(screen.getByText('Product-wise'));
    // line_total "1234.50" -> ₹1,234.50 (table cell).
    expect(screen.getAllByText('₹1,234.50').length).toBeGreaterThan(0);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});
