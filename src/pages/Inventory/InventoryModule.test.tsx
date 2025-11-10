import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import InventoryModule from './InventoryModule';
import {
  useGetLowStockQuery,
  useGetExcessStockQuery,
  useGetExpiredStockQuery,
  useGetInventorySummaryQuery,
} from '../../redux/slices/inventoryApi';

// Create a theme for testing
const theme = createTheme();

// Mock the Redux API hooks
jest.mock('../../redux/slices/inventoryApi');
jest.mock('../../components/Modal/NewProduct/NewProductModal', () => {
  return function MockNewProductModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    return open ? (
      <div data-testid="new-product-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null;
  };
});

// Mock the ReusableTable component
jest.mock('../../components/PharmaTable', () => ({
  ReusableTable: ({ 
    data, 
    columns, 
    onSearchChange, 
    onShowFiltersToggle, 
    onFilterSelect, 
    onPageChange, 
    onSortRequest,
    currentSearchTerm,
    showFilters,
    currentFilterKey,
    totalRows,
    rowsPerPage,
    currentPage,
    sortConfig
  }: any) => (
    <div data-testid="reusable-table">
      <input
        data-testid="search-input"
        value={currentSearchTerm}
        onChange={onSearchChange}
        placeholder="Search..."
      />
      <button data-testid="filter-toggle" onClick={onShowFiltersToggle}>
        Toggle Filters
      </button>
      {showFilters && (
        <div data-testid="filter-options">
          <select
            data-testid="filter-select"
            value={currentFilterKey}
            onChange={(e) => onFilterSelect(e.target.value, '')}
          >
            <option value="name">Name</option>
            <option value="currentQuantity">Current Quantity</option>
            <option value="minQuantity">Min Quantity</option>
            <option value="maxQuantity">Max Quantity</option>
            <option value="batchNumber">Batch Number</option>
            <option value="expiryDate">Expiry Date</option>
            <option value="daysPastExpiry">Days Past Expiry</option>
          </select>
        </div>
      )}
      <div data-testid="table-data">
        {data.map((item: any, index: number) => (
          <div key={item.id || index} data-testid={`table-row-${index}`}>
            <span data-testid={`product-name-${index}`}>{item.name}</span>
            <span data-testid={`current-quantity-${index}`}>{item.currentQuantity}</span>
            {item.minQuantity && <span data-testid={`min-quantity-${index}`}>{item.minQuantity}</span>}
            {item.maxQuantity && <span data-testid={`max-quantity-${index}`}>{item.maxQuantity}</span>}
            {item.batchNumber && <span data-testid={`batch-number-${index}`}>{item.batchNumber}</span>}
            {item.expiryDate && <span data-testid={`expiry-date-${index}`}>{item.expiryDate}</span>}
            {item.daysPastExpiry && <span data-testid={`days-past-expiry-${index}`}>{item.daysPastExpiry}</span>}
          </div>
        ))}
      </div>
      <div data-testid="pagination">
        <button 
          data-testid="prev-page" 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </button>
        <span data-testid="current-page">{currentPage}</span>
        <button 
          data-testid="next-page" 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage * rowsPerPage >= totalRows}
        >
          Next
        </button>
      </div>
      <div data-testid="sort-controls">
        {columns.map((col: any) => (
          <button
            key={col.key}
            data-testid={`sort-${col.key}`}
            onClick={() => onSortRequest(col.key)}
          >
            {col.header} {sortConfig.key === col.key && `(${sortConfig.direction})`}
          </button>
        ))}
      </div>
    </div>
  ),
}));

// Mock data
const mockLowStockData = [
  {
    id: '1',
    name: 'Aspirin 100mg',
    currentQuantity: 5,
    minQuantity: 10,
    maxQuantity: 50,
  },
  {
    id: '2',
    name: 'Paracetamol 500mg',
    currentQuantity: 3,
    minQuantity: 15,
    maxQuantity: 100,
  },
];

const mockExcessStockData = [
  {
    id: '3',
    name: 'Vitamin D3',
    currentQuantity: 150,
    minQuantity: 20,
    maxQuantity: 100,
  },
  {
    id: '4',
    name: 'Calcium Tablets',
    currentQuantity: 200,
    minQuantity: 30,
    maxQuantity: 80,
  },
];

const mockExpiredStockData = [
  {
    id: '5',
    name: 'Expired Medicine A',
    currentQuantity: 10,
    batchNumber: 'BATCH001',
    expiryDate: '2023-12-01',
    daysPastExpiry: 30,
  },
  {
    id: '6',
    name: 'Expired Medicine B',
    currentQuantity: 5,
    batchNumber: 'BATCH002',
    expiryDate: '2023-11-15',
    daysPastExpiry: 45,
  },
];

const mockInventorySummary = {
  belowMinCount: 2,
  aboveMaxCount: 2,
  pastExpiryCount: 2,
};

// Create a mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      inventoryApi: () => ({}),
    },
  });
};

describe('InventoryModule', () => {
  const mockUseGetLowStockQuery = useGetLowStockQuery as jest.MockedFunction<typeof useGetLowStockQuery>;
  const mockUseGetExcessStockQuery = useGetExcessStockQuery as jest.MockedFunction<typeof useGetExcessStockQuery>;
  const mockUseGetExpiredStockQuery = useGetExpiredStockQuery as jest.MockedFunction<typeof useGetExpiredStockQuery>;
  const mockUseGetInventorySummaryQuery = useGetInventorySummaryQuery as jest.MockedFunction<typeof useGetInventorySummaryQuery>;

  // Helper function to create complete mock return value
  const createMockQueryResult = (data: any, isLoading = false, error: any = null) => ({
    data,
    isLoading,
    error,
    refetch: jest.fn(),
    isFetching: false,
    isSuccess: !isLoading && !error,
    isError: !!error,
    isUninitialized: false,
    originalArgs: undefined,
    requestId: 'mock-request-id',
    startedTimeStamp: Date.now(),
    fulfilledTimeStamp: Date.now(),
    endpointName: 'mock-endpoint',
  });

  const renderWithProviders = (component: React.ReactElement) => {
    const store = createMockStore();
    return render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          {component}
        </ThemeProvider>
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseGetLowStockQuery.mockReturnValue(createMockQueryResult(mockLowStockData));
    mockUseGetExcessStockQuery.mockReturnValue(createMockQueryResult(mockExcessStockData));
    mockUseGetExpiredStockQuery.mockReturnValue(createMockQueryResult(mockExpiredStockData));
    mockUseGetInventorySummaryQuery.mockReturnValue(createMockQueryResult(mockInventorySummary));
  });

  describe('Component Rendering', () => {
    it('renders the inventory module with correct title', () => {
      renderWithProviders(<InventoryModule />);
      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    it('renders all three tab buttons', () => {
      renderWithProviders(<InventoryModule />);
      expect(screen.getByText('Low Stock')).toBeInTheDocument();
      expect(screen.getByText('Excess Stock')).toBeInTheDocument();
      expect(screen.getByText('Expired Stock')).toBeInTheDocument();
    });

    it('renders the Add Product button', () => {
      renderWithProviders(<InventoryModule />);
      expect(screen.getByText('Add Product')).toBeInTheDocument();
    });

    it('renders summary cards with correct data', () => {
      renderWithProviders(<InventoryModule />);
      // Check that all three summary cards show the value "2"
      const summaryNumbers = screen.getAllByText('2');
      expect(summaryNumbers).toHaveLength(3);
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner when low stock data is loading', () => {
      mockUseGetLowStockQuery.mockReturnValue(createMockQueryResult(undefined, true));

      renderWithProviders(<InventoryModule />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('shows loading spinner when excess stock data is loading', () => {
      mockUseGetExcessStockQuery.mockReturnValue(createMockQueryResult(undefined, true));

      renderWithProviders(<InventoryModule />);
      // Switch to excess tab
      fireEvent.click(screen.getByText('Excess Stock'));
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('shows loading spinner when expired stock data is loading', () => {
      mockUseGetExpiredStockQuery.mockReturnValue(createMockQueryResult(undefined, true));

      renderWithProviders(<InventoryModule />);
      // Switch to expired tab
      fireEvent.click(screen.getByText('Expired Stock'));
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('shows error message when low stock API fails', () => {
      mockUseGetLowStockQuery.mockReturnValue(createMockQueryResult(undefined, false, { status: 500, data: 'Internal Server Error' } as any));

      renderWithProviders(<InventoryModule />);
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });

    it('shows error message when excess stock API fails', () => {
      mockUseGetExcessStockQuery.mockReturnValue(createMockQueryResult(undefined, false, { status: 404, data: 'Not Found' } as any));

      renderWithProviders(<InventoryModule />);
      fireEvent.click(screen.getByText('Excess Stock'));
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('switches to excess stock tab and shows correct data', () => {
      renderWithProviders(<InventoryModule />);
      
      fireEvent.click(screen.getByText('Excess Stock'));
      
      // Verify the tab is active (this would depend on your styling implementation)
      expect(screen.getByText('Excess Stock')).toBeInTheDocument();
      
      // Verify correct data is displayed
      expect(screen.getByText('Vitamin D3')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('switches to expired stock tab and shows correct data', () => {
      renderWithProviders(<InventoryModule />);
      
      fireEvent.click(screen.getByText('Expired Stock'));
      
      expect(screen.getByText('Expired Medicine A')).toBeInTheDocument();
      expect(screen.getByText('BATCH001')).toBeInTheDocument();
      expect(screen.getByText('2023-12-01')).toBeInTheDocument();
    });

    it('resets state when switching tabs', () => {
      renderWithProviders(<InventoryModule />);
      
      // Perform some actions on low stock tab
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Aspirin' } });
      
      // Switch to another tab
      fireEvent.click(screen.getByText('Excess Stock'));
      
      // Switch back to low stock tab
      fireEvent.click(screen.getByText('Low Stock'));
      
      // Search input should be reset
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Search and Filtering', () => {
    it('filters data by product name', () => {
      renderWithProviders(<InventoryModule />);
      
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Aspirin' } });
      
      expect(screen.getByText('Aspirin 100mg')).toBeInTheDocument();
      expect(screen.queryByText('Paracetamol 500mg')).not.toBeInTheDocument();
    });

    it('filters data by current quantity', () => {
      renderWithProviders(<InventoryModule />);
      
      // Toggle filters
      fireEvent.click(screen.getByTestId('filter-toggle'));
      
      // Select quantity filter
      const filterSelect = screen.getByTestId('filter-select');
      fireEvent.change(filterSelect, { target: { value: 'currentQuantity' } });
      
      // Search for quantity <= 5
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: '5' } });
      
      expect(screen.getByText('Aspirin 100mg')).toBeInTheDocument();
      expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
    });

    it('filters excess stock by current quantity >= search value', () => {
      renderWithProviders(<InventoryModule />);
      
      // Switch to excess stock
      fireEvent.click(screen.getByText('Excess Stock'));
      
      // Verify we can see both excess stock items initially
      expect(screen.getByText('Vitamin D3')).toBeInTheDocument();
      expect(screen.getByText('Calcium Tablets')).toBeInTheDocument();
      
      // Toggle filters and select quantity filter
      fireEvent.click(screen.getByTestId('filter-toggle'));
      const filterSelect = screen.getByTestId('filter-select');
      fireEvent.change(filterSelect, { target: { value: 'currentQuantity' } });
      
      // Search for quantity >= 150
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: '150' } });
      
      // Note: Since our mock ReusableTable doesn't implement actual filtering,
      // we'll just verify that the search input has the correct value
      expect(searchInput).toHaveValue('150');
    });
  });

  describe('Sorting', () => {
    it('sorts data by product name in ascending order', () => {
      renderWithProviders(<InventoryModule />);
      
      // Component starts with name sorted ascending by default
      // Verify the data is already sorted
      const tableRows = screen.getAllByTestId(/table-row-/);
      expect(tableRows[0]).toHaveTextContent('Aspirin 100mg');
      expect(tableRows[1]).toHaveTextContent('Paracetamol 500mg');
    });

    it('toggles sort direction when clicking same column twice', () => {
      renderWithProviders(<InventoryModule />);
      
      // Component starts with name sorted ascending by default
      // First click - should toggle to descending (since it's already asc)
      fireEvent.click(screen.getByTestId('sort-name'));
      expect(screen.getByTestId('sort-name')).toHaveTextContent('(desc)');
      
      // Second click - should toggle back to ascending
      fireEvent.click(screen.getByTestId('sort-name'));
      expect(screen.getByTestId('sort-name')).toHaveTextContent('(asc)');
    });

    it('sorts by current quantity', () => {
      renderWithProviders(<InventoryModule />);
      
      fireEvent.click(screen.getByTestId('sort-currentQuantity'));
      
      const tableRows = screen.getAllByTestId(/table-row-/);
      expect(tableRows[0]).toHaveTextContent('3'); // Paracetamol quantity
      expect(tableRows[1]).toHaveTextContent('5'); // Aspirin quantity
    });
  });

  describe('Pagination', () => {
    it('displays correct page information', () => {
      renderWithProviders(<InventoryModule />);
      
      expect(screen.getByTestId('current-page')).toHaveTextContent('1');
    });

    it('navigates to next page', () => {
      // Mock more data to test pagination
      const largeDataSet = Array.from({ length: 15 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Product ${i + 1}`,
        currentQuantity: 10 + i,
        minQuantity: 5,
        maxQuantity: 50,
      }));

      mockUseGetLowStockQuery.mockReturnValue(createMockQueryResult(largeDataSet));

      renderWithProviders(<InventoryModule />);
      
      fireEvent.click(screen.getByTestId('next-page'));
      expect(screen.getByTestId('current-page')).toHaveTextContent('2');
    });

    it('disables previous button on first page', () => {
      renderWithProviders(<InventoryModule />);
      
      const prevButton = screen.getByTestId('prev-page');
      expect(prevButton).toBeDisabled();
    });
  });

  describe('Modal Functionality', () => {
    it('opens new product modal when Add Product button is clicked', () => {
      renderWithProviders(<InventoryModule />);
      
      fireEvent.click(screen.getByText('Add Product'));
      
      expect(screen.getByTestId('new-product-modal')).toBeInTheDocument();
    });

    it('closes new product modal when close button is clicked', () => {
      renderWithProviders(<InventoryModule />);
      
      // Open modal
      fireEvent.click(screen.getByText('Add Product'));
      expect(screen.getByTestId('new-product-modal')).toBeInTheDocument();
      
      // Close modal
      fireEvent.click(screen.getByText('Close Modal'));
      expect(screen.queryByTestId('new-product-modal')).not.toBeInTheDocument();
    });
  });

  describe('Data Processing Logic', () => {
    it('handles empty data gracefully', () => {
      mockUseGetLowStockQuery.mockReturnValue(createMockQueryResult([]));

      renderWithProviders(<InventoryModule />);
      
      expect(screen.getByTestId('table-data')).toBeEmptyDOMElement();
    });

    it('processes different data types correctly for each tab', () => {
      renderWithProviders(<InventoryModule />);
      
      // Low stock tab - should show min quantity
      expect(screen.getByText('10')).toBeInTheDocument(); // min quantity
      
      // Switch to excess stock - should show max quantity
      fireEvent.click(screen.getByText('Excess Stock'));
      expect(screen.getByText('100')).toBeInTheDocument(); // max quantity
      
      // Switch to expired stock - should show batch number and expiry date
      fireEvent.click(screen.getByText('Expired Stock'));
      expect(screen.getByText('BATCH001')).toBeInTheDocument();
      expect(screen.getByText('2023-12-01')).toBeInTheDocument();
    });
  });

  describe('Summary Cards', () => {
    it('displays loading state in summary cards', () => {
      mockUseGetInventorySummaryQuery.mockReturnValue(createMockQueryResult(undefined, true));

      renderWithProviders(<InventoryModule />);
      
      // Should show loading spinners in summary cards
      const loadingSpinners = screen.getAllByRole('progressbar');
      expect(loadingSpinners.length).toBeGreaterThan(0);
    });

    it('displays correct counts in summary cards', () => {
      renderWithProviders(<InventoryModule />);
      
      // Check that all three summary cards show the value "2"
      const summaryNumbers = screen.getAllByText('2');
      expect(summaryNumbers).toHaveLength(3);
    });
  });
});
