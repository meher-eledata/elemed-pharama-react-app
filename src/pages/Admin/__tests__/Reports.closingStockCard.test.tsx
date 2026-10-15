// RTK Query serializability check clones state with structuredClone (absent in jsdom).
global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import Reports from '../Reports';
import { CLOSING_STOCK_REPORT_LABELS } from '../../../config/label/ClosingStockReport.labels';
import { ADMIN_REPORTS_CONSTANTS } from '../../../config/constants/AdminReports.constants';

const theme = createTheme();

// The Detailed tab's discovery grid needs none of the chart / KPI machinery; stub it
// so this suite exercises only the card list and its real router navigation.
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

const LocationProbe = () => {
  const { pathname } = useLocation();
  return <div data-testid="closing-stock-page">{pathname}</div>;
};

// Real router (no useNavigate mock): clicking the card must land on the registered
// /admin/reports/closing-stock path.
const renderDetailedReports = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[{ pathname: '/admin/reports', state: { activeTab: 'detailed' } }]}>
        <Routes>
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/reports/closing-stock" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

// The card is the MuiCard whose title is the Closing Stock discovery title.
const getClosingStockCard = () => {
  const title = screen.getByText(CLOSING_STOCK_REPORT_LABELS.DISCOVERY_CARD.TITLE);
  const card = title.closest('.MuiCard-root') as HTMLElement | null;
  if (!card) throw new Error('Closing Stock card not found');
  return card;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Reports — Closing Stock discovery card', () => {
  it('routes constant points at /admin/reports/closing-stock', () => {
    expect(ADMIN_REPORTS_CONSTANTS.ROUTES.CLOSING_STOCK).toBe('/admin/reports/closing-stock');
  });

  it('shows the Closing Stock card with its title, description and action on the Detailed tab', () => {
    renderDetailedReports();
    const card = getClosingStockCard();

    expect(within(card).getByText(CLOSING_STOCK_REPORT_LABELS.DISCOVERY_CARD.DESCRIPTION)).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: /view report/i })).toBeInTheDocument();
    // Exactly one card for this report (no accidental duplicate entry).
    expect(screen.getAllByText(CLOSING_STOCK_REPORT_LABELS.DISCOVERY_CARD.TITLE)).toHaveLength(1);
  });

  it('navigates to /admin/reports/closing-stock when the card is clicked', () => {
    renderDetailedReports();
    fireEvent.click(getClosingStockCard());

    expect(screen.getByTestId('closing-stock-page')).toHaveTextContent('/admin/reports/closing-stock');
  });

  it("navigates when the card's View Report button is clicked", () => {
    renderDetailedReports();
    fireEvent.click(within(getClosingStockCard()).getByRole('button', { name: /view report/i }));

    expect(screen.getByTestId('closing-stock-page')).toHaveTextContent('/admin/reports/closing-stock');
  });
});
