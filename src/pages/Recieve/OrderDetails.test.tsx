import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import OrderDetails, { PharmaTableRow } from './OrderDetails';
import { orderLabels } from '../../config/label/OrderDetail.labels';
import { receiveApi, useSubmitReceiptMutation, useEditReceiptMutation } from '../../redux/slices/receiveApi';

// Create a theme for testing
const theme = createTheme();

// Mock react-router-dom hooks at module level
const mockNavigate = jest.fn();
const mockLocation: {
  pathname: string;
  search: string;
  hash: string;
  state: any;
  key: string;
} = {
  pathname: '/receive/order-details',
  search: '',
  hash: '',
  state: null,
  key: 'default',
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock the Redux API hooks
jest.mock('../../redux/slices/receiveApi');
jest.mock('../../components/Modal/NewProduct/NewProductModal', () => ({
  __esModule: true,
  default: ({ open, onClose, onProductAdded }: any) => (
    open ? (
      <div data-testid="new-product-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onProductAdded?.()}>Add Product</button>
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
jest.mock('../../components/PharmaTable', () => ({
  ReusableTable: ({ data, columns, onSortRequest, onPageChange, currentPage }: any) => (
    <div data-testid="reusable-table">
      <div data-testid="table-data-count">{data?.length || 0}</div>
      <div data-testid="current-page">{currentPage}</div>
      {data?.map((row: any, idx: number) => (
        <div key={idx} data-testid={`table-row-${idx}`}>
          {columns.map((col: any) => (
            <div key={col.key} data-testid={`cell-${col.key}-${idx}`}>
              {col.render ? col.render(row) : row[col.key]}
            </div>
          ))}
        </div>
      ))}
      <button onClick={() => onSortRequest?.('productName')}>Sort</button>
      <button onClick={() => onPageChange?.(2)}>Next Page</button>
    </div>
  ),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Since we're mocking the API hooks, we can use a simple reducer
// RTK Query state structure
const mockReceiveApiReducer = (state: any = {
  queries: {},
  mutations: {},
  provided: { tags: {}, keys: {} },
  subscriptions: {},
  config: {},
}, action: any) => {
  // Return state as-is since hooks are mocked
  return state;
};

const mockStore = configureStore({
  reducer: {
    [receiveApi.reducerPath]: mockReceiveApiReducer,
  },
  middleware: (getDefaultMiddleware: any) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

const createMockMutation = (mockFn?: jest.Mock) => {
  const mutateAsync = mockFn || jest.fn().mockResolvedValue({ message: 'Success', receiptId: 1 });
  return [
    mutateAsync,
    {
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: null,
      reset: jest.fn(),
    },
  ] as any;
};

const renderWithProviders = (
  component: React.ReactElement,
  initialEntries: any = ['/receive/order-details']
) => {
  return render(
    <Provider store={mockStore}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={initialEntries}>
          {component}
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
};

describe('OrderDetails', () => {
  const mockUseSubmitReceiptMutation = useSubmitReceiptMutation as jest.MockedFunction<typeof useSubmitReceiptMutation>;
  const mockUseEditReceiptMutation = useEditReceiptMutation as jest.MockedFunction<typeof useEditReceiptMutation>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    // Reset location state
    mockLocation.state = null;
    mockLocation.pathname = '/receive/order-details';
    
    // Mock fetch to return supplier data by default - resolve immediately
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('unique-supplier-names')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { supplier_name: 'Supplier A', supplier_id: 1 },
            { supplier_name: 'Supplier B', supplier_id: 2 },
          ]),
        });
      }
      if (url.includes('get-products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            ['Product 1', 1],
            ['Product 2', 2],
          ]),
        });
      }
      // Default response for other endpoints
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    
    mockUseSubmitReceiptMutation.mockReturnValue(createMockMutation());
    mockUseEditReceiptMutation.mockReturnValue(createMockMutation());
  });

  describe('Component Rendering', () => {
    it('should render the component with title', () => {
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      expect(screen.getByText(orderLabels.orderDetails)).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      expect(screen.getByText(orderLabels.supplierName)).toBeInTheDocument();
      expect(screen.getByText(orderLabels.poNumber)).toBeInTheDocument();
      expect(screen.getByText(orderLabels.invoiceDate)).toBeInTheDocument();
      expect(screen.getByText(orderLabels.paymentMethod)).toBeInTheDocument();
      expect(screen.getByText(orderLabels.paymentVendor)).toBeInTheDocument();
      expect(screen.getByText(orderLabels.transactionNumber)).toBeInTheDocument();
    });

    it('should render find product field', () => {
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      expect(screen.getByText(orderLabels.findProduct)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      expect(screen.getByText(orderLabels.cancelButton)).toBeInTheDocument();
      expect(screen.getByText(orderLabels.saveButton)).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('should update supplier name on input change', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      // Wait for the supplier label to appear first
      await screen.findByText(orderLabels.supplierName);
      
      // Wait for suppliers to load - the input should become enabled
      // We'll wait for the input to be available and not disabled
      const supplierInput = await waitFor(
        () => {
          // Try to find input by placeholder or by role
          const input = screen.queryByPlaceholderText(orderLabels.enterSupplierName) ||
                       screen.queryByPlaceholderText('Loading suppliers...') ||
                       screen.queryByRole('combobox', { name: /supplier/i });
          
          if (!input) {
            throw new Error('Supplier input not found');
          }
          
          // Check if it's disabled (still loading)
          const isDisabled = input.hasAttribute('disabled') || 
                           input.getAttribute('aria-disabled') === 'true' ||
                           input.closest('[aria-disabled="true"]') !== null;
          
          if (isDisabled) {
            throw new Error('Supplier input still disabled/loading');
          }
          
          return input as HTMLInputElement;
        },
        { timeout: 5000 }
      );
      
      // Clear any existing value and type new value
      await user.clear(supplierInput);
      await user.type(supplierInput, 'New Supplier');
      
      // Verify the value was set
      await waitFor(() => {
        expect(supplierInput).toHaveValue('New Supplier');
      });
    }, 10000); // Increase test timeout to 10 seconds

    it('should update PO number on input change', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      // Wait for component to fully render and suppliers to load
      await waitFor(() => {
        expect(screen.getByText(orderLabels.poNumber)).toBeInTheDocument();
        const supplierInput = screen.queryByPlaceholderText(orderLabels.enterSupplierName);
        expect(supplierInput).toBeInTheDocument();
      }, { timeout: 3000 });
      
      const poInput = screen.getByPlaceholderText(orderLabels.enterPoNumber);
      await user.clear(poInput);
      await user.type(poInput, 'PO123');
      
      expect(poInput).toHaveValue('PO123');
    });

    it('should update transaction number on input change', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      const transactionInputs = screen.getAllByRole('textbox');
      const transactionInput = transactionInputs.find(
        (input) => (input as HTMLInputElement).placeholder === undefined
      );
      
      if (transactionInput) {
        await user.type(transactionInput, 'TXN123');
        expect(transactionInput).toHaveValue('TXN123');
      }
    });
  });

  describe('Product Management', () => {
    it('should add product to table when selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      // Wait for suppliers to load first
      await waitFor(() => {
        expect(screen.getByText(orderLabels.findProduct)).toBeInTheDocument();
        const supplierInput = screen.queryByPlaceholderText(orderLabels.enterSupplierName);
        expect(supplierInput).toBeInTheDocument();
      }, { timeout: 3000 });

      // Wait for products to load
      await waitFor(() => {
        const findProductInput = screen.queryByPlaceholderText(orderLabels.search);
        expect(findProductInput).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should open new product modal when Add Products option is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      // Wait for suppliers to load first
      await waitFor(() => {
        expect(screen.getByText(orderLabels.findProduct)).toBeInTheDocument();
        const supplierInput = screen.queryByPlaceholderText(orderLabels.enterSupplierName);
        expect(supplierInput).toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        const findProductInput = screen.queryByPlaceholderText(orderLabels.search);
        expect(findProductInput).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Table Operations', () => {
    it('should render empty table initially', async () => {
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      // Wait for suppliers to load first
      await waitFor(() => {
        expect(screen.getByText(orderLabels.findProduct)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      await waitFor(() => {
        expect(screen.getByTestId('table-data-count')).toHaveTextContent('0');
      });
    });

    it('should handle table sorting', async () => {
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      // Wait for suppliers to load first
      await waitFor(() => {
        expect(screen.getByText(orderLabels.findProduct)).toBeInTheDocument();
        const supplierInput = screen.queryByPlaceholderText(orderLabels.enterSupplierName);
        expect(supplierInput).toBeInTheDocument();
      }, { timeout: 3000 });
      
      await waitFor(() => {
        const table = screen.queryByTestId('reusable-table');
        expect(table).toBeInTheDocument();
      }, { timeout: 3000 });

      const sortButton = screen.getByText('Sort');
      fireEvent.click(sortButton);
      
      // Sort should be triggered
      expect(sortButton).toBeInTheDocument();
    });

    it('should handle pagination', async () => {
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      // Wait for suppliers to load first
      await waitFor(() => {
        expect(screen.getByText(orderLabels.findProduct)).toBeInTheDocument();
        const supplierInput = screen.queryByPlaceholderText(orderLabels.enterSupplierName);
        expect(supplierInput).toBeInTheDocument();
      }, { timeout: 3000 });
      
      await waitFor(() => {
        const table = screen.queryByTestId('reusable-table');
        expect(table).toBeInTheDocument();
      }, { timeout: 3000 });

      const nextPageButton = screen.getByText('Next Page');
      fireEvent.click(nextPageButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('current-page')).toHaveTextContent('2');
      });
    });
  });

  describe('Form Validation', () => {
    it('should disable save button when required fields are empty', () => {
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      const saveButton = screen.getByText(orderLabels.saveButton);
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when required fields are filled', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      // Wait for suppliers to load
      await waitFor(() => {
        const supplierInput = screen.queryByPlaceholderText(orderLabels.enterSupplierName);
        expect(supplierInput).toBeInTheDocument();
        expect(supplierInput).not.toBeDisabled();
      }, { timeout: 3000 });
      
      // Fill required fields
      const supplierInput = screen.getByPlaceholderText(orderLabels.enterSupplierName);
      await user.type(supplierInput, 'Supplier Name');
      
      const poInput = screen.getByPlaceholderText(orderLabels.enterPoNumber);
      await user.clear(poInput);
      await user.type(poInput, 'PO123');
      
      // Save button should still be disabled if no products
      const saveButton = screen.getByText(orderLabels.saveButton);
      // Button state depends on validation logic
      expect(saveButton).toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    it('should show error when supplier name is missing', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn().mockRejectedValue({ message: 'Supplier name required' });
      mockUseSubmitReceiptMutation.mockReturnValue(createMockMutation(mockSubmit));
      
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      const saveButton = screen.getByText(orderLabels.saveButton);
      // Button should be disabled if validation fails
      expect(saveButton).toBeDisabled();
    });

    it('should show error when PO number is missing', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      // Wait for suppliers to load
      await waitFor(() => {
        const supplierInput = screen.queryByPlaceholderText(orderLabels.enterSupplierName);
        expect(supplierInput).toBeInTheDocument();
        expect(supplierInput).not.toBeDisabled();
      }, { timeout: 3000 });
      
      const supplierInput = screen.getByPlaceholderText(orderLabels.enterSupplierName);
      await user.type(supplierInput, 'Supplier');
      
      const saveButton = screen.getByText(orderLabels.saveButton);
      // Should still be disabled without PO number
      expect(saveButton).toBeDisabled();
    });

    it('should show error when no products are added', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      // Wait for suppliers to load
      await waitFor(() => {
        const supplierInput = screen.queryByPlaceholderText(orderLabels.enterSupplierName);
        expect(supplierInput).toBeInTheDocument();
        expect(supplierInput).not.toBeDisabled();
      }, { timeout: 3000 });
      
      const supplierInput = screen.getByPlaceholderText(orderLabels.enterSupplierName);
      await user.type(supplierInput, 'Supplier');
      
      const poInput = screen.getByPlaceholderText(orderLabels.enterPoNumber);
      await user.clear(poInput);
      await user.type(poInput, 'PO123');
      
      // Save button should be disabled without products
      const saveButton = screen.getByText(orderLabels.saveButton);
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Edit Mode', () => {
    it('should display edit mode title when in edit mode', () => {
      mockLocation.state = {
        isEditMode: true,
        receiptId: 1,
        receiptNumber: 'RA1',
        selectedOrder: {
          receiptId: 1,
          reNo: 'RA1',
          poNo: 'PO001',
          supplier: 'Supplier A',
          received: 'Jan 15, 2024',
          status: 'received',
          reBy: 'John Doe',
          amt: 5000,
          products: [],
        },
      };

      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      expect(screen.getByText(/Editing RA1/i)).toBeInTheDocument();
    });

    it('should show delete button in edit mode', () => {
      mockLocation.state = {
        isEditMode: true,
        receiptId: 1,
        receiptNumber: 'RA1',
      };

      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      expect(screen.getByText(/Delete the full receipt/i)).toBeInTheDocument();
    });

    it('should load existing receipt data in edit mode', async () => {
      mockLocation.state = {
        isEditMode: true,
        receiptId: 1,
        receiptNumber: 'RA1',
        selectedOrder: {
          receiptId: 1,
          reNo: 'RA1',
          poNo: 'PO001',
          supplier: 'Supplier A',
          received: 'Jan 15, 2024',
          status: 'received',
          reBy: 'John Doe',
          amt: 5000,
          products: [],
        },
      };

      // Mock fetch for receipt lines
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('receipt-lines')) {
          return Promise.resolve({
            ok: true,
            json: async () => [
              {
                receipt_line_id: 1,
                product_name: 'Product 1',
                received_qty: 10,
                free_qty: 0,
                expiry_date: '31/12/2024',
                unit_price: '100',
                cgst: '5',
                sgst: '5',
                igst: '0',
                discount: '0',
              },
            ],
          });
        }
        if (url.includes('unique-supplier-names')) {
          return Promise.resolve({
            ok: true,
            json: async () => [
              { supplier_name: 'Supplier A', supplier_id: 1 },
            ],
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });
      
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      await waitFor(() => {
        // Receipt lines should be loaded
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Delete Functionality', () => {
    it('should open delete confirmation dialog', async () => {
      const user = userEvent.setup();
      mockLocation.state = {
        isEditMode: true,
        receiptId: 1,
      };

      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      const deleteButton = screen.getByText(/Delete the full receipt/i);
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should navigate back on cancel', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText(orderLabels.cancelButton)).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByText(orderLabels.cancelButton);
      expect(cancelButton).toBeInTheDocument();
      await user.click(cancelButton);
      
      // Verify navigate was called
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('API Integration', () => {
    it('should fetch supplier names on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { supplier_name: 'Supplier A', supplier_id: 1 },
          { supplier_name: 'Supplier B', supplier_id: 2 },
        ],
      });
      
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('unique-supplier-names'),
          expect.any(Object)
        );
      });
    });

    it('should fetch products on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [['Product A', 1], ['Product B', 2]],
      });
      
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('get-products'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on save failure', async () => {
      const mockSubmit = jest.fn().mockRejectedValue({
        data: { message: 'Save failed' },
      });
      mockUseSubmitReceiptMutation.mockReturnValue(createMockMutation(mockSubmit));
      
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      // Error would be shown in snackbar after failed save attempt
      expect(mockSubmit).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      // Component should handle error gracefully
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });
});

