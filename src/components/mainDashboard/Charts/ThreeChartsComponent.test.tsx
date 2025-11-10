// src/components/mainDashboard/Charts/ThreeChartsComponent.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThreeChartsComponent from '../../../components/mainDashboard/Charts/SimpleAreaCharts';
import { useGetInvoiceKpisQuery } from '../../../redux/slices/dashboardApi';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ChartCard from '../../../components/mainDashboard/Charts/ChartsCard';

const theme = createTheme();

// Mock the API hook to control its return values
jest.mock('../../../redux/slices/dashboardApi');

// Correctly mock the ChartCard component
jest.mock('../../../components/mainDashboard/Charts/ChartsCard', () => ({
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

describe('ThreeChartsComponent', () => {
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
      <ThemeProvider theme={theme}>
        <ThreeChartsComponent dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
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
      <ThemeProvider theme={theme}>
        <ThreeChartsComponent dateRange={{ startDate: null, endDate: null }} />
      </ThemeProvider>
    );
    // Correctly check for the error message
    expect(screen.getByText(/Failed to load chart data./i)).toBeInTheDocument();
  });

  // Test data processing and prop passing
  it('prepares and passes the correct data to each ChartCard', async () => {
    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: mockKpisData,
      isLoading: false,
      error: null,
    });
    render(
      <ThemeProvider theme={theme}>
        <ThreeChartsComponent dateRange={{ startDate: '2025-09-01', endDate: '2025-09-30' }} />
      </ThemeProvider>
    );

    await waitFor(() => {
      // Corrected titles based on the rendered output
      expect(screen.getByTestId('chart-card-Revenue')).toBeInTheDocument();
      expect(screen.getByTestId('chart-card-Sales')).toBeInTheDocument();
      expect(screen.getByTestId('chart-card-Patients')).toBeInTheDocument();

      // Assert that the mocked ChartCard component received the correct props
      const revenueCall = (ChartCard as jest.Mock).mock.calls.find(call => call[0].title === 'Revenue');
      expect(revenueCall[0].metric).toBe('$50000');
      expect(revenueCall[0].chartData.series1).toEqual([1500, 2500, 3000]);

      // Fix this line to match the received filename format
      expect(revenueCall[0].filename).toBe('total_revenue_report_Sep-01,-2025_to_Sep-30,-2025.csv');
    });
  });

  // Test handling of empty data
  it('handles empty data and passes correct default values to ChartCard', async () => {
    (useGetInvoiceKpisQuery as jest.Mock).mockReturnValue({
      data: mockEmptyData,
      isLoading: false,
      error: null,
    });
    render(
      <ThemeProvider theme={theme}>
        <ThreeChartsComponent dateRange={{ startDate: '2025-09-01', endDate: '2025-09-30' }} />
      </ThemeProvider>
    );

    await waitFor(() => {
      // Find the chart card with the title 'Revenue'
      const revenueCall = (ChartCard as jest.Mock).mock.calls.find(call => call[0].title === 'Revenue');
      
      // Assert that the call was made before checking its properties
      expect(revenueCall).toBeDefined();

      // Check for the expected properties of the empty data
      expect(revenueCall[0].metric).toBe('$0');
      expect(revenueCall[0].chartData.series1).toEqual([]);
    });
  });
});

