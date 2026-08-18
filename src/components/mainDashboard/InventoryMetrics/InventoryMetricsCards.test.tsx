import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import InventoryMetricsCards from './InventoryMetricsCard';
import { useGetInvoiceStatsQuery } from '../../../redux/slices/dashboardApi';
import {
  useGetLowStockQuery,
  useGetExcessStockQuery,
  useGetExpiredStockQuery,
  useGetNearExpiryStockQuery,
} from '../../../redux/slices/inventoryApi';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

// Mock the API hooks to control their return values
jest.mock('../../../redux/slices/dashboardApi');

// The stock cards now consume the SAME inventoryApi queries the inventory page
// uses (low/excess/expired/near-expiry) — register EVERY hook the component
// calls (auto-mocked-slice gotcha) so it renders without a Provider/Router.
jest.mock('../../../redux/slices/inventoryApi', () => ({
  __esModule: true,
  useGetLowStockQuery: jest.fn(() => ({ data: [], isLoading: false, error: null })),
  useGetExcessStockQuery: jest.fn(() => ({ data: [], isLoading: false, error: null })),
  useGetExpiredStockQuery: jest.fn(() => ({ data: [], isLoading: false, error: null })),
  useGetNearExpiryStockQuery: jest.fn(() => ({ data: [], isLoading: false, error: null })),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
}));

// Mock the individual chart components. This is the correct approach since
// you are asserting their presence with data-testid. The SimpleAreaCharts.tsx
// mock was likely a mistake or an unused component.
jest.mock('../Charts/BarChart', () => ({
  __esModule: true,
  default: ({ data }: { data: any }) => <div data-testid="bar-chart">{JSON.stringify(data)}</div>,
}));

jest.mock('../Charts/LineChart', () => ({
  __esModule: true,
  default: ({ data }: { data: any }) => <div data-testid="line-chart">{JSON.stringify(data)}</div>,
}));

jest.mock('../Charts/PieChart', () => ({
  __esModule: true,
  default: ({ data }: { data: any }) => <div data-testid="pie-chart">{JSON.stringify(data)}</div>,
}));


// Mock data — the stock lists come from the inventoryApi (live inventory_balance
// + per-batch expiry), the SAME source the /inventory page counts.
const mockLowStockData = [
  { id: '106', name: 'Omeprazole Capsule', currentQuantity: 9, minQuantity: 25 },
  { id: '109', name: 'Salbutamol Inhaler', currentQuantity: 6, minQuantity: 15 },
];

const mockExcessStockData = [
  { id: '101', name: 'Paracetamol Tablet', currentQuantity: 2000, maxQuantity: 1000 },
  { id: '102', name: 'Ibuprofen Capsule', currentQuantity: 1500, maxQuantity: 500 },
];

const mockExpiredStockData = [
  {
    id: '109',
    name: 'Salbutamol Inhaler',
    currentQuantity: 6,
    batchNumber: 'SBT100',
    expiryDate: '2025-08-20',
    daysPastExpiry: 30,
  },
];

const mockInvoiceData = {
  latestBatchReceivedOn: '2025-09-19T08:37:11Z',
  returns: 5,
  activeSalesDays: 10,
};

// Near Expiry data comes from a separate hook (inventoryApi).
const mockNearExpiryData = [
  {
    name: 'Aspirin Tablet',
    currentQuantity: 40,
    expiryDate: '2025-07-01',
    daysToExpiry: 15,
  },
  {
    name: 'Cetirizine Tablet',
    currentQuantity: 25,
    expiryDate: '2025-07-10',
    daysToExpiry: 24,
  },
];

describe('InventoryMetricsCards', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (useGetInvoiceStatsQuery as jest.Mock).mockReturnValue({
      data: mockInvoiceData,
      isLoading: false,
      error: null,
    });
    (useGetLowStockQuery as jest.Mock).mockReturnValue({
      data: mockLowStockData,
      isLoading: false,
      error: null,
    });
    (useGetExcessStockQuery as jest.Mock).mockReturnValue({
      data: mockExcessStockData,
      isLoading: false,
      error: null,
    });
    (useGetExpiredStockQuery as jest.Mock).mockReturnValue({
      data: mockExpiredStockData,
      isLoading: false,
      error: null,
    });
    (useGetNearExpiryStockQuery as jest.Mock).mockReturnValue({
      data: mockNearExpiryData,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    // Clean up mocks
    jest.clearAllMocks();
  });

  // Test Case 1: Renders initial summary cards
  // Current behaviour: the four stock cards (Low / Excess / Near Expiry / Expired)
  // all come from the inventoryApi queries — the SAME hooks the inventory page
  // counts — so the dashboard numbers match /inventory by construction.
  it('renders the four inventory metric cards with the inventory-endpoint numbers', async () => {
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    await waitFor(() => {
      // Use 'within' to scope the search to a specific card to avoid ambiguity
      const lowStockCard = screen.getByText('Low Stock Items').closest('.MuiPaper-root');
      expect(lowStockCard).not.toBeNull();
      expect(within(lowStockCard as HTMLElement).getByText('2')).toBeInTheDocument();

      const excessStockCard = screen.getByText('Excess Stock').closest('.MuiPaper-root');
      expect(excessStockCard).not.toBeNull();
      expect(within(excessStockCard as HTMLElement).getByText('2')).toBeInTheDocument();

      const nearExpiryCard = screen.getByText('Near Expiry Stock').closest('.MuiPaper-root');
      expect(nearExpiryCard).not.toBeNull();
      expect(within(nearExpiryCard as HTMLElement).getByText('2')).toBeInTheDocument();

      const expiredStockCard = screen.getByText('Expired Stock').closest('.MuiPaper-root');
      expect(expiredStockCard).not.toBeNull();
      expect(within(expiredStockCard as HTMLElement).getByText('1')).toBeInTheDocument();
    });
  });

  it('navigates to the inventory excess tab when Excess Stock "View Items" is clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    const excessStockCard = screen.getByText('Excess Stock').closest('.MuiPaper-root');
    expect(excessStockCard).not.toBeNull();
    const viewItemsButton = within(excessStockCard as HTMLElement).getByRole('button', { name: 'View Items' });
    fireEvent.click(viewItemsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/inventory', { state: { tab: 'excess' } });
  });

  // Test Case 2: Low Stock "View Items" navigates to the inventory page.
  // Current behaviour: clicking "View Items" no longer opens a modal; it
  // navigates to /inventory with the relevant tab in router state.
  it('navigates to the inventory low-stock tab when Low Stock "View Items" is clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    const lowStockCard = screen.getByText('Low Stock Items').closest('.MuiPaper-root');
    expect(lowStockCard).not.toBeNull();
    const viewItemsButton = within(lowStockCard as HTMLElement).getByRole('button', { name: 'View Items' });
    fireEvent.click(viewItemsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/inventory', { state: { tab: 'low' } });
  });

  // The card counts the SAME window it links to. `withinThreeMonths` (0..90 days)
  // is a superset of `withinOneMonth`, it is what the notification bell counts,
  // and it is what the inventory near-expiry tab defaults to — querying months: 1
  // made the card read 0 while the bell read 3 and then dropped the user on a tab
  // listing rows the card had not counted.
  it('counts the full near-expiry window the "View Items" link lands on', () => {
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    expect(useGetNearExpiryStockQuery).toHaveBeenCalledWith({ months: 3 });
  });

  // Test Case 3: Near Expiry "View Items" navigates to the inventory page.
  it('navigates to the inventory near-expiry tab when Near Expiry "View Items" is clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    const nearExpiryCard = screen.getByText('Near Expiry Stock').closest('.MuiPaper-root');
    expect(nearExpiryCard).not.toBeNull();
    const viewItemsButton = within(nearExpiryCard as HTMLElement).getByRole('button', { name: 'View Items' });
    fireEvent.click(viewItemsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/inventory', { state: { tab: 'nearExpiry' } });
  });

  // Test Case 4: Expired Stock "View Items" navigates to the inventory page.
  it('navigates to the inventory expired tab when Expired Stock "View Items" is clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    const expiredStockCard = screen.getByText('Expired Stock').closest('.MuiPaper-root');
    expect(expiredStockCard).not.toBeNull();
    const viewItemsButton = within(expiredStockCard as HTMLElement).getByRole('button', { name: 'View Items' });
    fireEvent.click(viewItemsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/inventory', { state: { tab: 'expired' } });
  });

  // Test Case 5: Each stock card exposes a distinct "View Items" action.
  // Current behaviour: the three stock cards each render an enabled
  // "View Items" link that triggers navigation.
  it('renders an enabled "View Items" action on each stock card', () => {
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    const cardTitles = ['Low Stock Items', 'Excess Stock', 'Near Expiry Stock', 'Expired Stock'];
    cardTitles.forEach((title) => {
      const card = screen.getByText(title).closest('.MuiPaper-root');
      expect(card).not.toBeNull();
      const viewItemsButton = within(card as HTMLElement).getByRole('button', { name: 'View Items' });
      expect(viewItemsButton).toHaveStyle('pointer-events: auto');
    });
  });

  // Test Case 6: Expired Stock count renders 0 when there are no expired products.
  // Current behaviour: the "View Items" action is always enabled (the
  // component does not pass a `disabled` prop), so we only assert the count.
  it('renders a count of 0 for the Expired Stock card when there are no expired products', () => {
    // Override the mock data for this specific test case
    (useGetExpiredStockQuery as jest.Mock).mockReturnValue({
      data: [], // Simulate no expired batches
      isLoading: false,
      error: null,
    });

    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    // Find the card and verify that the count element shows 0
    const expiredStockCard = screen.getByText('Expired Stock').closest('.MuiPaper-root');
    expect(expiredStockCard).not.toBeNull();
    // Zero value is rendered by the component
    expect(within(expiredStockCard as HTMLElement).getByText('0')).toBeInTheDocument();
  });

  // -- NEW TEST CASES FOR THE REMAINING CARDS --

  it('renders the Latest Batch Received card with correct data', async () => {
    // Render the component
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    // Wait for the data to be loaded and rendered
    await waitFor(() => {
      // Find the card by its title and check its content
      const latestBatchCard = screen.getByText('Latest Batch Received').closest('.MuiPaper-root');
      expect(latestBatchCard).not.toBeNull();
      // Current behaviour: date is formatted via toLocaleDateString('en-GB') → 19/09/2025
      expect(within(latestBatchCard as HTMLElement).getByText('19/09/2025')).toBeInTheDocument();
    });
  });

  // Current behaviour: the returns card is titled "Total Returns" and shows
  // the raw returns count (no percent sign).
  it('renders the Total Returns card with correct data', async () => {
    // Render the component
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    // Wait for the data to be loaded
    await waitFor(() => {
      // Find the card by its title and check its content
      const returnsCard = screen.getByText('Total Returns').closest('.MuiPaper-root');
      expect(returnsCard).not.toBeNull();
      expect(within(returnsCard as HTMLElement).getByText('5')).toBeInTheDocument();
    });
  });

  it('renders the Days With Active Sales (MTD) card with correct data', async () => {
    // Render the component
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    // Wait for the data to be loaded
    await waitFor(() => {
      // Find the card by its title and check its content
      const activeSalesCard = screen.getByText('Days With Active Sales (MTD)').closest('.MuiPaper-root');
      expect(activeSalesCard).not.toBeNull();
      expect(within(activeSalesCard as HTMLElement).getByText('10 Days')).toBeInTheDocument();
    });
  });

  // Test Case 7: Loading state
  it('renders loading skeletons when data is loading', () => {
    (useGetInvoiceStatsQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
    (useGetLowStockQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    // Check for skeleton loading elements
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  // Test Case 8: Error state
  // Current behaviour: when either query errors, the component renders the
  // error message. It does not log to console.error.
  it('renders error message when API calls fail', () => {
    (useGetInvoiceStatsQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('API Error'),
    });
    (useGetLowStockQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API Error'),
    });

    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    expect(screen.getByText(/Failed to load dashboard data/i)).toBeInTheDocument();
  });

  // Test Case 9: Empty data handling
  it('handles empty data gracefully', async () => {
    (useGetInvoiceStatsQuery as jest.Mock).mockReturnValue({
      data: {
        latestBatchReceivedOn: null,
        returns: 0,
        activeSalesDays: 0,
      },
      isLoading: false,
      error: null,
    });
    (useGetLowStockQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: null });
    (useGetExcessStockQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: null });
    (useGetExpiredStockQuery as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: null });
    (useGetNearExpiryStockQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    await waitFor(() => {
      // Check that all stock cards show 0 (zero values are rendered by the component)
      const lowStockCard = screen.getByText('Low Stock Items').closest('.MuiPaper-root');
      expect(within(lowStockCard as HTMLElement).getByText('0')).toBeInTheDocument();

      const excessStockCard = screen.getByText('Excess Stock').closest('.MuiPaper-root');
      expect(within(excessStockCard as HTMLElement).getByText('0')).toBeInTheDocument();

      const nearExpiryCard = screen.getByText('Near Expiry Stock').closest('.MuiPaper-root');
      expect(within(nearExpiryCard as HTMLElement).getByText('0')).toBeInTheDocument();

      const expiredStockCard = screen.getByText('Expired Stock').closest('.MuiPaper-root');
      expect(within(expiredStockCard as HTMLElement).getByText('0')).toBeInTheDocument();
    });
  });

  // Test Case 10: Date range prop changes
  // Current behaviour: only the invoice stats react to the date picker. The stock
  // cards consume LIVE inventory-state queries which are date-INDEPENDENT by
  // design — they must NOT receive the date range.
  it('passes the new date range to invoice stats only; stock queries stay date-independent', async () => {
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: '2024-01-01', endDate: '2024-01-31' }} />
      </ThemeProvider>
    );

    // Change the date range
    rerender(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: '2024-02-01', endDate: '2024-02-28' }} />
      </ThemeProvider>
    );

    // Verify that the invoice-stats hook received the new date range (check last call)
    const invoiceStatsCalls = (useGetInvoiceStatsQuery as jest.Mock).mock.calls;
    expect(invoiceStatsCalls[invoiceStatsCalls.length - 1][0]).toEqual({ startDate: '2024-02-01', endDate: '2024-02-28' });

    // The stock queries take no date arguments (live state, no range).
    const lowCalls = (useGetLowStockQuery as jest.Mock).mock.calls;
    expect(lowCalls[lowCalls.length - 1][0]).toBeUndefined();
  });

  // Test Cases 11 & 12 removed: the component no longer opens an in-page modal
  // (with a closable dialog / sortable table) from the stock cards. Clicking
  // "View Items" now navigates to the /inventory route instead. Navigation is
  // covered by Test Cases 2-4 above.

  // Test Case 13: Accessibility
  it('has proper accessibility attributes', async () => {
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    await waitFor(() => {
      // Check that cards have proper accessibility
      const lowStockCard = screen.getByText('Low Stock Items').closest('.MuiPaper-root');
      expect(lowStockCard).toBeInTheDocument();

      // Check that buttons have proper roles
      const viewItemsButton = within(lowStockCard as HTMLElement).getByRole('button', { name: 'View Items' });
      expect(viewItemsButton).toBeInTheDocument();
    });
  });

  // Test Case 14: Performance with large datasets
  it('handles large datasets efficiently', async () => {
    const largeLowStockData = Array.from({ length: 100 }, (_, i) => ({
      id: `${i}`,
      name: `Product ${i}`,
      currentQuantity: Math.floor(Math.random() * 10),
      minQuantity: 25,
    }));

    (useGetLowStockQuery as jest.Mock).mockReturnValue({
      data: largeLowStockData,
      isLoading: false,
      error: null,
    });

    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    await waitFor(() => {
      const lowStockCard = screen.getByText('Low Stock Items').closest('.MuiPaper-root');
      expect(within(lowStockCard as HTMLElement).getByText('100')).toBeInTheDocument();
    });

    // The "View Items" action remains clickable with a large dataset and
    // triggers navigation (no in-page modal is rendered).
    const lowStockCard = screen.getByText('Low Stock Items').closest('.MuiPaper-root');
    const viewItemsButton = within(lowStockCard as HTMLElement).getByRole('button', { name: 'View Items' });
    fireEvent.click(viewItemsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/inventory', { state: { tab: 'low' } });
  });
});