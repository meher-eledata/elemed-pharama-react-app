global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import DetailedSalesTable from '../DetailedSalesTable';
import * as reportsApi from '../../../redux/slices/reportsApi';

const theme = createTheme();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Capture the CSV rows handed to CSVLink so the export mapping can be asserted.
jest.mock('react-csv', () => {
  const ReactLib = require('react');
  return {
    __esModule: true,
    CSVLink: ReactLib.forwardRef((props: any, _ref: any) =>
      ReactLib.createElement('div', {
        'data-testid': 'csv-link',
        'data-csv': JSON.stringify(props.data),
      })
    ),
  };
});

// The MUI date picker needs a LocalizationProvider; stub it like sibling report
// tests stub DateRangeFilter.
jest.mock('../../../components/Common', () => {
  const actual = jest.requireActual('../../../components/Common');
  return {
    __esModule: true,
    ...actual,
    PharmaDatePicker: () => <div data-testid="date-picker" />,
  };
});

jest.mock('../../../redux/slices/reportsApi', () => {
  const actual = jest.requireActual('../../../redux/slices/reportsApi');
  return { __esModule: true, ...actual, useGetDailySalesTableQuery: jest.fn() };
});
jest.mock('../../../redux/slices/activityApi', () => {
  const actual = jest.requireActual('../../../redux/slices/activityApi');
  return {
    __esModule: true,
    ...actual,
    useLogDownloadMutation: jest.fn(() => [jest.fn(() => Promise.resolve())]),
  };
});
jest.mock('../../../utils/cartStorage', () => ({
  getSalesHistoryFromStorage: jest.fn(() => []),
}));

const mockedReports = reportsApi as unknown as { useGetDailySalesTableQuery: jest.Mock };

// Money fields as STRINGS (pg numeric serialization). customer_details carries
// the invoice-level free text on Sale AND Refund rows (null where not set).
const FIXTURE: reportsApi.DailySalesTableItem[] = [
  {
    transaction_date: '2026-07-16',
    transaction_type: 'Sale',
    invoice_number: '42',
    customer_name: 'John Patient',
    doctor_name: 'Dr. Smith',
    payment_type: 'CASH',
    sales_amount: '1000.00',
    discount_amount: '0.00',
    cgst: '45.00',
    sgst: '45.00',
    igst: '0.00',
    total_amount: '1090.00',
    patient_type: 'OUTPATIENT',
    customer_details: 'Ward 4 follow-up',
  },
  {
    transaction_date: '2026-07-16',
    transaction_type: 'Refund',
    invoice_number: '41',
    customer_name: 'Jane Patient',
    doctor_name: 'Dr. Jones',
    payment_type: 'UPI',
    sales_amount: '200.00',
    discount_amount: '0.00',
    cgst: '9.00',
    sgst: '9.00',
    igst: '0.00',
    total_amount: '218.00',
    patient_type: 'OUTPATIENT',
    customer_details: null,
  },
  // A Deletion row whose invoice has no payment row at all: the backend emits
  // 'UNKNOWN'. Bug 2026-09-07: this used to be rendered as "Cash".
  {
    transaction_date: '2026-07-16',
    transaction_type: 'Deletion',
    invoice_number: '40',
    customer_name: 'Sam Patient',
    doctor_name: 'Dr. Lee',
    payment_type: 'UNKNOWN',
    sales_amount: '-300.00',
    discount_amount: '0.00',
    cgst: '-13.50',
    sgst: '-13.50',
    igst: '0.00',
    total_amount: '-327.00',
    patient_type: 'OUTPATIENT',
    customer_details: null,
  },
];

const createStore = () =>
  configureStore({
    reducer: {
      auth: (state = { token: 'JWT123', user: null }) => state,
      // selectOrganization reads state.org.organization (INV-cosmetic gating).
      org: (state = { organization: null, activeModules: [], loaded: false }) => state,
      [reportsApi.reportsApi.reducerPath]: reportsApi.reportsApi.reducer,
    },
    middleware: (gDM) => gDM().concat(reportsApi.reportsApi.middleware),
  });

const renderPage = () =>
  render(
    <Provider store={createStore()}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <DetailedSalesTable />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockedReports.useGetDailySalesTableQuery.mockReturnValue({
    data: FIXTURE,
    isLoading: false,
    isError: false,
  });
});

describe('DetailedSalesTable page', () => {
  it('renders the page title', () => {
    renderPage();
    expect(screen.getByText('Detailed sales table')).toBeInTheDocument();
  });

  it('renders the Customer Details column with sale-row value and a dash for null', () => {
    renderPage();
    expect(screen.getByText('Customer Details')).toBeInTheDocument();
    expect(screen.getByText('Ward 4 follow-up')).toBeInTheDocument();
    // The refund row has customer_details null and renders the dash placeholder.
    const refundRow = screen.getByText('Jane Patient').closest('tr')!;
    expect(refundRow).toHaveTextContent('-');
  });

  it('never invents "Cash" for a row with no payment method (renders Unknown)', () => {
    renderPage();
    const deletionRow = screen.getByText('Sam Patient').closest('tr')!;
    expect(deletionRow).toHaveTextContent('Unknown');
    expect(deletionRow).not.toHaveTextContent('Cash');
    // Real methods still render in Title Case.
    expect(screen.getByText('John Patient').closest('tr')!).toHaveTextContent('Cash');
    expect(screen.getByText('Jane Patient').closest('tr')!).toHaveTextContent('Upi');
    const csvRows = JSON.parse(
      screen.getByTestId('csv-link').getAttribute('data-csv') || '[]'
    );
    expect(csvRows.find((r: any) => r['Invoice Number'] === '40')['Payment Type']).toBe('Unknown');
  });

  it('includes Customer Details in the CSV export mapping', () => {
    renderPage();
    const csvRows = JSON.parse(
      screen.getByTestId('csv-link').getAttribute('data-csv') || '[]'
    );
    const saleRow = csvRows.find((r: any) => r['Invoice Number'] === '42');
    const refundRow = csvRows.find((r: any) => r['Invoice Number'] === '41');
    expect(saleRow['Customer Details']).toBe('Ward 4 follow-up');
    expect(refundRow['Customer Details']).toBe('');
  });
});
