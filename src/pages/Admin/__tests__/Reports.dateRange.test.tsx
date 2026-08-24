// RTK Query serializability check clones state with structuredClone (absent in jsdom).
global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import dayjs from 'dayjs';
import Reports from '../Reports';
import { REPORTS_LABELS } from '../../../config/label/Reports.labels';
import * as reportsApi from '../../../redux/slices/reportsApi';

const theme = createTheme();

// --- Keep the render lean: stub every heavy/irrelevant dependency so we exercise
//     only the Sales Report header (title + the two date pickers). ------------
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Charts pull in canvas/measurement machinery we don't need here.
jest.mock('@mui/x-charts/BarChart', () => ({
  __esModule: true,
  BarChart: () => <div data-testid="bar-chart" />,
}));
jest.mock('../../../components/Charts/PaymentTypePieChart', () => ({
  __esModule: true,
  default: () => <div data-testid="pie-chart" />,
}));
jest.mock('../../DashboardMain/DashboardMain', () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard-main" />,
}));
jest.mock('react-csv', () => {
  const ReactLib = require('react');
  return {
    __esModule: true,
    CSVLink: ReactLib.forwardRef((props: any, _ref: any) =>
      ReactLib.createElement(
        'div',
        { 'data-testid': 'csv-link', 'data-csv': JSON.stringify(props.data) },
        props.children
      )
    ),
  };
});

// Render the shared date-range filter as its formatted values so we can assert the default.
jest.mock('../../../components/mainDashboard/DateRangeFilter/DateRangeFilter', () => ({
  __esModule: true,
  default: ({ dateRange }: any) => (
    <div data-testid="date-range-filter">
      {dateRange.map((d: any) => (d ? d.format('YYYY-MM-DD') : 'none')).join('_')}
    </div>
  ),
}));

jest.mock('../../../redux/slices/reportsApi', () => {
  const actual = jest.requireActual('../../../redux/slices/reportsApi');
  return {
    __esModule: true,
    ...actual,
    useGetDailySalesReportQuery: jest.fn(),
    useGetDailySalesTableQuery: jest.fn(),
  };
});
jest.mock('../../../redux/slices/activityApi', () => {
  const actual = jest.requireActual('../../../redux/slices/activityApi');
  return {
    __esModule: true,
    ...actual,
    useLogDownloadMutation: jest.fn(() => [jest.fn(() => Promise.resolve())]),
  };
});

const mockedReports = reportsApi as unknown as {
  useGetDailySalesReportQuery: jest.Mock;
  useGetDailySalesTableQuery: jest.Mock;
};

const createStore = () =>
  configureStore({
    reducer: {
      auth: (state = { token: 'JWT123', user: null }) => state,
      [reportsApi.reportsApi.reducerPath]: reportsApi.reportsApi.reducer,
    },
    middleware: (gDM) => gDM().concat(reportsApi.reportsApi.middleware),
  });

// Deep-link straight into the Detailed tab's Daily Sales report via router state.
const renderReports = () =>
  render(
    <Provider store={createStore()}>
      <ThemeProvider theme={theme}>
        <MemoryRouter
          initialEntries={[
            { pathname: '/reports', state: { activeTab: 'detailed', selectedReport: 'daily-sales' } },
          ]}
        >
          <Reports />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  // Minimal successful payload: reportData only needs payment_method_breakdown to be
  // an array; every numeric field is COALESCEd to 0 by the component.
  mockedReports.useGetDailySalesReportQuery.mockReturnValue({
    data: { payment_method_breakdown: [] },
    isLoading: false,
    isError: false,
  });
  mockedReports.useGetDailySalesTableQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
});

describe('Reports — Sales Report header (rename + date-range defaults)', () => {
  it('shows the renamed "Sales Report" title, not the old "Daily Sales Report"', async () => {
    renderReports();
    expect(await screen.findByText('Sales Report')).toBeInTheDocument();
    expect(screen.queryByText('Daily Sales Report')).not.toBeInTheDocument();
  });

  it('guards the title label constant at the source', () => {
    expect(REPORTS_LABELS.DAILY_SALES_REPORT.TITLE).toBe('Sales Report');
  });

  it('defaults the shared date-range filter to the last 30 days', async () => {
    renderReports();
    await screen.findByText('Sales Report');

    const end = dayjs().format('YYYY-MM-DD');
    const start = dayjs().subtract(29, 'day').format('YYYY-MM-DD');
    expect(screen.getByTestId('date-range-filter')).toHaveTextContent(`${start}_${end}`);
  });

  it('renders the Overview / Invoice-wise switcher without the landing tab pair', async () => {
    renderReports();
    await screen.findByText('Sales Report');

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Invoice-wise')).toBeInTheDocument();
    // A report is open — the KPI's / Detailed Reports landing tabs must be hidden.
    expect(screen.queryByText("KPI's")).not.toBeInTheDocument();
    expect(screen.queryByText('Detailed Reports')).not.toBeInTheDocument();
    // The old bottom link is gone.
    expect(screen.queryByText('View Detailed Sales Table')).not.toBeInTheDocument();
  });

  it('keeps the Overview summary CSV export: enabled header button + summary rows', async () => {
    renderReports();
    await screen.findByText('Sales Report');

    // Overview is the default tab and its summary export stays available.
    expect(screen.getByRole('button', { name: 'Download CSV' })).toBeEnabled();
    const csvRows = JSON.parse(
      screen.getByTestId('csv-link').getAttribute('data-csv') || '[]'
    );
    expect(csvRows.some((r: any) => r.Section === 'Summary' && r.Metric === 'Total Bills')).toBe(true);
    expect(csvRows.some((r: any) => r.Section === 'Tax Summary' && r.Metric === 'CGST (₹)')).toBe(true);
  });
});
