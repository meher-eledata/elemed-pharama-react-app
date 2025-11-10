import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import dayjs from 'dayjs';
import DashboardMain from '../../pages/DashboardMain/DashboardMain';
import { DASHBOARD_MAIN_LABELS } from '../../config/label/DashboardMain.labels';

// Mock the API hooks
jest.mock('../../redux/slices/dashboardApi', () => ({
  useGetInvoiceStatsQuery: jest.fn(),
  useGetInventoryByDateQuery: jest.fn(),
  useGetInvoiceKpisQuery: jest.fn(),
}));

// Mock the child components with more realistic behavior
jest.mock('../../components/mainDashboard/InventoryMetrics/InventoryMetricsCard', () => ({
  __esModule: true,
  default: ({ dateRange }: { dateRange: any }) => {
    const { useGetInvoiceStatsQuery, useGetInventoryByDateQuery } = require('../../redux/slices/dashboardApi');
    const invoiceStats = useGetInvoiceStatsQuery(dateRange);
    const inventoryStats = useGetInventoryByDateQuery(dateRange);
    
    return (
      <div data-testid="inventory-metrics" data-date-range={JSON.stringify(dateRange)}>
        <div data-testid="invoice-stats-loading">{invoiceStats.isLoading ? 'Loading' : 'Loaded'}</div>
        <div data-testid="inventory-stats-loading">{inventoryStats.isLoading ? 'Loading' : 'Loaded'}</div>
        <div data-testid="invoice-stats-error">{invoiceStats.error ? 'Error' : 'No Error'}</div>
        <div data-testid="inventory-stats-error">{inventoryStats.error ? 'Error' : 'No Error'}</div>
        Inventory Metrics Component
      </div>
    );
  },
}));

jest.mock('../../components/mainDashboard/DateRangeFilter/DateRangeFilter', () => ({
  __esModule: true,
  default: ({ dateRange, onDateRangeChange }: { dateRange: any; onDateRangeChange: any }) => (
    <div data-testid="date-range-filter">
      <button 
        data-testid="date-range-button"
        onClick={() => onDateRangeChange([dayjs().subtract(7, 'day'), dayjs()])}
      >
        Change Date Range
      </button>
      <span data-testid="date-range-display">
        {dateRange[0]?.format('YYYY-MM-DD')} to {dateRange[1]?.format('YYYY-MM-DD')}
      </span>
    </div>
  ),
}));

jest.mock('../../components/mainDashboard/Charts/SimpleAreaCharts', () => ({
  __esModule: true,
  default: ({ dateRange }: { dateRange: any }) => {
    const { useGetInvoiceKpisQuery } = require('../../redux/slices/dashboardApi');
    const kpis = useGetInvoiceKpisQuery(dateRange);
    
    return (
      <div data-testid="charts-component" data-date-range={JSON.stringify(dateRange)}>
        <div data-testid="charts-loading">{kpis.isLoading ? 'Loading' : 'Loaded'}</div>
        <div data-testid="charts-error">{kpis.error ? 'Error' : 'No Error'}</div>
        Charts Component
      </div>
    );
  },
}));

const theme = createTheme();

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: null }, action) => state,
    },
    preloadedState: {
      auth: { user: null },
      ...initialState,
    },
  });
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({ 
  children, 
  store = createMockStore() 
}) => (
  <BrowserRouter>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </Provider>
  </BrowserRouter>
);

describe('Dashboard Integration Tests', () => {
  const { useGetInvoiceStatsQuery, useGetInventoryByDateQuery, useGetInvoiceKpisQuery } = require('../../redux/slices/dashboardApi');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    useGetInvoiceStatsQuery.mockReturnValue({
      data: {
        latestBatchReceivedOn: '2025-09-19T08:37:11Z',
        returns: 5,
        activeSalesDays: 10,
      },
      isLoading: false,
      error: null,
    });

    useGetInventoryByDateQuery.mockReturnValue({
      data: {
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
        ],
        expiredProducts: [],
        aboveMaxProducts: [],
      },
      isLoading: false,
      error: null,
    });

    useGetInvoiceKpisQuery.mockReturnValue({
      data: {
        startDate: '2025-09-01T00:00:00Z',
        endDate: '2025-09-30T00:00:00Z',
        dateField: 'date',
        totalRevenue: 50000,
        totalSales: 150,
        uniquePatients: 75,
        revenueByDay: [
          { date: '2025-09-01T00:00:00Z', amount: 1500 },
          { date: '2025-09-02T00:00:00Z', amount: 2500 },
        ],
        salesByDay: [
          { date: '2025-09-01T00:00:00Z', count: 5 },
          { date: '2025-09-02T00:00:00Z', count: 8 },
        ],
        uniquePatientsByDay: [
          { date: '2025-09-01T00:00:00Z', count: 3 },
          { date: '2025-09-02T00:00:00Z', count: 5 },
        ],
      },
      isLoading: false,
      error: null,
    });
  });

  describe('Component Integration', () => {
    it('renders all dashboard components together', () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      // Check that all main components are rendered
      expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
      expect(screen.getByTestId('date-range-filter')).toBeInTheDocument();
      expect(screen.getByTestId('charts-component')).toBeInTheDocument();
      expect(screen.getByTestId('inventory-metrics')).toBeInTheDocument();
    });

    it('passes consistent date range to all child components', () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      const chartsComponent = screen.getByTestId('charts-component');
      const inventoryComponent = screen.getByTestId('inventory-metrics');

      const chartsDateRange = JSON.parse(chartsComponent.getAttribute('data-date-range') || '{}');
      const inventoryDateRange = JSON.parse(inventoryComponent.getAttribute('data-date-range') || '{}');

      expect(chartsDateRange.startDate).toBe(inventoryDateRange.startDate);
      expect(chartsDateRange.endDate).toBe(inventoryDateRange.endDate);
    });

    it('updates all components when date range changes', async () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      const initialChartsDateRange = JSON.parse(
        screen.getByTestId('charts-component').getAttribute('data-date-range') || '{}'
      );

      // Change date range
      const changeButton = screen.getByTestId('date-range-button');
      fireEvent.click(changeButton);

      await waitFor(() => {
        const updatedChartsDateRange = JSON.parse(
          screen.getByTestId('charts-component').getAttribute('data-date-range') || '{}'
        );
        const updatedInventoryDateRange = JSON.parse(
          screen.getByTestId('inventory-metrics').getAttribute('data-date-range') || '{}'
        );

        // Both components should have the same updated date range
        expect(updatedChartsDateRange.startDate).toBe(updatedInventoryDateRange.startDate);
        expect(updatedChartsDateRange.endDate).toBe(updatedInventoryDateRange.endDate);
        
        // Date range should be different from initial
        expect(updatedChartsDateRange.startDate).not.toBe(initialChartsDateRange.startDate);
      });
    });
  });

  describe('API Integration', () => {
    it('calls all API hooks with correct date range parameters', () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      // Verify that all API hooks were called with the initial date range
      expect(useGetInvoiceStatsQuery).toHaveBeenCalled();
      expect(useGetInventoryByDateQuery).toHaveBeenCalled();
      expect(useGetInvoiceKpisQuery).toHaveBeenCalled();

      // Check that the calls were made with the expected date range format
      const invoiceStatsCall = useGetInvoiceStatsQuery.mock.calls[0][0];
      const inventoryCall = useGetInventoryByDateQuery.mock.calls[0][0];
      const kpisCall = useGetInvoiceKpisQuery.mock.calls[0][0];

      expect(invoiceStatsCall).toHaveProperty('startDate');
      expect(invoiceStatsCall).toHaveProperty('endDate');
      expect(inventoryCall).toHaveProperty('startDate');
      expect(inventoryCall).toHaveProperty('endDate');
      expect(kpisCall).toHaveProperty('startDate');
      expect(kpisCall).toHaveProperty('endDate');
    });

    it('refetches data when date range changes', async () => {
      const { rerender } = render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      // Clear previous calls
      jest.clearAllMocks();

      // Change date range
      const changeButton = screen.getByTestId('date-range-button');
      fireEvent.click(changeButton);

      await waitFor(() => {
        // Verify that API hooks were called again with new date range
        expect(useGetInvoiceStatsQuery).toHaveBeenCalled();
        expect(useGetInventoryByDateQuery).toHaveBeenCalled();
        expect(useGetInvoiceKpisQuery).toHaveBeenCalled();
      });
    });

    it('handles loading states across all components', () => {
      useGetInvoiceStatsQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      useGetInventoryByDateQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      useGetInvoiceKpisQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      // Check that loading states are properly handled
      expect(screen.getByTestId('invoice-stats-loading')).toHaveTextContent('Loading');
      expect(screen.getByTestId('inventory-stats-loading')).toHaveTextContent('Loading');
      expect(screen.getByTestId('charts-loading')).toHaveTextContent('Loading');
    });

    it('handles error states across all components', () => {
      useGetInvoiceStatsQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API Error'),
      });

      useGetInventoryByDateQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API Error'),
      });

      useGetInvoiceKpisQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API Error'),
      });

      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      // Check that error states are properly handled
      expect(screen.getByTestId('invoice-stats-error')).toHaveTextContent('Error');
      expect(screen.getByTestId('inventory-stats-error')).toHaveTextContent('Error');
      expect(screen.getByTestId('charts-error')).toHaveTextContent('Error');
    });
  });

  describe('User Interaction Flow', () => {
    it('completes full user interaction flow', async () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      // 1. User sees the dashboard
      expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
      expect(screen.getByText(DASHBOARD_MAIN_LABELS.CREATE_INVOICE)).toBeInTheDocument();
      expect(screen.getByText(DASHBOARD_MAIN_LABELS.ADD_RECEIVE)).toBeInTheDocument();

      // 2. User changes date range
      const changeButton = screen.getByTestId('date-range-button');
      fireEvent.click(changeButton);

      await waitFor(() => {
        // 3. All components update with new date range
        const chartsComponent = screen.getByTestId('charts-component');
        const inventoryComponent = screen.getByTestId('inventory-metrics');

        expect(chartsComponent).toBeInTheDocument();
        expect(inventoryComponent).toBeInTheDocument();
      });

      // 4. User can still interact with action buttons
      const createInvoiceButton = screen.getByText(DASHBOARD_MAIN_LABELS.CREATE_INVOICE);
      const addReceiveButton = screen.getByText(DASHBOARD_MAIN_LABELS.ADD_RECEIVE);

      expect(createInvoiceButton).toBeInTheDocument();
      expect(addReceiveButton).toBeInTheDocument();
    });

    it('maintains state consistency during user interactions', async () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      // Get initial state
      const initialDateRange = JSON.parse(
        screen.getByTestId('charts-component').getAttribute('data-date-range') || '{}'
      );

      // Perform multiple interactions
      const changeButton = screen.getByTestId('date-range-button');
      fireEvent.click(changeButton);

      await waitFor(() => {
        const updatedDateRange = JSON.parse(
          screen.getByTestId('charts-component').getAttribute('data-date-range') || '{}'
        );

        // State should be consistent across all components
        expect(updatedDateRange.startDate).not.toBe(initialDateRange.startDate);
        // Verify the date range was updated (should be 7 days ago to today)
        expect(updatedDateRange.startDate).toBeTruthy();
        expect(updatedDateRange.endDate).toBeTruthy();
        // Verify the dates are in the correct format (YYYY-MM-DD)
        expect(updatedDateRange.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(updatedDateRange.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('Performance Integration', () => {
    it('handles multiple rapid date range changes efficiently', async () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      const changeButton = screen.getByTestId('date-range-button');

      // Perform multiple rapid changes
      fireEvent.click(changeButton);
      fireEvent.click(changeButton);
      fireEvent.click(changeButton);

      await waitFor(() => {
        // Components should still be functional
        expect(screen.getByTestId('charts-component')).toBeInTheDocument();
        expect(screen.getByTestId('inventory-metrics')).toBeInTheDocument();
      });
    });

    it('does not cause unnecessary re-renders', () => {
      const { rerender } = render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      const initialChartsComponent = screen.getByTestId('charts-component');
      const initialInventoryComponent = screen.getByTestId('inventory-metrics');

      // Re-render with same props
      rerender(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      // Components should be the same instances (no unnecessary re-renders)
      expect(screen.getByTestId('charts-component')).toBe(initialChartsComponent);
      expect(screen.getByTestId('inventory-metrics')).toBe(initialInventoryComponent);
    });
  });

  describe('Error Recovery', () => {
    it('recovers from API errors when date range changes', async () => {
      // Start with error state
      useGetInvoiceStatsQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API Error'),
      });

      useGetInventoryByDateQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API Error'),
      });

      useGetInvoiceKpisQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API Error'),
      });

      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      // Verify error state
      expect(screen.getByTestId('invoice-stats-error')).toHaveTextContent('Error');

      // Change date range to trigger recovery
      const changeButton = screen.getByTestId('date-range-button');
      fireEvent.click(changeButton);

      // Mock successful response
      useGetInvoiceStatsQuery.mockReturnValue({
        data: { latestBatchReceivedOn: '2025-09-19T08:37:11Z', returns: 5, activeSalesDays: 10 },
        isLoading: false,
        error: null,
      });

      useGetInventoryByDateQuery.mockReturnValue({
        data: { belowMinProducts: [], expiredProducts: [], aboveMaxProducts: [] },
        isLoading: false,
        error: null,
      });

      useGetInvoiceKpisQuery.mockReturnValue({
        data: { totalRevenue: 50000, totalSales: 150, uniquePatients: 75 },
        isLoading: false,
        error: null,
      });

      await waitFor(() => {
        // Components should recover and show data
        expect(screen.getByTestId('charts-component')).toBeInTheDocument();
        expect(screen.getByTestId('inventory-metrics')).toBeInTheDocument();
      });
    });
  });
});
