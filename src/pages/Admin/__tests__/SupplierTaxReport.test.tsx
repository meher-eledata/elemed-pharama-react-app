global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import SupplierTaxReport from '../SupplierTaxReport';
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
// The CSV export is a SEPARATE code path from the table columns, so the mock captures
// the rows handed to CSVLink and the tests assert on them directly.
const mockCsvRows: Record<string, string>[] = [];
jest.mock('react-csv', () => ({
  __esModule: true,
  CSVLink: ({ data }: { data: Record<string, string>[] }) => {
    mockCsvRows.length = 0;
    mockCsvRows.push(...data);
    return <div data-testid="csv-link" />;
  },
}));

jest.mock('../../../redux/slices/reportsApi', () => {
  const actual = jest.requireActual('../../../redux/slices/reportsApi');
  return { __esModule: true, ...actual, useGetSupplierTaxReportQuery: jest.fn() };
});
jest.mock('../../../redux/slices/masterApi', () => {
  const actual = jest.requireActual('../../../redux/slices/masterApi');
  return { __esModule: true, ...actual, useGetSuppliersQuery: jest.fn() };
});

const mockedReports = reportsApi as unknown as { useGetSupplierTaxReportQuery: jest.Mock };
const mockedMaster = masterApi as unknown as { useGetSuppliersQuery: jest.Mock };

// level='receipt' fixture — money fields as STRINGS (pg numeric serialization).
// receipt_total drives a ₹-formatted cell.
const RECEIPT_FIXTURE: reportsApi.SupplierTaxReceiptResponse = {
  level: 'receipt',
  rows: [
    {
      receipt_id: 501,
      receipt_number: 'GRN-000501',
      receipt_date: '2026-06-10',
      invoice_number: 'SUP-INV-1',
      supplier_id: 1,
      supplier_name: 'Acme Pharma',
      supplier_gst: 'GST123',
      taxable_value: '5000.00',
      discount: '250.00',
      cgst: '300.00',
      sgst: '300.00',
      igst: '0.00',
      total_tax: '600.00',
      gst_rate: '12.00',
      receipt_total: '1234.50',
    },
  ],
  summary: {
    receipt_count: 1,
    supplier_count: 1,
    total_taxable: '5000.00',
    total_discount: '250.00',
    total_cgst: '300.00',
    total_sgst: '300.00',
    total_igst: '0.00',
    total_tax: '600.00',
    gst_rate: '12.00',
    total_with_tax: '5600.00',
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
          <SupplierTaxReport />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockedMaster.useGetSuppliersQuery.mockReturnValue({ data: [], isLoading: false, error: undefined });
  mockedReports.useGetSupplierTaxReportQuery.mockReturnValue({
    data: RECEIPT_FIXTURE,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
});

describe('SupplierTaxReport page', () => {
  it('renders the page title', () => {
    renderPage();
    expect(screen.getAllByText('Supplier Tax Report').length).toBeGreaterThan(0);
  });

  it('renders the Overview / Receipt-wise / Supplier-wise switcher', () => {
    renderPage();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Receipt-wise')).toBeInTheDocument();
    expect(screen.getByText('Supplier-wise')).toBeInTheDocument();
  });

  it('shows the aggregate cards on the default Overview tab, without the table', () => {
    renderPage();
    expect(screen.getByText('Total Taxable')).toBeInTheDocument();
    expect(screen.getByText('₹5,000.00')).toBeInTheDocument();
    // Table columns belong to the detailed tabs only.
    expect(screen.queryByText('Receipt Total')).not.toBeInTheDocument();
  });

  it('renders key tax table columns on the Receipt-wise tab, without the aggregate cards', () => {
    renderPage();
    fireEvent.click(screen.getByText('Receipt-wise'));
    expect(screen.getByText('Taxable Value')).toBeInTheDocument();
    expect(screen.getByText('Receipt Total')).toBeInTheDocument();
    expect(screen.getByText('Acme Pharma')).toBeInTheDocument();
    // Aggregates live on Overview only.
    expect(screen.queryByText('Total Taxable')).not.toBeInTheDocument();
  });

  it('formats the receipt total as ₹ and never renders NaN', () => {
    renderPage();
    fireEvent.click(screen.getByText('Receipt-wise'));
    // receipt_total "1234.50" -> ₹1,234.50
    expect(screen.getAllByText('₹1,234.50').length).toBeGreaterThan(0);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  // The "Receipt #" column used to render receipt_id (the internal PK). It must show the
  // server-generated GRN number, which is opaque and never rebuilt client-side.
  it('renders the generated receipt number in the Receipt # column, not the internal PK', () => {
    renderPage();
    fireEvent.click(screen.getByText('Receipt-wise'));
    expect(screen.getByText('GRN-000501')).toBeInTheDocument();
    expect(screen.queryByText('501')).not.toBeInTheDocument();
  });

  it('exports the generated receipt number in the CSV, not the internal PK', () => {
    renderPage();
    expect(mockCsvRows[0]['Receipt #']).toBe('GRN-000501');
  });

  it('renders a custom-template receipt number verbatim', () => {
    mockedReports.useGetSupplierTaxReportQuery.mockReturnValue({
      data: {
        ...RECEIPT_FIXTURE,
        rows: [{ ...RECEIPT_FIXTURE.rows[0], receipt_number: 'GRN/26-27/000042' }],
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    renderPage();
    fireEvent.click(screen.getByText('Receipt-wise'));
    expect(screen.getByText('GRN/26-27/000042')).toBeInTheDocument();
    expect(mockCsvRows[0]['Receipt #']).toBe('GRN/26-27/000042');
  });
});
