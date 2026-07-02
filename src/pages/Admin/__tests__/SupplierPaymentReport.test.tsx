global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import SupplierPaymentReport from '../SupplierPaymentReport';
import * as reportsApi from '../../../redux/slices/reportsApi';
import * as masterApi from '../../../redux/slices/masterApi';

const theme = createTheme();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Stub heavy deps (x-charts bar chart, lazy recharts pie chart, date picker, react-csv).
jest.mock('../../../components/AdminReports/ReportBarChart', () => ({
  __esModule: true,
  default: () => <div data-testid="report-bar-chart" />,
}));
jest.mock('../../../components/Charts/PaymentTypePieChart', () => ({
  __esModule: true,
  default: () => <div data-testid="payment-pie-chart" />,
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
  return { __esModule: true, ...actual, useGetSupplierPaymentReportQuery: jest.fn() };
});
jest.mock('../../../redux/slices/masterApi', () => {
  const actual = jest.requireActual('../../../redux/slices/masterApi');
  return { __esModule: true, ...actual, useGetSuppliersQuery: jest.fn() };
});

const mockedReports = reportsApi as unknown as {
  useGetSupplierPaymentReportQuery: jest.Mock;
};
const mockedMaster = masterApi as unknown as { useGetSuppliersQuery: jest.Mock };

// Money fields as STRINGS (pg numeric serialization).
const FIXTURE: reportsApi.SupplierPaymentReportResponse = {
  rows: [
    {
      payment_id: 9001,
      receipt_id: 501,
      invoice_date: '2026-06-10',
      supplier_id: 1,
      supplier_name: 'Acme Pharma',
      total_bill_amount: '5000.00',
      cgst: '6.00',
      sgst: '6.00',
      igst: '0.00',
      total_tax: '12.00',
      discount: '5.00',
      payment_done: '4800.00',
      transaction_date: '2026-06-12',
      payment_method: 'BANK_TRANSFER',
      pending_due_supplier: '200.00',
    },
  ],
  summary: {
    total_paid: '1234.50',
    payment_count: 1,
    supplier_count: 1,
    total_pending_due: '200.00',
  },
  charts: {
    paid_by_date: [{ date: '2026-06-12', paid: '1234.50' }],
    paid_by_method: [{ method: 'BANK_TRANSFER', paid: '1234.50', count: 1 }],
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
          <SupplierPaymentReport />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockedMaster.useGetSuppliersQuery.mockReturnValue({ data: [], isLoading: false, error: undefined });
  mockedReports.useGetSupplierPaymentReportQuery.mockReturnValue({
    data: FIXTURE,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
});

describe('SupplierPaymentReport page', () => {
  it('renders the page title', () => {
    renderPage();
    expect(screen.getAllByText('Supplier Payment Report').length).toBeGreaterThan(0);
  });

  it('renders the KPI labels (overview tab is default)', () => {
    renderPage();
    expect(screen.getByText(/total paid/i)).toBeInTheDocument();
    expect(screen.getAllByText(/payments/i).length).toBeGreaterThan(0);
  });

  it('formats a money value as ₹ and never renders NaN', () => {
    renderPage();
    // total_paid "1234.50" -> ₹1,234.50
    expect(screen.getAllByText('₹1,234.50').length).toBeGreaterThan(0);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});
