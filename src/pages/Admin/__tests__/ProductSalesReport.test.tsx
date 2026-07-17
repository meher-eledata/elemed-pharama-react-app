global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import ProductSalesReport from '../ProductSalesReport';
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
  return { __esModule: true, ...actual, useGetProductSalesReportQuery: jest.fn() };
});
jest.mock('../../../redux/slices/masterApi', () => {
  const actual = jest.requireActual('../../../redux/slices/masterApi');
  return { __esModule: true, ...actual, useGetProductsQuery: jest.fn() };
});

const mockedReports = reportsApi as unknown as { useGetProductSalesReportQuery: jest.Mock };
const mockedMaster = masterApi as unknown as { useGetProductsQuery: jest.Mock };

// Money / qty fields as STRINGS (pg numeric serialization).
const FIXTURE: reportsApi.ProductSalesReportResponse = {
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
      patient_type: 'OUTPATIENT',
      customer_name: 'John Patient',
      quantity: '10.00',
      mrp: '120.00',
      pack_qty: 10,
      unit_mrp: '12.00',
      selling_price: '100.00',
      discount_pct: '5.00',
      discount_amount: '50.00',
      cgst_amount: '54.46',
      sgst_amount: '54.46',
      igst_amount: '0.00',
      total_tax: '108.93',
      line_total: '1234.50',
      customer_details: 'Ward 4 follow-up',
    },
  ],
  summary: {
    line_count: 1,
    total_quantity: '10.00',
    total_sales: '1234.50',
    total_cgst: '54.46',
    total_sgst: '54.46',
    total_igst: '0.00',
    total_tax: '108.93',
    product_count: 1,
    invoice_count: 1,
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
          <ProductSalesReport />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockedMaster.useGetProductsQuery.mockReturnValue({ data: [], isLoading: false, error: undefined });
  mockedReports.useGetProductSalesReportQuery.mockReturnValue({
    data: FIXTURE,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
});

describe('ProductSalesReport page', () => {
  it('renders the page title', () => {
    renderPage();
    expect(screen.getAllByText('Product Sales Report').length).toBeGreaterThan(0);
  });

  it('renders key table columns and the row product', () => {
    renderPage();
    expect(screen.getByText('Invoice #')).toBeInTheDocument();
    expect(screen.getAllByText('Product').length).toBeGreaterThan(0);
    expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();
  });

  it('renders the Customer Details column with the invoice-level value', () => {
    renderPage();
    expect(screen.getByText('Customer Details')).toBeInTheDocument();
    expect(screen.getByText('Ward 4 follow-up')).toBeInTheDocument();
  });

  it('formats the line total as ₹ and never renders NaN', () => {
    renderPage();
    // line_total "1234.50" -> ₹1,234.50
    expect(screen.getAllByText('₹1,234.50').length).toBeGreaterThan(0);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});
