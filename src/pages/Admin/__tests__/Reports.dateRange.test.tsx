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
      ReactLib.createElement('div', { 'data-testid': 'csv-link' }, props.children)
    ),
  };
});

// Render each date picker as its formatted value so we can assert the default.
jest.mock('../../../components/Common', () => {
  const actual = jest.requireActual('../../../components/Common');
  return {
    __esModule: true,
    ...actual,
    PharmaDatePicker: ({ value }: any) => (
      <div data-testid="date-picker">{value ? value.format('YYYY-MM-DD') : 'none'}</div>
    ),
  };
});

jest.mock('../../../redux/slices/reportsApi', () => {
  const actual = jest.requireActual('../../../redux/slices/reportsApi');
  return {
    __esModule: true,
    ...actual,
    useGetDailySalesReportQuery: jest.fn(),
    useGetWeeklyBillCountsQuery: jest.fn(),
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
  useGetWeeklyBillCountsQuery: jest.Mock;
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
  mockedReports.useGetWeeklyBillCountsQuery.mockReturnValue({ data: [] });
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

  it('defaults both the start and end date pickers to today', async () => {
    renderReports();
    await screen.findByText('Sales Report');

    const today = dayjs().format('YYYY-MM-DD');
    const pickers = screen.getAllByTestId('date-picker');
    expect(pickers).toHaveLength(2);
    pickers.forEach((p) => expect(p).toHaveTextContent(today));
  });
});
