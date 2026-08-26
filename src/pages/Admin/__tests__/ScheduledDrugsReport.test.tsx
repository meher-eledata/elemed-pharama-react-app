global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import ScheduledDrugsReport from '../ScheduledDrugsReport';
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
  return { __esModule: true, ...actual, useGetScheduledDrugsReportQuery: jest.fn() };
});
jest.mock('../../../redux/slices/masterApi', () => {
  const actual = jest.requireActual('../../../redux/slices/masterApi');
  return { __esModule: true, ...actual, useGetProductsQuery: jest.fn() };
});

const mockedReports = reportsApi as unknown as { useGetScheduledDrugsReportQuery: jest.Mock };
const mockedMaster = masterApi as unknown as { useGetProductsQuery: jest.Mock };

// Qty fields as STRINGS (pg numeric serialization).
const FIXTURE: reportsApi.ScheduledDrugsReportResponse = {
  dispensing: [
    {
      entry_type: 'SALE',
      direction: 'OUT',
      entry_date: '2026-06-15',
      document_id: 300,
      document_number: 'INV-300',
      line_id: 7001,
      party_name: 'John Patient',
      party_address: '12 Lake Road',
      doctor_name: 'Dr. Rao',
      product_id: 11,
      product_name: 'Alprazolam 0.5mg',
      product_code: 'ALP-05',
      schedule: 'H1',
      batch_number: 'B-001',
      quantity: '10.00',
      restock_action: null,
    },
    {
      entry_type: 'SALES_RETURN',
      direction: 'IN',
      entry_date: '2026-06-16',
      document_id: 41,
      document_number: 'SR-41',
      line_id: 9,
      party_name: 'John Patient',
      party_address: '12 Lake Road',
      doctor_name: 'Dr. Rao',
      product_id: 11,
      product_name: 'Alprazolam 0.5mg',
      product_code: 'ALP-05',
      schedule: 'H1',
      batch_number: 'B-001',
      quantity: '2.00',
      restock_action: 'SCRAP',
    },
  ],
  receipts: [
    {
      entry_type: 'RECEIPT',
      direction: 'IN',
      entry_date: '2026-06-10',
      document_id: 55,
      document_number: 'RCP-55',
      line_id: 501,
      supplier_id: 3,
      supplier_name: 'Medico Distributors',
      product_id: 11,
      product_name: 'Alprazolam 0.5mg',
      product_code: 'ALP-05',
      schedule: 'H1',
      batch_number: 'B-001',
      quantity: '100.00',
    },
  ],
  balances: [
    {
      product_id: 11,
      product_name: 'Alprazolam 0.5mg',
      product_code: 'ALP-05',
      schedule: 'H1',
      opening_qty: '5.00',
      qty_in: '100.00',
      qty_out: '10.00',
      closing_qty: '95.00',
    },
  ],
  summary: {
    start_date: '2026-06-01',
    end_date: '2026-06-30',
    schedule: null,
    product_id: null,
    dispensing_row_count: 2,
    receipt_row_count: 1,
    scheduled_product_count: 1,
    total_dispensed_qty: '10.00',
    total_sales_returned_qty: '2.00',
    total_received_qty: '100.00',
    total_supplier_returned_qty: '0.00',
    unattributed_product_count: 0,
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
          <ScheduledDrugsReport />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );

const mockData = (data: reportsApi.ScheduledDrugsReportResponse) =>
  mockedReports.useGetScheduledDrugsReportQuery.mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });

beforeEach(() => {
  jest.clearAllMocks();
  mockedMaster.useGetProductsQuery.mockReturnValue({ data: [], isLoading: false, error: undefined });
  mockData(FIXTURE);
});

describe('ScheduledDrugsReport page', () => {
  it('renders the title, summary cards and the Dispensing Register by default', () => {
    renderPage();
    expect(screen.getAllByText('Scheduled Drugs Compliance Report').length).toBeGreaterThan(0);
    expect(screen.getByText('Total Dispensed (units)')).toBeInTheDocument();
    expect(screen.getByText('Total Received (units)')).toBeInTheDocument();
    expect(screen.getByText('Invoice / Doc #')).toBeInTheDocument();
    expect(screen.getByText('INV-300')).toBeInTheDocument();
    expect(screen.getAllByText('Dr. Rao')).toHaveLength(2);
    expect(screen.getByText('In / Out')).toBeInTheDocument();
    // Qty cell is numeric-only; direction lives in its own column.
    expect(screen.getByText('OUT').closest('tr')).toHaveTextContent('10');
    expect(screen.getByText('Sales Return (Scrapped)')).toBeInTheDocument();
    expect(screen.getByText('IN').closest('tr')).toHaveTextContent('2');
    expect(screen.queryByText('10 OUT')).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('does not show the completeness warning when every moved product is attributed', () => {
    renderPage();
    expect(screen.queryByText(/no schedule attributed/)).not.toBeInTheDocument();
  });

  it('shows a warning when products with movement have no schedule attributed', () => {
    mockData({ ...FIXTURE, summary: { ...FIXTURE.summary, unattributed_product_count: 3 } });
    renderPage();
    expect(screen.getByText(/3 product\(s\) with stock movement .* no schedule attributed/)).toBeInTheDocument();
  });

  it('switches to the Receipts and Balances tabs', () => {
    renderPage();
    fireEvent.click(screen.getByText('Receipts'));
    expect(screen.getByText('Supplier')).toBeInTheDocument();
    expect(screen.getByText('Medico Distributors')).toBeInTheDocument();
    expect(screen.getByText('IN').closest('tr')).toHaveTextContent('100');
    expect(screen.queryByText('INV-300')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Balances'));
    expect(screen.getByText('Opening')).toBeInTheDocument();
    expect(screen.getByText('Closing')).toBeInTheDocument();
    expect(screen.getByText('ALP-05')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
  });

  it('excludes NONE from the schedule filter options', () => {
    renderPage();
    expect(screen.queryByText('No Schedule')).not.toBeInTheDocument();
  });
});
