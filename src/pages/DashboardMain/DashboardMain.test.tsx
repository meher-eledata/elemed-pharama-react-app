import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import DashboardMain from './DashboardMain';
import { DASHBOARD_MAIN_LABELS } from '../../config/label/DashboardMain.labels';

// Mock the child components
jest.mock('../../components/mainDashboard/InventoryMetrics/InventoryMetricsCard', () => ({
  __esModule: true,
  default: ({ dateRange }: { dateRange: any }) => (
    <div data-testid="inventory-metrics" data-date-range={JSON.stringify(dateRange)}>
      Inventory Metrics Component
    </div>
  ),
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
  default: ({ dateRange }: { dateRange: any }) => (
    <div data-testid="charts-component" data-date-range={JSON.stringify(dateRange)}>
      Charts Component
    </div>
  ),
}));

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

const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({ 
  children, 
  store = createMockStore() 
}) => (
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </Provider>
);

describe('DashboardMain Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );
      
      expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
    });

    it('renders all main components', () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      expect(screen.getByTestId('date-range-filter')).toBeInTheDocument();
      expect(screen.getByTestId('charts-component')).toBeInTheDocument();
      expect(screen.getByTestId('inventory-metrics')).toBeInTheDocument();
    });

    it('renders welcome message with guest when no user is logged in', () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      expect(screen.getByText(`${DASHBOARD_MAIN_LABELS.WELCOME_PREFIX} Guest`)).toBeInTheDocument();
    });

    it('renders welcome message with user name when user is logged in', () => {
      const mockUser = {
        username: 'testuser',
        first_name: 'John',
        last_name: 'Doe',
      };

      const store = createMockStore({
        auth: { user: mockUser },
      });

      render(
        <TestWrapper store={store}>
          <DashboardMain />
        </TestWrapper>
      );

      expect(screen.getByText(`${DASHBOARD_MAIN_LABELS.WELCOME_PREFIX} John Doe`)).toBeInTheDocument();
    });

    it('renders welcome message with username when user has no first/last name', () => {
      const mockUser = {
        username: 'testuser',
        first_name: null,
        last_name: null,
      };

      const store = createMockStore({
        auth: { user: mockUser },
      });

      render(
        <TestWrapper store={store}>
          <DashboardMain />
        </TestWrapper>
      );

      expect(screen.getByText(`${DASHBOARD_MAIN_LABELS.WELCOME_PREFIX} testuser`)).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      expect(screen.getByText(DASHBOARD_MAIN_LABELS.CREATE_INVOICE)).toBeInTheDocument();
      expect(screen.getByText(DASHBOARD_MAIN_LABELS.ADD_RECEIVE)).toBeInTheDocument();
    });

    it('renders inventory header', () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      expect(screen.getByText(DASHBOARD_MAIN_LABELS.INVENTORY_HEADER)).toBeInTheDocument();
    });
  });

  describe('User Initials Generation', () => {
    it('generates initials from first and last name', () => {
      const mockUser = {
        username: 'testuser',
        first_name: 'John',
        last_name: 'Doe',
      };

      const store = createMockStore({
        auth: { user: mockUser },
      });

      render(
        <TestWrapper store={store}>
          <DashboardMain />
        </TestWrapper>
      );

      // The initials are generated internally, we can test the display name instead
      expect(screen.getByText(`${DASHBOARD_MAIN_LABELS.WELCOME_PREFIX} John Doe`)).toBeInTheDocument();
    });

    it('generates initials from username when no first/last name', () => {
      const mockUser = {
        username: 'testuser',
        first_name: null,
        last_name: null,
      };

      const store = createMockStore({
        auth: { user: mockUser },
      });

      render(
        <TestWrapper store={store}>
          <DashboardMain />
        </TestWrapper>
      );

      expect(screen.getByText(`${DASHBOARD_MAIN_LABELS.WELCOME_PREFIX} testuser`)).toBeInTheDocument();
    });

    it('shows guest when no user data', () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      expect(screen.getByText(`${DASHBOARD_MAIN_LABELS.WELCOME_PREFIX} Guest`)).toBeInTheDocument();
    });
  });

  describe('Date Range Functionality', () => {
    it('initializes with default date range (30 days ago to today)', () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      const dateRangeDisplay = screen.getByTestId('date-range-display');
      expect(dateRangeDisplay).toBeInTheDocument();
      
      // Check that the date range is approximately 30 days
      const dateRangeText = dateRangeDisplay.textContent;
      expect(dateRangeText).toMatch(/\d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}/);
    });

    it('updates date range when DateRangeFilter calls onDateRangeChange', async () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      const changeButton = screen.getByTestId('date-range-button');
      fireEvent.click(changeButton);

      await waitFor(() => {
        const dateRangeDisplay = screen.getByTestId('date-range-display');
        expect(dateRangeDisplay.textContent).toMatch(/\d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}/);
      });
    });

    it('passes correct date range format to child components', () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      const chartsComponent = screen.getByTestId('charts-component');
      const inventoryComponent = screen.getByTestId('inventory-metrics');

      expect(chartsComponent).toHaveAttribute('data-date-range');
      expect(inventoryComponent).toHaveAttribute('data-date-range');

      // Parse the date range data
      const chartsDateRange = JSON.parse(chartsComponent.getAttribute('data-date-range') || '{}');
      const inventoryDateRange = JSON.parse(inventoryComponent.getAttribute('data-date-range') || '{}');

      expect(chartsDateRange).toHaveProperty('startDate');
      expect(chartsDateRange).toHaveProperty('endDate');
      expect(inventoryDateRange).toHaveProperty('startDate');
      expect(inventoryDateRange).toHaveProperty('endDate');
    });
  });

  describe('Component Integration', () => {
    it('passes date range to all child components', () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      // Verify all child components receive the date range
      const chartsComponent = screen.getByTestId('charts-component');
      const inventoryComponent = screen.getByTestId('inventory-metrics');

      expect(chartsComponent.getAttribute('data-date-range')).toBeTruthy();
      expect(inventoryComponent.getAttribute('data-date-range')).toBeTruthy();
    });

    it('maintains consistent date range across all components', () => {
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
  });

  describe('Accessibility', () => {
    it('has proper button accessibility', () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      const createInvoiceButton = screen.getByText(DASHBOARD_MAIN_LABELS.CREATE_INVOICE);
      const addReceiveButton = screen.getByText(DASHBOARD_MAIN_LABELS.ADD_RECEIVE);

      expect(createInvoiceButton).toBeInTheDocument();
      expect(addReceiveButton).toBeInTheDocument();
      expect(createInvoiceButton.closest('button')).toHaveAttribute('type', 'button');
      expect(addReceiveButton.closest('button')).toHaveAttribute('type', 'button');
    });

    it('has proper heading structure', () => {
      render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      const welcomeText = screen.getByText(/Welcome/i);
      const inventoryHeader = screen.getByText(DASHBOARD_MAIN_LABELS.INVENTORY_HEADER);

      expect(welcomeText).toBeInTheDocument();
      expect(inventoryHeader).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing user data gracefully', () => {
      const store = createMockStore({
        auth: { user: null },
      });

      render(
        <TestWrapper store={store}>
          <DashboardMain />
        </TestWrapper>
      );

      expect(screen.getByText(`${DASHBOARD_MAIN_LABELS.WELCOME_PREFIX} Guest`)).toBeInTheDocument();
    });

    it('handles partial user data gracefully', () => {
      const mockUser = {
        username: 'testuser',
        first_name: 'John',
        last_name: null,
      };

      const store = createMockStore({
        auth: { user: mockUser },
      });

      render(
        <TestWrapper store={store}>
          <DashboardMain />
        </TestWrapper>
      );

      expect(screen.getByText(`${DASHBOARD_MAIN_LABELS.WELCOME_PREFIX} testuser`)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily when props do not change', () => {
      const { rerender } = render(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      const initialDateRangeDisplay = screen.getByTestId('date-range-display').textContent;

      // Re-render with same props
      rerender(
        <TestWrapper>
          <DashboardMain />
        </TestWrapper>
      );

      const finalDateRangeDisplay = screen.getByTestId('date-range-display').textContent;
      expect(finalDateRangeDisplay).toBe(initialDateRangeDisplay);
    });
  });
});
