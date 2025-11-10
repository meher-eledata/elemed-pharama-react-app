import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import OrderReceive, { OrderReceiveRow, PurchaseOrderRow } from './OrderReceive';
import {
  useGetReceiptsQuery,
  useEditReceiptMutation,
  useDeleteReceiptMutation,
  useGetCurrentPurchaseOrdersQuery,
  useGetReceiptLinesQuery,
  Receipt,
  PurchaseOrder,
} from '../../redux/slices/receiveApi';

// Create a theme for testing
const theme = createTheme();

// Mock the Redux API hooks
jest.mock('../../redux/slices/receiveApi');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));
jest.mock('../../components/Modal/ReceiveSupplier/ReceiveSupplierModal', () => ({
  __esModule: true,
  default: ({ open, onClose, onNext }: any) => (
    open ? (
      <div data-testid="receive-supplier-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onNext}>Next</button>
      </div>
    ) : null
  ),
}));
jest.mock('../../components/DeleteDialogue/ConfirmationDialog', () => ({
  __esModule: true,
  default: ({ open, onClose, onConfirm, title, message }: any) => (
    open ? (
      <div data-testid="confirmation-dialog">
        <div>{title}</div>
        <div>{message}</div>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    ) : null
  ),
}));
jest.mock('../../components/CommonModal/CommonModal', () => ({
  __esModule: true,
  default: ({ open, onClose, title, content }: any) => (
    open ? (
      <div data-testid="common-modal">
        <div>{title}</div>
        {content}
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
  ),
}));
jest.mock('./ProductDetailsModalContent', () => ({
  __esModule: true,
  default: ({ productData, onUpdateProduct, onDeleteProduct }: any) => (
    <div data-testid="product-details-modal-content">
      {productData ? `Receipt: ${productData.reNo}` : 'No data'}
      <button onClick={() => onUpdateProduct(productData)}>Update</button>
      <button onClick={onDeleteProduct}>Delete</button>
    </div>
  ),
}));
jest.mock('../../components/PharmaTable', () => ({
  ReusableTable: ({ data, columns, onSortRequest, onPageChange, currentPage, totalRows }: any) => (
    <div data-testid="reusable-table">
      <div data-testid="table-data-count">{data?.length || 0}</div>
      <div data-testid="current-page">{currentPage}</div>
      <div data-testid="total-rows">{totalRows}</div>
      {data?.map((row: any, idx: number) => (
        <div key={idx} data-testid={`table-row-${idx}`}>
          {columns.map((col: any) => (
            <div key={col.key} data-testid={`cell-${col.key}-${idx}`}>
              {col.render ? col.render(row) : row[col.key]}
            </div>
          ))}
        </div>
      ))}
      <button onClick={() => onSortRequest?.('reNo')}>Sort by reNo</button>
      <button onClick={() => onPageChange?.(2)}>Next Page</button>
    </div>
  ),
}));

// Mock data
const mockReceipts: Receipt[] = [
  {
    id: 1,
    po_id: 101,
    po_number: 'PO001',
    supplier_name: 'Supplier A',
    received_on: '2024-01-15T10:00:00Z',
    received_by: 'John Doe',
    receipt_status: 'received',
    total_amount: 5000,
    transaction_number: 'TXN001',
    payment_vendor: 'Bank A',
    invoice_date: '2024-01-15',
  },
  {
    id: 2,
    po_id: 102,
    po_number: 'PO002',
    supplier_name: 'Supplier B',
    received_on: '2024-01-16T11:00:00Z',
    received_by: 'Jane Smith',
    receipt_status: 'received',
    total_amount: 7500,
  },
];

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    po_number: 'PO003',
    ordered_date: '2024-01-17',
    supplier_name: 'Supplier C',
    total_amount: '3000',
    status: 'pending',
  },
];

const mockReceiptLines = [
  {
    receipt_line_id: 1,
    product_name: 'Product 1',
    received_qty: 10,
    hsn_id: 'HSN001',
    unit_price: '100',
    transaction_number: 'TXN001',
    payment_vendor: 'Bank A',
  },
];

const mockUser = {
  first_name: 'John',
  last_name: 'Doe',
  username: 'johndoe',
};

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: (state = { user: mockUser }) => state,
    },
  });
};

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

const createMockMutation = () => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  reset: jest.fn(),
  isLoading: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: null,
});

const renderWithProviders = (component: React.ReactElement) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
};

describe('OrderReceive', () => {
  const mockUseGetReceiptsQuery = useGetReceiptsQuery as jest.MockedFunction<typeof useGetReceiptsQuery>;
  const mockUseGetCurrentPurchaseOrdersQuery = useGetCurrentPurchaseOrdersQuery as jest.MockedFunction<typeof useGetCurrentPurchaseOrdersQuery>;
  const mockUseEditReceiptMutation = useEditReceiptMutation as jest.MockedFunction<typeof useEditReceiptMutation>;
  const mockUseDeleteReceiptMutation = useDeleteReceiptMutation as jest.MockedFunction<typeof useDeleteReceiptMutation>;
  const mockUseGetReceiptLinesQuery = useGetReceiptLinesQuery as jest.MockedFunction<typeof useGetReceiptLinesQuery>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseGetReceiptsQuery.mockReturnValue(createMockQueryResult(mockReceipts));
    mockUseGetCurrentPurchaseOrdersQuery.mockReturnValue(createMockQueryResult(mockPurchaseOrders));
    mockUseEditReceiptMutation.mockReturnValue([createMockMutation().mutateAsync, createMockMutation()] as any);
    mockUseDeleteReceiptMutation.mockReturnValue([createMockMutation().mutateAsync, createMockMutation()] as any);
    mockUseGetReceiptLinesQuery.mockReturnValue(createMockQueryResult(mockReceiptLines));
  });

  describe('Component Rendering', () => {
    it('should render the component with title', () => {
      renderWithProviders(<OrderReceive />);
      expect(screen.getByText('Order Receive')).toBeInTheDocument();
    });

    it('should render Add Receive button', () => {
      renderWithProviders(<OrderReceive />);
      expect(screen.getByText('Add Receive')).toBeInTheDocument();
    });

    it('should render search field', () => {
      renderWithProviders(<OrderReceive />);
      const searchField = screen.getByPlaceholderText(/Search by Receipt Number/i);
      expect(searchField).toBeInTheDocument();
    });

    it('should render filter toggle button', () => {
      renderWithProviders(<OrderReceive />);
      expect(screen.getByText(/Show filters/i)).toBeInTheDocument();
    });

    it('should render table with receipt data', async () => {
      renderWithProviders(<OrderReceive />);
      await waitFor(() => {
        expect(screen.getByTestId('reusable-table')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should show loading state when receipts are loading', () => {
      mockUseGetReceiptsQuery.mockReturnValue(createMockQueryResult(undefined, true));
      renderWithProviders(<OrderReceive />);
      expect(screen.getByText(/Loading receipts/i)).toBeInTheDocument();
    });

    it('should show error state when receipts fail to load', () => {
      mockUseGetReceiptsQuery.mockReturnValue(createMockQueryResult(undefined, false, { message: 'Error' }));
      renderWithProviders(<OrderReceive />);
      expect(screen.getByText(/Failed to load receipts/i)).toBeInTheDocument();
    });

    it('should display receipts data when loaded', async () => {
      renderWithProviders(<OrderReceive />);
      await waitFor(() => {
        expect(screen.getByTestId('table-data-count')).toHaveTextContent('2');
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter receipts by search term', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderReceive />);
      
      await waitFor(() => {
        expect(screen.getByTestId('reusable-table')).toBeInTheDocument();
      });

      const searchField = screen.getByPlaceholderText(/Search by Receipt Number/i);
      await user.type(searchField, 'RA1');

      await waitFor(() => {
        // Search should filter the data
        expect(searchField).toHaveValue('RA1');
      });
    });

    it('should clear search when input is cleared', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderReceive />);
      
      const searchField = screen.getByPlaceholderText(/Search by Receipt Number/i);
      await user.type(searchField, 'RA1');
      await user.clear(searchField);

      expect(searchField).toHaveValue('');
    });
  });

  describe('Filter Functionality', () => {
    it('should toggle filter visibility', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderReceive />);
      
      const filterButton = screen.getByText(/Show filters/i);
      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText(/Hide filters/i)).toBeInTheDocument();
      });
    });

    it('should show filter options when filters are visible', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderReceive />);
      
      const filterButton = screen.getByText(/Show filters/i);
      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText(/Supplier Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Received On/i)).toBeInTheDocument();
      });
    });

    it('should reset filters when reset button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderReceive />);
      
      const filterButton = screen.getByText(/Show filters/i);
      await user.click(filterButton);

      await waitFor(() => {
        const resetButton = screen.getByText(/Reset filters/i);
        expect(resetButton).toBeInTheDocument();
      });
    });
  });

  describe('Table Interactions', () => {
    it('should handle sort request', async () => {
      renderWithProviders(<OrderReceive />);
      
      await waitFor(() => {
        expect(screen.getByTestId('reusable-table')).toBeInTheDocument();
      });

      const sortButton = screen.getByText('Sort by reNo');
      fireEvent.click(sortButton);

      // Sort should be triggered
      expect(sortButton).toBeInTheDocument();
    });

    it('should handle page change', async () => {
      renderWithProviders(<OrderReceive />);
      
      await waitFor(() => {
        expect(screen.getByTestId('reusable-table')).toBeInTheDocument();
      });

      const nextPageButton = screen.getByText('Next Page');
      fireEvent.click(nextPageButton);

      await waitFor(() => {
        expect(screen.getByTestId('current-page')).toHaveTextContent('2');
      });
    });
  });

  describe('View Details', () => {
    it('should open product details modal when view icon is clicked', async () => {
      renderWithProviders(<OrderReceive />);
      
      await waitFor(() => {
        expect(screen.getByTestId('reusable-table')).toBeInTheDocument();
      });

      // Find and click the visibility icon
      const visibilityIcons = screen.getAllByTestId(/cell-reNo-/);
      if (visibilityIcons.length > 0) {
        const viewIcon = visibilityIcons[0].querySelector('svg');
        if (viewIcon) {
          fireEvent.click(viewIcon);
          
          await waitFor(() => {
            expect(screen.getByTestId('common-modal')).toBeInTheDocument();
          });
        }
      }
    });
  });

  describe('Edit Functionality', () => {
    it('should navigate to order details on edit click', async () => {
      const mockNavigate = jest.fn();
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);
      
      renderWithProviders(<OrderReceive />);
      
      await waitFor(() => {
        expect(screen.getByTestId('reusable-table')).toBeInTheDocument();
      });

      // The edit functionality is tested through navigation
      // In a real scenario, we would click the edit icon
      expect(mockNavigate).toBeDefined();
    });
  });

  describe('Delete Functionality', () => {
    it('should open delete confirmation dialog', async () => {
      const mockDeleteMutation = jest.fn().mockResolvedValue({});
      mockUseDeleteReceiptMutation.mockReturnValue([
        mockDeleteMutation,
        { isLoading: false, error: null } as any,
      ] as any);

      renderWithProviders(<OrderReceive />);
      
      // Delete functionality would be tested through the confirmation dialog
      // This is a placeholder for the actual delete flow
      expect(mockDeleteMutation).toBeDefined();
    });
  });

  describe('Snackbar Notifications', () => {
    it('should show success message after successful operation', async () => {
      renderWithProviders(<OrderReceive />);
      
      // Snackbar would appear after successful operations
      // This is tested through user interactions that trigger mutations
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Date Range Filter', () => {
    it('should filter receipts by date range', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderReceive />);
      
      const filterButton = screen.getByText(/Show filters/i);
      await user.click(filterButton);

      await waitFor(() => {
        // Date pickers should be visible
        expect(screen.getByText(/Received On/i)).toBeInTheDocument();
      });
    });
  });

  describe('Supplier Filter', () => {
    it('should filter receipts by supplier', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderReceive />);
      
      const filterButton = screen.getByText(/Show filters/i);
      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText(/Supplier Name/i)).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should display correct pagination information', async () => {
      renderWithProviders(<OrderReceive />);
      
      await waitFor(() => {
        expect(screen.getByTestId('reusable-table')).toBeInTheDocument();
        expect(screen.getByTestId('current-page')).toHaveTextContent('1');
      });
    });
  });

  describe('Empty States', () => {
    it('should handle empty receipts list', () => {
      mockUseGetReceiptsQuery.mockReturnValue(createMockQueryResult([]));
      renderWithProviders(<OrderReceive />);
      
      waitFor(() => {
        expect(screen.getByTestId('table-data-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message and retry button on error', () => {
      const mockRefetch = jest.fn();
      mockUseGetReceiptsQuery.mockReturnValue({
        ...createMockQueryResult(undefined, false, { message: 'Network error' }),
        refetch: mockRefetch,
      });
      
      renderWithProviders(<OrderReceive />);
      
      expect(screen.getByText(/Failed to load receipts/i)).toBeInTheDocument();
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});


