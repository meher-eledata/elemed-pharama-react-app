global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import SupplierReports from '../SupplierReports';
import * as supplierReportsApi from '../../../redux/slices/supplierReportsApi';

const theme = createTheme();

// react-router: stub navigate (the supplier-name links call useNavigate).
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// RTK Query hook is the only data source — mock the slice module wholesale, as
// SaleHistory.test.tsx does, then override the hook per test.
jest.mock('../../../redux/slices/supplierReportsApi', () => {
  const actual = jest.requireActual('../../../redux/slices/supplierReportsApi');
  return {
    __esModule: true,
    ...actual,
    useGetSupplierOverviewQuery: jest.fn(),
  };
});

// react-csv: browser-only download anchor — stub with a ref-exposing element.
jest.mock('react-csv', () => ({
  CSVLink: React.forwardRef((props: any, ref) => {
    React.useImperativeHandle(ref, () => ({ link: { click: jest.fn() } }));
    return <div data-testid="mock-csv-link">{props.children}</div>;
  }),
}));

// DateRangeFilter pulls in @mui/x-date-pickers; render a lightweight stub so the
// page mounts deterministically. The query args / skip logic are driven by the
// hook mock below, so the real picker is not needed for a smoke test.
jest.mock('../../../components/mainDashboard/DateRangeFilter/DateRangeFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-date-range-filter" />,
}));

// A store is required by <Provider>; this page reads no slice state directly,
// but RTK Query's middleware/reducers must be present for a valid store.
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
          <SupplierReports />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );

// Money/value fields arrive from pg as STRINGS (e.g. "125000.50") — see the
// api-contract numeric-string caveat. The page must Number()/format them, never
// render NaN.
const mockOverview = {
  kpis: {
    total_spend: '125000.50',
    total_outstanding: '4200.00',
    po_count: 42,
    active_supplier_count: 7,
    avg_lead_time_days: '3.25',
  },
  suppliers: [
    {
      supplier_id: 1,
      supplier_name: 'Acme Pharma',
      spend: '90000.00',
      order_count: 30,
      amount_due: '1200.00',
      avg_lead_time_days: '2.50',
      last_order_date: '2026-06-10',
    },
  ],
  spend_trend: [
    { month: '2026-05', spend: '50000.00' },
    { month: '2026-06', spend: '75000.50' },
  ],
};

const mockHook = supplierReportsApi.useGetSupplierOverviewQuery as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SupplierReports (overview)', () => {
  it('renders the page title and subtitle without crashing', () => {
    mockHook.mockReturnValue({ data: mockOverview, isLoading: false, isError: false });

    renderPage();

    expect(screen.getByText('Supplier Reports')).toBeInTheDocument();
    expect(
      screen.getByText(/Track supplier spend, outstanding payments/i)
    ).toBeInTheDocument();
  });

  it('renders KPI labels and the supplier row from a basic mocked response', () => {
    mockHook.mockReturnValue({ data: mockOverview, isLoading: false, isError: false });

    renderPage();

    expect(screen.getByText('Total Spend')).toBeInTheDocument();
    expect(screen.getByText('Total Outstanding')).toBeInTheDocument();
    expect(screen.getByText('Purchase Orders')).toBeInTheDocument();
    expect(screen.getByText('Active Suppliers')).toBeInTheDocument();
    // Integer count rendered verbatim.
    expect(screen.getByText('42')).toBeInTheDocument();
    // Supplier name appears in the ranked table.
    expect(screen.getByText('Acme Pharma')).toBeInTheDocument();
  });

  it('NUMERIC-STRING CAVEAT: a money string "125000.50" is parsed/formatted, not NaN', () => {
    mockHook.mockReturnValue({ data: mockOverview, isLoading: false, isError: false });

    renderPage();

    // toNum("125000.50") -> 125000.5 -> formatCurrency -> "₹1,25,000.50" (en-IN).
    expect(screen.getByText('₹1,25,000.50')).toBeInTheDocument();
    // Nothing should have fallen through to NaN.
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('shows a spinner while the query is loading', () => {
    mockHook.mockReturnValue({ data: undefined, isLoading: true, isError: false });

    const { container } = renderPage();

    // MUI CircularProgress renders a progressbar role; no crash, no KPI cards.
    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
    expect(screen.queryByText('Total Spend')).not.toBeInTheDocument();
  });

  it('shows the error state when the query errors', () => {
    mockHook.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    renderPage();

    expect(
      screen.getByText('Failed to load supplier report data. Please try again later.')
    ).toBeInTheDocument();
  });
});
