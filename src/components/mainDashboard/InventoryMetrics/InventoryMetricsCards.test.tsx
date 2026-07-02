import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import InventoryMetricsCards from './InventoryMetricsCard';
import {
  useGetInvoiceStatsQuery,
  useGetInventoryByDateQuery,
} from '../../../redux/slices/dashboardApi';
import { useGetNearExpiryStockQuery } from '../../../redux/slices/inventoryApi';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

// Mock the API hooks to control their return values
jest.mock('../../../redux/slices/dashboardApi');

// The component also calls useGetNearExpiryStockQuery (inventoryApi) and
// useNavigate (react-router-dom). Mock both so the component can render
// without a Provider/Router wrapper.
jest.mock('../../../redux/slices/inventoryApi', () => ({
  __esModule: true,
  useGetNearExpiryStockQuery: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
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


// Mock data to simulate API responses for different scenarios
const mockInventoryData = {
  belowMinProducts: [
    {
      product_id: '106',
      name: 'Omeprazole Capsule',
      batchNumber: 'OMP20',
      currentQuantity: 9,
      minQty: 25,
      maxQty: 300,
      expiryDate: '2025-11-12',
      activityDate: '2025-09-19T08:37:11Z',
    },
    {
      product_id: '109',
      name: 'Salbutamol Inhaler',
      batchNumber: 'SBT100',
      currentQuantity: 6,
      minQty: 15,
      maxQty: 200,
      expiryDate: '2025-08-20',
      activityDate: '2025-09-19T08:37:11Z',
    },
  ],
  expiredProducts: [
    {
      product_id: '109',
      name: 'Salbutamol Inhaler',
      batchNumber: 'SBT100',
      currentQuantity: 6,
      minQty: 15,
      maxQty: 200,
      expiryDate: '2025-08-20',
      activityDate: '2025-09-19T08:37:11Z',
    },
  ],
  aboveMaxProducts: [
    {
      product_id: '101',
      name: 'Paracetamol Tablet',
      batchNumber: 'PCM500',
      currentQuantity: 2000,
      minQty: 50,
      maxQty: 1000,
      expiryDate: '2025-12-31',
      activityDate: '2025-09-19T08:37:11Z',
    },
    {
      product_id: '102',
      name: 'Ibuprofen Capsule',
      batchNumber: 'IBU200',
      currentQuantity: 1500,
      minQty: 30,
      maxQty: 500,
      expiryDate: '2026-03-15',
      activityDate: '2025-09-19T08:37:11Z',
    },
  ],
};

const mockInvoiceData = {
  latestBatchReceivedOn: '2025-09-19T08:37:11Z',
  returns: 5,
  activeSalesDays: 10,
};

// New mock data for the date range filter test
const mockUpdatedInventoryData = {
  belowMinProducts: [
    { product_id: '110', name: 'New Low Stock Item', currentQuantity: 5 },
  ],
  expiredProducts: [],
  aboveMaxProducts: [],
};

const mockUpdatedInvoiceData = {
  latestBatchReceivedOn: '2025-08-15T12:00:00Z',
  returns: 2,
  activeSalesDays: 5,
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
    (useGetInventoryByDateQuery as jest.Mock).mockReturnValue({
      data: mockInventoryData,
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
  // Current behaviour: the three stock cards are Low Stock Items (from
  // belowMinProducts), Near Expiry Stock (from the inventoryApi near-expiry
  // hook) and Expired Stock (from expiredProducts). The "Excess Stock"
  // card was replaced by "Near Expiry Stock".
  it('renders the three inventory metric cards with correct data', async () => {
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

      const nearExpiryCard = screen.getByText('Near Expiry Stock').closest('.MuiPaper-root');
      expect(nearExpiryCard).not.toBeNull();
      expect(within(nearExpiryCard as HTMLElement).getByText('2')).toBeInTheDocument();

      const expiredStockCard = screen.getByText('Expired Stock').closest('.MuiPaper-root');
      expect(expiredStockCard).not.toBeNull();
      expect(within(expiredStockCard as HTMLElement).getByText('1')).toBeInTheDocument();
    });
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

    const cardTitles = ['Low Stock Items', 'Near Expiry Stock', 'Expired Stock'];
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
    (useGetInventoryByDateQuery as jest.Mock).mockReturnValue({
      data: {
        ...mockInventoryData,
        expiredProducts: [], // Simulate no expired products
      },
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
    (useGetInventoryByDateQuery as jest.Mock).mockReturnValue({
      data: null,
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
    (useGetInventoryByDateQuery as jest.Mock).mockReturnValue({
      data: null,
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
    (useGetInventoryByDateQuery as jest.Mock).mockReturnValue({
      data: {
        belowMinProducts: [],
        expiredProducts: [],
        aboveMaxProducts: [],
      },
      isLoading: false,
      error: null,
    });
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

      const nearExpiryCard = screen.getByText('Near Expiry Stock').closest('.MuiPaper-root');
      expect(within(nearExpiryCard as HTMLElement).getByText('0')).toBeInTheDocument();

      const expiredStockCard = screen.getByText('Expired Stock').closest('.MuiPaper-root');
      expect(within(expiredStockCard as HTMLElement).getByText('0')).toBeInTheDocument();
    });
  });

  // Test Case 10: Date range prop changes
  it('refetches data when date range changes', async () => {
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

    // Verify that the API hooks were called with the new date range (check last call)
    const invoiceStatsCalls = (useGetInvoiceStatsQuery as jest.Mock).mock.calls;
    const inventoryCalls = (useGetInventoryByDateQuery as jest.Mock).mock.calls;
    
    expect(invoiceStatsCalls[invoiceStatsCalls.length - 1][0]).toEqual({ startDate: '2024-02-01', endDate: '2024-02-28' });
    expect(inventoryCalls[inventoryCalls.length - 1][0]).toEqual({ startDate: '2024-02-01', endDate: '2024-02-28' });
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
    const largeInventoryData = {
      belowMinProducts: Array.from({ length: 100 }, (_, i) => ({
        product_id: `${i}`,
        name: `Product ${i}`,
        batchNumber: `BATCH${i}`,
        currentQuantity: Math.floor(Math.random() * 10),
        minQty: 25,
        maxQty: 300,
        expiryDate: '2025-11-12',
        activityDate: '2025-09-19T08:37:11Z',
      })),
      expiredProducts: [],
      aboveMaxProducts: [],
    };

    (useGetInventoryByDateQuery as jest.Mock).mockReturnValue({
      data: largeInventoryData,
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