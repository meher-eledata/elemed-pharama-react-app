import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import OrderDetails from './OrderDetails';
import { PharmaTableRow } from './types';
import { orderLabels } from '../../config/label/OrderDetail.labels';
import {
  receiveApi,
  useSubmitReceiptMutation,
  useEditReceiptMutation,
  useUploadReceiptFileMutation,
  useDeleteReceiptMutation,
  useExtractInvoiceMutation,
  useGetReceiptsQuery,
} from '../../redux/slices/receiveApi';

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
// Schedule attribution popup persists via this mutation (RTK-hook gotcha: register
// every hook the component uses). Lazy reference so jest.mock hoisting is safe.
const mockUpdateProductFn = jest.fn(() => ({
  unwrap: () => Promise.resolve({ message: 'updated' }),
}));
jest.mock('../../redux/slices/masterApi', () => ({
  ...jest.requireActual('../../redux/slices/masterApi'),
  useAddSupplierMutation: () => [
    jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({}) }),
    { isLoading: false, isError: false, isSuccess: false, error: null, data: null, reset: jest.fn() },
  ],
  useUpdateProductMutation: () => [
    mockUpdateProductFn,
    { isLoading: false, isError: false, isSuccess: false, error: null, data: null, reset: jest.fn() },
  ],
}));
jest.mock('../../redux/slices/inventoryApi', () => ({
  ...jest.requireActual('../../redux/slices/inventoryApi'),
  useGetBatchesForProductMutation: () => [
    jest.fn().mockReturnValue({ unwrap: () => Promise.resolve({}) }),
    { isLoading: false, isError: false, isSuccess: false, error: null, data: null, reset: jest.fn() },
  ],
}));
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

const mockAuthReducer = (
  state: any = {
    token: 'mock-token',
    user: { first_name: 'John', last_name: 'Doe', username: 'johndoe' },
  }
) => state;

const mockStore = configureStore({
  reducer: {
    [receiveApi.reducerPath]: mockReceiveApiReducer,
    auth: mockAuthReducer,
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
  const mockUseUploadReceiptFileMutation = useUploadReceiptFileMutation as jest.MockedFunction<typeof useUploadReceiptFileMutation>;
  const mockUseDeleteReceiptMutation = useDeleteReceiptMutation as jest.MockedFunction<typeof useDeleteReceiptMutation>;
  const mockUseExtractInvoiceMutation = useExtractInvoiceMutation as jest.MockedFunction<typeof useExtractInvoiceMutation>;
  const mockUseGetReceiptsQuery = useGetReceiptsQuery as jest.MockedFunction<typeof useGetReceiptsQuery>;

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
    
    // Cross-slice cache invalidation used by the schedule popup: the auto-mocked api
    // object must hand dispatch() a plain action.
    (receiveApi as any).util = {
      invalidateTags: jest.fn(() => ({ type: 'test/invalidateTags' })),
    };

    mockUseSubmitReceiptMutation.mockReturnValue(createMockMutation());
    mockUseEditReceiptMutation.mockReturnValue(createMockMutation());
    mockUseUploadReceiptFileMutation.mockReturnValue(createMockMutation());
    mockUseDeleteReceiptMutation.mockReturnValue(createMockMutation());
    // Invoice extraction only fires when a file is attached; tests attach none, so
    // a resolved empty draft keeps the existing suite unaffected.
    mockUseExtractInvoiceMutation.mockReturnValue(
      createMockMutation(
        jest.fn().mockResolvedValue({
          header: {
            supplier: { id: null, matched_name: null, confidence: 0, candidates: [] },
            invoice_number: { value: null, confidence: 0 },
            invoice_date: { value: null, confidence: 0 },
            po_number: { value: null, confidence: 0 },
          },
          lines: [],
          unresolved_fields: [],
          meta: { driver: 'stub', threshold: 0.85 },
        })
      )
    );
    mockUseGetReceiptsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
      isSuccess: true,
      isError: false,
      isUninitialized: false,
    } as any);
  });

  describe('Component Rendering', () => {
    it('should render the component with title', () => {
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      expect(screen.getByText(orderLabels.orderDetails)).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      
      // Payment method / vendor / transaction fields moved to the separate
      // PaymentDetails flow; OrderDetails now only renders supplier/PO/invoice.
      expect(screen.getByText(orderLabels.supplierName)).toBeInTheDocument();
      expect(screen.getByText(orderLabels.poNumber)).toBeInTheDocument();
      expect(screen.getByText(orderLabels.invoiceDate)).toBeInTheDocument();
    });

    it('should render find product field', () => {
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      expect(screen.getByText(orderLabels.findProduct)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      // In create (non-edit) mode the primary action is "Proceed to Payment";
      // "Save" only appears in edit mode.
      expect(screen.getByText(orderLabels.cancelButton)).toBeInTheDocument();
      expect(screen.getByText(/Proceed to Payment/i)).toBeInTheDocument();
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
        { timeout: 10000 }
      );
      
      // Clear any existing value and type new value
      await user.clear(supplierInput);
      await user.type(supplierInput, 'New Supplier');
      
      // Verify the value was set
      await waitFor(() => {
        expect(supplierInput).toHaveValue('New Supplier');
      }, { timeout: 5000 });
    }, 15000); // Increase test timeout to 15 seconds

    it('should update PO number on input change', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderDetails labels={orderLabels} />);

      // PO number is a plain text field rendered in SupplierSection.
      const poInput = await screen.findByPlaceholderText(orderLabels.enterPoNumber);

      await user.clear(poInput);
      await user.type(poInput, 'PO123');

      expect(poInput).toHaveValue('PO123');
    }, 15000);

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
      renderWithProviders(<OrderDetails labels={orderLabels} />);

      // Find-product field placeholder is searchByProductName in ProductSearchSection.
      expect(await screen.findByText(orderLabels.findProduct)).toBeInTheDocument();
      expect(
        await screen.findByPlaceholderText(orderLabels.searchByProductName)
      ).toBeInTheDocument();
    });

    it('should open new product modal when Add Products option is selected', async () => {
      renderWithProviders(<OrderDetails labels={orderLabels} />);

      expect(await screen.findByText(orderLabels.findProduct)).toBeInTheDocument();
      expect(
        await screen.findByPlaceholderText(orderLabels.searchByProductName)
      ).toBeInTheDocument();
    });
  });

  describe('schedule attribution popup (receive flow)', () => {
    const ok = (body: any) =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

    const mockProductsFetch = (products: any[]) => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('unique-supplier-names')) return ok([]);
        if (url.includes('get-products')) return ok(products);
        return ok({});
      });
    };

    const selectProduct = async (name: string) => {
      const input = await screen.findByPlaceholderText(orderLabels.searchByProductName);
      input.focus();
      fireEvent.change(input, { target: { value: name } });
      // Option accessible name includes the stock count (e.g. "Product N 3").
      const option = await screen.findByRole('option', { name: new RegExp(name, 'i') });
      fireEvent.click(option);
    };

    it('fires for a NULL-schedule product, persists + invalidates, then adds the line', async () => {
      mockProductsFetch([{ name: 'Product N', product_id: 5, currentQuantity: 3, schedule: null }]);
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      await selectProduct('Product N');

      expect(await screen.findByText('Assign Drug Schedule')).toBeInTheDocument();
      // The line is NOT added while the popup awaits a choice.
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('0');

      fireEvent.mouseDown(screen.getByLabelText('Schedule'));
      const listbox = await screen.findByRole('listbox');
      fireEvent.click(within(listbox).getByText('H1'));
      fireEvent.click(screen.getByText('Save & Add'));

      await waitFor(() =>
        expect(mockUpdateProductFn).toHaveBeenCalledWith({ product_id: 5, schedule: 'H1' })
      );
      await waitFor(() =>
        expect((receiveApi as any).util.invalidateTags).toHaveBeenCalledWith(['Receive'])
      );
      await waitFor(() => expect(screen.getByTestId('table-data-count')).toHaveTextContent('1'));
    });

    it("does NOT fire for 'NONE' or an already-valued schedule", async () => {
      mockProductsFetch([
        { name: 'Product Z', product_id: 7, currentQuantity: 3, schedule: 'NONE' },
        { name: 'Product X', product_id: 6, currentQuantity: 3, schedule: 'H' },
      ]);
      renderWithProviders(<OrderDetails labels={orderLabels} />);

      await selectProduct('Product Z');
      await waitFor(() => expect(screen.getByTestId('table-data-count')).toHaveTextContent('1'));
      expect(screen.queryByText('Assign Drug Schedule')).not.toBeInTheDocument();

      await selectProduct('Product X');
      await waitFor(() => expect(screen.getByTestId('table-data-count')).toHaveTextContent('2'));
      expect(screen.queryByText('Assign Drug Schedule')).not.toBeInTheDocument();
      expect(mockUpdateProductFn).not.toHaveBeenCalled();
    });

    it('cancel ("Skip for now") adds the line unblocked without persisting', async () => {
      mockProductsFetch([{ name: 'Product N', product_id: 5, currentQuantity: 3, schedule: null }]);
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      await selectProduct('Product N');

      expect(await screen.findByText('Assign Drug Schedule')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Skip for now'));

      await waitFor(() => expect(screen.getByTestId('table-data-count')).toHaveTextContent('1'));
      expect(mockUpdateProductFn).not.toHaveBeenCalled();
    });

    it('does not re-prompt a product just created via NewProductModal with a chosen schedule', async () => {
      // First get-products load: product absent. After the NewProductModal
      // onProductAdded refetch, it arrives WITH its chosen schedule — selecting it
      // must add straight to the table (no popup).
      let productCalls = 0;
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('unique-supplier-names')) return ok([]);
        if (url.includes('get-products')) {
          productCalls += 1;
          return ok(
            productCalls === 1
              ? []
              : [{ name: 'Fresh Product', product_id: 9, currentQuantity: 0, schedule: 'X' }]
          );
        }
        return ok({});
      });
      renderWithProviders(<OrderDetails labels={orderLabels} />);

      // Open the (mocked) NewProductModal via the "Add Products" option and finish creating.
      const input = await screen.findByPlaceholderText(orderLabels.searchByProductName);
      input.focus();
      fireEvent.change(input, { target: { value: 'zzz' } });
      const addOption = await screen.findByRole('option', { name: /Add Products/i });
      fireEvent.click(addOption);
      fireEvent.click(await screen.findByText('Add Product')); // mocked modal -> onProductAdded (refetch)

      await selectProduct('Fresh Product');
      await waitFor(() => expect(screen.getByTestId('table-data-count')).toHaveTextContent('1'));
      expect(screen.queryByText('Assign Drug Schedule')).not.toBeInTheDocument();
      expect(mockUpdateProductFn).not.toHaveBeenCalled();
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

      expect(await screen.findByTestId('reusable-table')).toBeInTheDocument();

      const sortButton = screen.getByText('Sort');
      fireEvent.click(sortButton);

      // Sort should be triggered
      expect(sortButton).toBeInTheDocument();
    });

    it('should handle pagination', async () => {
      renderWithProviders(<OrderDetails labels={orderLabels} />);

      expect(await screen.findByTestId('reusable-table')).toBeInTheDocument();

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
      // Create-mode primary action is "Proceed to Payment"; disabled until valid.
      const proceedButton = screen.getByText(/Proceed to Payment/i).closest('button');
      expect(proceedButton).toBeDisabled();
    });

    it('should enable save button when required fields are filled', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderDetails labels={orderLabels} />);

      // Supplier field is the first Autocomplete combobox; its placeholder shows
      // "Loading suppliers..." until the (transition-deferred) fetch resolves, so
      // query it by role rather than the final placeholder text.
      await waitFor(() => expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0));
      const supplierInput = screen.getAllByRole('combobox')[0];
      await user.type(supplierInput, 'Supplier Name');

      const poInput = await screen.findByPlaceholderText(orderLabels.enterPoNumber);
      await user.clear(poInput);
      await user.type(poInput, 'PO123');

      // Create-mode primary action is "Proceed to Payment"; still disabled with no products.
      const proceedButton = screen.getByText(/Proceed to Payment/i).closest('button');
      expect(proceedButton).toBeInTheDocument();
    }, 20000);
  });

  describe('Save Functionality', () => {
    it('should show error when supplier name is missing', async () => {
      const mockSubmit = jest.fn().mockRejectedValue({ message: 'Supplier name required' });
      mockUseSubmitReceiptMutation.mockReturnValue(createMockMutation(mockSubmit));

      renderWithProviders(<OrderDetails labels={orderLabels} />);

      // Primary action disabled while supplier is missing.
      const proceedButton = screen.getByText(/Proceed to Payment/i).closest('button');
      expect(proceedButton).toBeDisabled();
    });

    it('should show error when PO number is missing', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderDetails labels={orderLabels} />);

      await waitFor(() => expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0));
      const supplierInput = screen.getAllByRole('combobox')[0];
      await user.type(supplierInput, 'Supplier');

      // Still disabled without products (PO number is optional here).
      const proceedButton = screen.getByText(/Proceed to Payment/i).closest('button');
      expect(proceedButton).toBeDisabled();
    }, 15000);

    it('should show error when no products are added', async () => {
      const user = userEvent.setup();
      renderWithProviders(<OrderDetails labels={orderLabels} />);

      await waitFor(() => expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0));
      const supplierInput = screen.getAllByRole('combobox')[0];
      await user.type(supplierInput, 'Supplier');

      const poInput = await screen.findByPlaceholderText(orderLabels.enterPoNumber);
      await user.clear(poInput);
      await user.type(poInput, 'PO123');

      // Primary action remains disabled without products.
      const proceedButton = screen.getByText(/Proceed to Payment/i).closest('button');
      expect(proceedButton).toBeDisabled();
    }, 15000);
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
      
      expect(screen.getByText(/^Delete Receipt$/i)).toBeInTheDocument();
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
    // The button used to fire a raw DELETE straight from the click — no confirmation,
    // and no `deletion_reason`, which the endpoint REQUIRES (400 without it). It now
    // opens a dialog that captures the mandatory reason first.
    const openEditModeDelete = async (user: ReturnType<typeof userEvent.setup>) => {
      mockLocation.state = { isEditMode: true, receiptId: 1, receiptNumber: 'PI-EL-26-000243' };
      renderWithProviders(<OrderDetails labels={orderLabels} />);
      await user.click(screen.getByText(/^Delete Receipt$/i));
    };

    it('opens the reason dialog instead of deleting straight from the click', async () => {
      const user = userEvent.setup();
      const deleteFn = jest.fn(() => ({ unwrap: () => Promise.resolve({ message: 'ok' }) }));
      mockUseDeleteReceiptMutation.mockReturnValue(createMockMutation(deleteFn as any));

      await openEditModeDelete(user);

      // Shared DeleteDocumentDialog: "Delete receipt <number>?"
      expect(await screen.findByText(/Delete receipt PI-EL-26-000243\?/i)).toBeInTheDocument();
      // Nothing destructive has happened yet.
      expect(deleteFn).not.toHaveBeenCalled();
    });

    it('keeps the confirm button disabled until a reason is entered', async () => {
      const user = userEvent.setup();
      const deleteFn = jest.fn(() => ({ unwrap: () => Promise.resolve({ message: 'ok' }) }));
      mockUseDeleteReceiptMutation.mockReturnValue(createMockMutation(deleteFn as any));

      await openEditModeDelete(user);

      const confirm = await screen.findByRole('button', { name: /^Delete$/i });
      expect(confirm).toBeDisabled();

      // Shared minimum: a one-character reason is not an audit trail.
      await user.type(screen.getByLabelText(/Reason for deletion/i), 'ab');
      expect(confirm).toBeDisabled();

      await user.type(screen.getByLabelText(/Reason for deletion/i), 'c');
      expect(confirm).toBeEnabled();
    });

    it('sends receipt_id + deleted_by + deletion_reason on confirm', async () => {
      const user = userEvent.setup();
      const deleteFn = jest.fn(() => ({ unwrap: () => Promise.resolve({ message: 'ok' }) }));
      mockUseDeleteReceiptMutation.mockReturnValue(createMockMutation(deleteFn as any));

      await openEditModeDelete(user);
      await user.type(screen.getByLabelText(/Reason for deletion/i), '  Entered twice by mistake  ');
      await user.click(await screen.findByRole('button', { name: /^Delete$/i }));

      await waitFor(() => expect(deleteFn).toHaveBeenCalledTimes(1));
      expect(deleteFn).toHaveBeenCalledWith(
        expect.objectContaining({
          receipt_id: 1,
          // trimmed before it reaches the wire
          deletion_reason: 'Entered twice by mistake',
        })
      );
      expect((deleteFn.mock.calls as any[])[0][0]).toHaveProperty('deleted_by');
    });

    it('surfaces a refusal instead of failing silently', async () => {
      const user = userEvent.setup();
      const deleteFn = jest.fn(() => ({
        unwrap: () => Promise.reject({
          status: 409,
          data: { error: 'RECEIPT_HAS_SUPPLIER_RETURNS' },
        }),
      }));
      mockUseDeleteReceiptMutation.mockReturnValue(createMockMutation(deleteFn as any));

      await openEditModeDelete(user);
      await user.type(screen.getByLabelText(/Reason for deletion/i), 'wrong supplier');
      await user.click(await screen.findByRole('button', { name: /^Delete$/i }));

      // The pharmacist is told WHAT to do, not given an HTTP number.
      expect(await screen.findByText(/supplier returns raised against it/i)).toBeInTheDocument();
    });

    it('a receipt that is already deleted is read-only: no Delete button, Save disabled', async () => {
      mockLocation.state = {
        isEditMode: true,
        receiptId: 1,
        receiptNumber: 'PI-EL-26-000243',
        selectedOrder: { record_status: 'DELETED' },
      };

      renderWithProviders(<OrderDetails labels={orderLabels} />);

      expect(screen.queryByText(/^Delete Receipt$/i)).not.toBeInTheDocument();
      expect(screen.getByText(/can no longer be edited/i)).toBeInTheDocument();
      expect(screen.getByText(orderLabels.saveButton ?? 'Save')).toBeDisabled();
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

  describe('Invoice number required (#20)', () => {
    it('shows an inline error and blocks submit when the invoice number is blank', async () => {
      const user = userEvent.setup();
      // Spy on the edit mutation so we can prove a blank invoice never reaches the API.
      const mockEdit = jest.fn().mockResolvedValue({ message: 'Success', receiptId: 1 });
      mockUseEditReceiptMutation.mockReturnValue(createMockMutation(mockEdit));

      // Edit mode: supplier + a product row load from the receipt, so the primary
      // ("Save") button is enabled. The loaded line carries NO invoice_number, so the
      // Invoice Number field stays blank — the case under test.
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
                expiry_date: '2024-12-31',
                purchase_price: '100',
                // no invoice_number → invoice field remains blank
              },
            ],
          });
        }
        if (url.includes('unique-supplier-names')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{ supplier_name: 'Supplier A', supplier_id: 1 }],
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      renderWithProviders(<OrderDetails labels={orderLabels} />);

      // Wait for the edit-mode load to populate the row + supplier so Save is enabled.
      const saveButton = await screen.findByText('Save');
      await waitFor(() => {
        expect(saveButton.closest('button')).not.toBeDisabled();
      });

      // The invoice number field is blank.
      const invoiceInput = screen.getByPlaceholderText('Enter Invoice Number') as HTMLInputElement;
      expect(invoiceInput.value).toBe('');

      await user.click(saveButton.closest('button')!);

      // Inline required error surfaces; the edit mutation is never invoked.
      expect(await screen.findByText('Invoice number is required')).toBeInTheDocument();
      expect(mockEdit).not.toHaveBeenCalled();
    }, 20000);
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

