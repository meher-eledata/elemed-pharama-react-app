global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen } from '@testing-library/react';
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
    total_mrp_value: '1200.00',
    product_count: 1,
    invoice_count: 1,
    hsn_count: 1,
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
          <SalesTaxReport />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockedMaster.useGetProductsQuery.mockReturnValue({ data: [], isLoading: false, error: undefined });
  mockedReports.useGetSalesTaxReportQuery.mockReturnValue({
    data: FIXTURE,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
});

describe('SalesTaxReport page', () => {
  it('renders the page title', () => {
    renderPage();
    expect(screen.getAllByText('Sales Tax Report').length).toBeGreaterThan(0);
  });

  it('renders key tax table columns and the row product', () => {
    renderPage();
    expect(screen.getByText('Taxable Value')).toBeInTheDocument();
    expect(screen.getAllByText('Total Tax').length).toBeGreaterThan(0);
    expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();
  });

  it('formats the line total as ₹ and never renders NaN', () => {
    renderPage();
    // line_total "1234.50" -> ₹1,234.50 (table cell) and total_sales summary card.
    expect(screen.getAllByText('₹1,234.50').length).toBeGreaterThan(0);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});
