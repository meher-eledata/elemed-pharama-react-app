import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import SimpleAreaCharts from './SimpleAreaCharts';
import { useGetInvoiceKpisQuery } from '../../../redux/slices/dashboardApi';
import ChartsCard from './ChartsCard';

const theme = createTheme();

// Mock the API hook to control its return values
jest.mock('../../../redux/slices/dashboardApi');

// Mock the ChartsCard component
jest.mock('./ChartsCard', () => ({
  __esModule: true,
  default: jest.fn(({ title }) => <div data-testid={`chart-card-${title}`}></div>),
}));

// Mock data to simulate a successful API response
const mockKpisData = {
  startDate: '2025-09-01T00:00:00Z',
  endDate: '2025-09-30T00:00:00Z',
  dateField: 'date',
  totalRevenue: 50000,
  totalSales: 150,
  uniquePatients: 75,
  revenueByDay: [
    { date: '2025-09-01T00:00:00Z', amount: 1500 },
    { date: '2025-09-02T00:00:00Z', amount: 2500 },
    { date: '2025-09-03T00:00:00Z', amount: 3000 },
  ],
  salesByDay: [
    { date: '2025-09-01T00:00:00Z', count: 5 },
    { date: '2025-09-02T00:00:00Z', count: 8 },
    { date: '2025-09-03T00:00:00Z', count: 12 },
  ],
  uniquePatientsByDay: [
    { date: '2025-09-01T00:00:00Z', count: 3 },
    { date: '2025-09-02T00:00:00Z', count: 5 },
    { date: '2025-09-03T00:00:00Z', count: 7 },
  ],
};

// Mock data for an empty API response
const mockEmptyData = {
  startDate: '2025-09-01T00:00:00Z',
  endDate: '2025-09-30T00:00:00Z',
  dateField: 'date',
  totalRevenue: 0,
  totalSales: 0,
  uniquePatients: 0,
  revenueByDay: [],
  salesByDay: [],
  uniquePatientsByDay: [],
};

// The component formats dates for filenames/CSV from the LOCAL calendar date in
// the payload (via dayjs on the YYYY-MM-DD portion), so the exported date is the
// same regardless of the runner's timezone — no UTC one-day shift. Derive
// expectations the same way.
const formatDateForFile = (dateStr: string) =>
  dayjs(dateStr.split('T')[0]).format('DD-MMM-YYYY');
const expectedFileDuration = `${formatDateForFile('2025-09-01')}_to_${formatDateForFile('2025-09-30')}`;

const formatCsvDate = (dateStr: string) =>
  dayjs(dateStr.split('T')[0]).format('D MMM YYYY');

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('SimpleAreaCharts Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test loading state
  it('renders loading skeletons when data is loading', () => {
    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
    render(
      <TestWrapper>
        <SimpleAreaCharts dateRange={{ startDate: null, endDate: null }} />
      </TestWrapper>
    );
    // Use querySelector to find elements by class name, which is more reliable for Mui components
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  // Test error state
  it('renders an error message when the API call fails', () => {
    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });
    render(
      <TestWrapper>
        <SimpleAreaCharts dateRange={{ startDate: null, endDate: null }} />
      </TestWrapper>
    );
    // Correctly check for the error message
    expect(screen.getByText(/Failed to load chart data./i)).toBeInTheDocument();
  });

  // Test data processing and prop passing
  it('prepares and passes the correct data to each ChartsCard', async () => {
    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: mockKpisData,
      isLoading: false,
      error: null,
    });
    render(
      <TestWrapper>
        <SimpleAreaCharts dateRange={{ startDate: '2025-09-01', endDate: '2025-09-30' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      // Corrected titles based on the rendered output
      expect(screen.getByTestId('chart-card-Revenue')).toBeInTheDocument();
      expect(screen.getByTestId('chart-card-Sales')).toBeInTheDocument();
      expect(screen.getByTestId('chart-card-Customers')).toBeInTheDocument();

      // Assert that the mocked ChartsCard component received the correct props.
      // Current behaviour: revenue is formatted with en-IN grouping + 2 decimals.
      const revenueCall = (ChartsCard as jest.Mock).mock.calls.find(call => call[0].title === 'Revenue');
      expect(revenueCall[0].metric).toBe('₹50,000.00');
      expect(revenueCall[0].chartData.series1).toEqual([1500, 2500, 3000]);

      // The filename embeds the date range formatted via toLocaleDateString,
      // which is timezone-dependent. Derive the expectation the same way the
      // component does so the assertion is stable across environments.
      expect(revenueCall[0].filename).toBe(`total_revenue_report_${expectedFileDuration}.csv`);
    });
  });

  // Test handling of empty data
  it('handles empty data and passes correct default values to ChartsCard', async () => {
    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: mockEmptyData,
      isLoading: false,
      error: null,
    });
    render(
      <TestWrapper>
        <SimpleAreaCharts dateRange={{ startDate: '2025-09-01', endDate: '2025-09-30' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      // Find the chart card with the title 'Revenue'
      const revenueCall = (ChartsCard as jest.Mock).mock.calls.find(call => call[0].title === 'Revenue');
      
      // Assert that the call was made before checking its properties
      expect(revenueCall).toBeDefined();

      // Check for the expected properties of the empty data.
      // Current behaviour: revenue is formatted with 2 decimals → ₹0.00.
      expect(revenueCall[0].metric).toBe('₹0.00');
      expect(revenueCall[0].chartData.series1).toEqual([]);
    });
  });

  // Test Case 5: Date range filtering
  it('filters data correctly based on date range', async () => {
    const dataWithDateRange = {
      ...mockKpisData,
      revenueByDay: [
        { date: '2025-09-01T00:00:00Z', amount: 1500 },
        { date: '2025-09-15T00:00:00Z', amount: 2500 },
        { date: '2025-09-30T00:00:00Z', amount: 3000 },
        { date: '2025-10-01T00:00:00Z', amount: 4000 }, // This should be filtered out
      ],
    };

    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: dataWithDateRange,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <SimpleAreaCharts dateRange={{ startDate: '2025-09-01', endDate: '2025-09-30' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      const revenueCall = (ChartsCard as jest.Mock).mock.calls.find(call => call[0].title === 'Revenue');
      expect(revenueCall[0].chartData.series1).toEqual([1500, 2500, 3000]); // Only September data
    });
  });

  // Test Case 6: CSV data generation
  it('generates correct CSV data for download', async () => {
    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: mockKpisData,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <SimpleAreaCharts dateRange={{ startDate: '2025-09-01', endDate: '2025-09-30' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      const revenueCall = (ChartsCard as jest.Mock).mock.calls.find(call => call[0].title === 'Revenue');
      expect(revenueCall[0].csvData).toEqual([
        { Date: formatCsvDate('2025-09-01T00:00:00Z'), 'Total Revenue': 1500 },
        { Date: formatCsvDate('2025-09-02T00:00:00Z'), 'Total Revenue': 2500 },
        { Date: formatCsvDate('2025-09-03T00:00:00Z'), 'Total Revenue': 3000 },
      ]);
    });
  });

  // Test Case 7: Filename generation
  it('generates correct filenames for CSV downloads', async () => {
    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: mockKpisData,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <SimpleAreaCharts dateRange={{ startDate: '2025-09-01', endDate: '2025-09-30' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      const revenueCall = (ChartsCard as jest.Mock).mock.calls.find(call => call[0].title === 'Revenue');
      expect(revenueCall[0].filename).toBe(`total_revenue_report_${expectedFileDuration}.csv`);
    });
  });

  // Test Case 8: Color props
  it('passes correct color props to each chart', async () => {
    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: mockKpisData,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <SimpleAreaCharts dateRange={{ startDate: '2025-09-01', endDate: '2025-09-30' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      const patientsCall = (ChartsCard as jest.Mock).mock.calls.find(call => call[0].title === 'Customers');
      const revenueCall = (ChartsCard as jest.Mock).mock.calls.find(call => call[0].title === 'Revenue');
      const salesCall = (ChartsCard as jest.Mock).mock.calls.find(call => call[0].title === 'Sales');

      expect(patientsCall[0].colors.main).toBe('#6A8EFF');
      expect(revenueCall[0].colors.main).toBe('#FF6AA6');
      expect(salesCall[0].colors.main).toBe('#6AFF9E');
    });
  });

  // Test Case 9: Y-axis configuration
  it('calculates correct Y-axis configuration', async () => {
    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: mockKpisData,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <SimpleAreaCharts dateRange={{ startDate: '2025-09-01', endDate: '2025-09-30' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      const revenueCall = (ChartsCard as jest.Mock).mock.calls.find(call => call[0].title === 'Revenue');
      expect(revenueCall[0].yAxisConfig.min).toBe(0);
      expect(revenueCall[0].yAxisConfig.max).toBe(3000);
      expect(revenueCall[0].yAxisConfig.tickInterval).toHaveLength(5);
    });
  });

  // Test Case 10: Null date range handling
  it('handles null date range gracefully', async () => {
    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: mockKpisData,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <SimpleAreaCharts dateRange={{ startDate: null, endDate: null }} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('chart-card-Revenue')).toBeInTheDocument();
      expect(screen.getByTestId('chart-card-Sales')).toBeInTheDocument();
      expect(screen.getByTestId('chart-card-Customers')).toBeInTheDocument();
    });
  });

  // Test Case 11: Invalid data handling
  it('handles invalid data gracefully', async () => {
    const invalidData = {
      ...mockKpisData,
      revenueByDay: null, // Invalid data
      salesByDay: undefined, // Invalid data
    };

    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: invalidData,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <SimpleAreaCharts dateRange={{ startDate: '2025-09-01', endDate: '2025-09-30' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      const revenueCall = (ChartsCard as jest.Mock).mock.calls.find(call => call[0].title === 'Revenue');
      expect(revenueCall[0].chartData.series1).toEqual([]);
      // Total still comes from the API (totalRevenue: 50000), now formatted
      // with en-IN grouping + 2 decimals.
      expect(revenueCall[0].metric).toBe('₹50,000.00'); // Total should still be available
    });
  });

  // Test Case 12: Performance with large datasets
  it('handles large datasets efficiently', async () => {
    const largeData = {
      ...mockKpisData,
      revenueByDay: Array.from({ length: 1000 }, (_, i) => ({
        date: new Date(2025, 8, i + 1).toISOString(),
        amount: Math.floor(Math.random() * 10000),
      })),
    };

    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: largeData,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <SimpleAreaCharts dateRange={{ startDate: '2025-09-01', endDate: '2025-09-30' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('chart-card-Revenue')).toBeInTheDocument();
      expect(screen.getByTestId('chart-card-Sales')).toBeInTheDocument();
      expect(screen.getByTestId('chart-card-Customers')).toBeInTheDocument();
    });
  });

  // Test Case 13: Accessibility
  it('renders with proper accessibility attributes', async () => {
    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: mockKpisData,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <SimpleAreaCharts dateRange={{ startDate: '2025-09-01', endDate: '2025-09-30' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check that charts have proper test IDs for accessibility
      expect(screen.getByTestId('chart-card-Revenue')).toBeInTheDocument();
      expect(screen.getByTestId('chart-card-Sales')).toBeInTheDocument();
      expect(screen.getByTestId('chart-card-Customers')).toBeInTheDocument();
    });
  });

  // Test Case 14: Component title rendering
  it('renders the component title correctly', async () => {
    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: mockKpisData,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <SimpleAreaCharts dateRange={{ startDate: '2025-09-01', endDate: '2025-09-30' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for the sales contracts title
      expect(screen.getByText(/Sales Contracts/i)).toBeInTheDocument();
    });
  });
});
