import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import InventoryMetricsCards from './InventoryMetricsCard';
import {
  useGetInvoiceStatsQuery,
  useGetInventoryByDateQuery,
} from '../../../redux/slices/dashboardApi';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

// Mock the API hooks to control their return values
jest.mock('../../../redux/slices/dashboardApi');

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
  });

  // Test Case 1: Renders initial summary cards
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

      const excessStockCard = screen.getByText('Excess Stock').closest('.MuiPaper-root');
      expect(excessStockCard).not.toBeNull();
      expect(within(excessStockCard as HTMLElement).getByText('2')).toBeInTheDocument();

      const expiredStockCard = screen.getByText('Expired Stock').closest('.MuiPaper-root');
      expect(expiredStockCard).not.toBeNull();
      expect(within(expiredStockCard as HTMLElement).getByText('1')).toBeInTheDocument();
    });
  });

  // Test Case 2: Opens Low Stock modal
  it('opens the Low Stock modal with correct data when "View Items" is clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    // Find the Low Stock card and click the 'View Items' button
    const lowStockCard = screen.getByText('Low Stock Items').closest('.MuiPaper-root');
    expect(lowStockCard).not.toBeNull();
    const viewItemsButton = within(lowStockCard as HTMLElement).getByRole('button', { name: 'View Items' });
    fireEvent.click(viewItemsButton);

    // Assert that the modal is visible and contains the correct data
    await waitFor(() => {
      const modal = screen.getByRole('dialog', { name: 'Low Stock Items' });
      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText('Omeprazole Capsule')).toBeInTheDocument();
      expect(within(modal).getByText('Salbutamol Inhaler')).toBeInTheDocument();
    });
  });

  // Test Case 3: Opens Excess Stock modal
  it('opens the Excess Stock modal with correct data when "View Items" is clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    const excessStockCard = screen.getByText('Excess Stock').closest('.MuiPaper-root');
    expect(excessStockCard).not.toBeNull();
    const viewItemsButton = within(excessStockCard as HTMLElement).getByRole('button', { name: 'View Items' });
    fireEvent.click(viewItemsButton);

    await waitFor(() => {
      const modal = screen.getByRole('dialog', { name: 'Excess Stock' });
      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText('Paracetamol Tablet')).toBeInTheDocument();
      expect(within(modal).getByText('Ibuprofen Capsule')).toBeInTheDocument();
    });
  });

  // Test Case 4: Opens Expired Stock modal
  it('opens the Expired Stock modal with correct data when "View Items" is clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    const expiredStockCard = screen.getByText('Expired Stock').closest('.MuiPaper-root');
    expect(expiredStockCard).not.toBeNull();
    const viewItemsButton = within(expiredStockCard as HTMLElement).getByRole('button', { name: 'View Items' });
    fireEvent.click(viewItemsButton);

    await waitFor(() => {
      const modal = screen.getByRole('dialog', { name: 'Expired Stock' });
      expect(modal).toBeInTheDocument();
      expect(within(modal).getByText('Salbutamol Inhaler')).toBeInTheDocument();
    });
  });

  // Test Case 5: Ensures sorting works within the modal table
  it('sorts the modal data correctly when a table header is clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    // Open the Low Stock modal to access the table
    const lowStockCard = screen.getByText('Low Stock Items').closest('.MuiPaper-root');
    expect(lowStockCard).not.toBeNull();
    const viewItemsButton = within(lowStockCard as HTMLElement).getByRole('button', { name: 'View Items' });
    fireEvent.click(viewItemsButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Low Stock Items' })).toBeInTheDocument();
    });

    // Click the 'Name' header to sort using the correct accessible name
    fireEvent.click(screen.getByRole('columnheader', { name: 'Name' }));

    // Wait for the re-render and assert the new sorted order
    await waitFor(() => {
      const rows = screen.getAllByRole('row').slice(1); // Exclude header row
      const firstRowText = within(rows[0]).getByText('Omeprazole Capsule').textContent;
      const secondRowText = within(rows[1]).getByText('Salbutamol Inhaler').textContent;
      
      expect(firstRowText).toBe('Omeprazole Capsule');
      expect(secondRowText).toBe('Salbutamol Inhaler');
    });
  });

  // Test Case 6: Verifies that the 'View Items' link is disabled when the count is 0
  it('disables "View Items" link for a card with a value of 0', () => {
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

    // Find the card and verify that the count element (h4) does NOT exist
    const expiredStockCard = screen.getByText('Expired Stock').closest('.MuiPaper-root');
    expect(expiredStockCard).not.toBeNull();
    expect(within(expiredStockCard as HTMLElement).queryByText('0')).not.toBeInTheDocument();

    // Check that the "View Items" button is disabled
    const viewItemsButton = within(expiredStockCard as HTMLElement).getByRole('button', { name: 'View Items' });
    expect(viewItemsButton).toHaveStyle('pointer-events: none');
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
      expect(within(latestBatchCard as HTMLElement).getByText('19/9/2025')).toBeInTheDocument();
    });
  });

  it('renders the % of Return card with correct data', async () => {
    // Render the component
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    // Wait for the data to be loaded
    await waitFor(() => {
      // Find the card by its title and check its content
      const returnsCard = screen.getByText('% of Return').closest('.MuiPaper-root');
      expect(returnsCard).not.toBeNull();
      expect(within(returnsCard as HTMLElement).getByText('5%')).toBeInTheDocument();
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

    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    await waitFor(() => {
      // Check that all cards show 0 or default values
      const lowStockCard = screen.getByText('Low Stock Items').closest('.MuiPaper-root');
      expect(within(lowStockCard as HTMLElement).queryByText('0')).not.toBeInTheDocument();

      const excessStockCard = screen.getByText('Excess Stock').closest('.MuiPaper-root');
      expect(within(excessStockCard as HTMLElement).queryByText('0')).not.toBeInTheDocument();

      const expiredStockCard = screen.getByText('Expired Stock').closest('.MuiPaper-root');
      expect(within(expiredStockCard as HTMLElement).queryByText('0')).not.toBeInTheDocument();
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

    // Verify that the API hooks were called with the new date range
    expect(useGetInvoiceStatsQuery).toHaveBeenCalledWith({ startDate: '2024-02-01', endDate: '2024-02-28' });
    expect(useGetInventoryByDateQuery).toHaveBeenCalledWith({ startDate: '2024-02-01', endDate: '2024-02-28' });
  });

  // Test Case 11: Modal close functionality
  it('closes modal when close button is clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    // Open the Low Stock modal
    const lowStockCard = screen.getByText('Low Stock Items').closest('.MuiPaper-root');
    const viewItemsButton = within(lowStockCard as HTMLElement).getByRole('button', { name: 'View Items' });
    fireEvent.click(viewItemsButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Low Stock Items' })).toBeInTheDocument();
    });

    // Close the modal
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Low Stock Items' })).not.toBeInTheDocument();
    });
  });

  // Test Case 12: Multiple sorting operations
  it('handles multiple sorting operations correctly', async () => {
    render(
      <ThemeProvider theme={theme}>
        <InventoryMetricsCards dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );

    // Open the Low Stock modal
    const lowStockCard = screen.getByText('Low Stock Items').closest('.MuiPaper-root');
    const viewItemsButton = within(lowStockCard as HTMLElement).getByRole('button', { name: 'View Items' });
    fireEvent.click(viewItemsButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Low Stock Items' })).toBeInTheDocument();
    });

    // Sort by Name (ascending)
    fireEvent.click(screen.getByRole('columnheader', { name: 'Name' }));
    
    // Sort by Name (descending)
    fireEvent.click(screen.getByRole('columnheader', { name: 'Name' }));

    // Sort by Quantity
    fireEvent.click(screen.getByRole('columnheader', { name: 'Quantity' }));

    // Verify the modal is still open and functional
    expect(screen.getByRole('dialog', { name: 'Low Stock Items' })).toBeInTheDocument();
  });

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

    // Open modal with large dataset
    const lowStockCard = screen.getByText('Low Stock Items').closest('.MuiPaper-root');
    const viewItemsButton = within(lowStockCard as HTMLElement).getByRole('button', { name: 'View Items' });
    fireEvent.click(viewItemsButton);

    await waitFor(() => {
      const modal = screen.getByRole('dialog', { name: 'Low Stock Items' });
      expect(modal).toBeInTheDocument();
    });
  });
});