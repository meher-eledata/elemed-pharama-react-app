global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen } from '@testing-library/react';
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
jest.mock('react-csv', () => ({
  __esModule: true,
  CSVLink: () => <div data-testid="csv-link" />,
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
});
