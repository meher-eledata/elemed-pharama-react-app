global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import SupplierReportDetail from '../SupplierReportDetail';
import * as supplierReportsApi from '../../../redux/slices/supplierReportsApi';

const theme = createTheme();

// react-router: stub navigate, and supply the :supplierId route param the page
// reads via useParams().
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ supplierId: '1' }),
}));

// RTK Query hook is the only data source — mock the slice module wholesale and
// override the hook per test.
jest.mock('../../../redux/slices/supplierReportsApi', () => {
  const actual = jest.requireActual('../../../redux/slices/supplierReportsApi');
  return {
    __esModule: true,
    ...actual,
    useGetSupplierDetailQuery: jest.fn(),
  };
});

// html2pdf is browser-only and throws in jsdom; mock defensively (only invoked
// on the Download PDF action, which this smoke test does not trigger).
jest.mock('html2pdf.js', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    set: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    save: jest.fn().mockResolvedValue(undefined),
  })),
}));

// react-csv: browser-only download anchors (two of them) — stub with refs.
jest.mock('react-csv', () => ({
  CSVLink: React.forwardRef((props: any, ref) => {
    React.useImperativeHandle(ref, () => ({ link: { click: jest.fn() } }));
    return <div data-testid="mock-csv-link">{props.children}</div>;
  }),
}));

// DateRangeFilter pulls in @mui/x-date-pickers; stub for a deterministic mount.
jest.mock('../../../components/mainDashboard/DateRangeFilter/DateRangeFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-date-range-filter" />,
}));

const createStore = () =>
  configureStore({
    reducer: {
      [supplierReportsApi.supplierReportsApi.reducerPath]:
        supplierReportsApi.supplierReportsApi.reducer,
    },
    middleware: (gDM) => gDM().concat(supplierReportsApi.supplierReportsApi.middleware),
  });

const renderPage = () =>
  render(
    <Provider store={createStore()}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <SupplierReportDetail />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );

// All money fields arrive as STRINGS (numeric-string caveat); credit_balance and
// the spend block are the load-bearing ones for this page.
const mockDetail = {
  supplier: {
    supplier_id: 1,
    supplier_name: 'Acme Pharma',
    supplier_code: 'ACM-001',
    contact_name: 'Jane Doe',
    email_id: 'jane@acme.test',
    phone_number: '555-0100',
    address: '1 Industrial Way',
    city: 'Metropolis',
    state: 'NY',
    pin: '10001',
    country: 'USA',
    gst_number: 'GST123',
    cst_number: 'CST456',
  },
  spend_payments: {
    total_spend: '1234.50',
    total_paid: '1000.00',
    total_outstanding: '234.50',
    overdue_amount: '0.00',
    credit_balance: '50.25',
  },
  delivery: {
    avg_lead_time_days: '2.50',
    min_lead_time_days: 1,
    max_lead_time_days: 5,
    pending_po_count: 2,
    overdue_po_count: 1,
  },
  tax: {
    cgst: '450.00',
    sgst: '450.00',
    igst: '0.00',
    total_tax: '900.00',
  },
  product_sourcing: [
    {
      product_id: 11,
      product_name: 'Amoxicillin 500mg',
      total_qty: '120.00',
      total_value: '6000.00',
    },
  ],
  po_history: [
    {
      po_id: 501,
      po_number: 'PO-501',
      ordered_date: '2026-06-10',
      status: 'RECEIVED',
      total_amount: '6000.00',
      amount_paid: '6000.00',
      amount_due: '0.00',
      payment_status: 'PAID',
      lead_time_days: 2,
    },
  ],
};

const mockHook = supplierReportsApi.useGetSupplierDetailQuery as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SupplierReportDetail', () => {
  it('renders the supplier name and section labels without crashing', () => {
    mockHook.mockReturnValue({ data: mockDetail, isLoading: false, isError: false });

    renderPage();

    expect(screen.getByText('Acme Pharma')).toBeInTheDocument();
    expect(screen.getByText('Spend & Payments')).toBeInTheDocument();
    expect(screen.getByText('Delivery Performance')).toBeInTheDocument();
    expect(screen.getByText('GST / Tax Summary')).toBeInTheDocument();
    expect(screen.getByText('Back to Supplier Reports')).toBeInTheDocument();
  });

  it('renders the product and PO history rows from the mocked response', () => {
    mockHook.mockReturnValue({ data: mockDetail, isLoading: false, isError: false });

    renderPage();

    expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();
    expect(screen.getByText('PO-501')).toBeInTheDocument();
  });

  it('NUMERIC-STRING CAVEAT: money strings are parsed/formatted, not NaN', () => {
    mockHook.mockReturnValue({ data: mockDetail, isLoading: false, isError: false });

    renderPage();

    // toNum("1234.50") -> 1234.5 -> formatCurrency -> "₹1,234.50" (en-IN).
    expect(screen.getByText('₹1,234.50')).toBeInTheDocument();
    // credit_balance "50.25" must also format, not appear as NaN.
    expect(screen.getByText('₹50.25')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('shows a spinner while the query is loading', () => {
    mockHook.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    const { container } = renderPage();

    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
    expect(screen.queryByText('Spend & Payments')).not.toBeInTheDocument();
  });

  it('shows the error state when the query errors', () => {
    mockHook.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    renderPage();

    expect(
      screen.getByText('Failed to load supplier report data. Please try again later.')
    ).toBeInTheDocument();
  });
});
