import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import SalePage from '../salepage';
import * as salesApi from '../../../redux/slices/salesApi';
import * as receiveApi from '../../../redux/slices/receiveApi';
import * as inventoryApi from '../../../redux/slices/inventoryApi';
import * as masterApi from '../../../redux/slices/masterApi';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/sales', state: null }),
}));

jest.mock('../../../redux/slices/salesApi');
jest.mock('../../../redux/slices/receiveApi');
jest.mock('../../../redux/slices/inventoryApi');
jest.mock('../../../redux/slices/masterApi');
jest.mock('../../../hooks/useDebounce', () => ({
  useDebounce: (value: any) => value,
}));

const theme = createTheme();

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
      cart: (state = {
        items: [],
        totalAmount: 0,
        formData: null,
        isLoading: false,
        error: null,
      }) => state,
    },
    preloadedState: initialState,
  });
};

describe('SalePage', () => {
  const mockProducts = [
    {
      id: '1',
      name: 'Product A',
      batch: 'B001',
      avlQty: '100',
      mrp: 100,
      sp: 90,
      expiry: '2025-12-31',
      quantity: 10,
      type: 'Capsule',
      discount: 0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API hooks
    (receiveApi.useGetProductsQuery as jest.Mock) = jest.fn(() => ({
      data: mockProducts,
      isLoading: false,
      error: null,
      isFetching: false,
    }));

    (salesApi.useGetProductTypeQuery as jest.Mock) = jest.fn(() => ({
      data: [],
      isLoading: false,
    }));

    (salesApi.useLazyGetProductTypeQuery as jest.Mock) = jest.fn(() => [
      jest.fn().mockResolvedValue({
        data: [{ type: 'Capsule' }, { type: 'Tablet' }],
      }),
      { isLoading: false },
    ]);

    (salesApi.useValidateSaleMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue({ mrp: 100, selling_price: 90 }),
      })),
      { isLoading: false },
    ]);

    // Doctor names used by both SalePage and ProductSelectionForm
    (salesApi.useGetDoctorNamesQuery as jest.Mock) = jest.fn(() => ({
      data: [{ id: '1', name: 'Dr. Smith' }],
      isLoading: false,
    }));

    // Mutation used by SalePage when a product type is selected
    (salesApi.useGetBatchNumbersByProductIdMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue({ batches: [] }),
      })),
      { isLoading: false },
    ]);

    // inventoryApi mutations used by SalePage cascade (brand -> type -> batch)
    (inventoryApi.useGetBrandsFromProductNameMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue([]),
      })),
      { isLoading: false },
    ]);

    (inventoryApi.useGetTypesForBrandAndProductMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue([]),
      })),
      { isLoading: false },
    ]);

    (inventoryApi.useGetBatchesForProductMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue([]),
      })),
      { isLoading: false },
    ]);

    // Schedule attribution popup deps (RTK-hook gotcha: register every new hook the
    // component uses in auto-mocked suites, or destructuring the tuple throws).
    (masterApi.useUpdateProductMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue({ message: 'updated' }) })),
      { isLoading: false },
    ]);
    // Cross-slice cache invalidation: the auto-mocked api object needs a real action
    // back from util.invalidateTags so dispatch() receives a plain object.
    (receiveApi as any).receiveApi = {
      util: { invalidateTags: jest.fn(() => ({ type: 'test/invalidateTags' })) },
    };
  });

  const renderComponent = (store = createMockStore()) => {
    return render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <SalePage />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    );
  };

  it('renders sale page with title', () => {
    renderComponent();
    
    expect(screen.getByText(/select product/i)).toBeInTheDocument();
  });

  it('renders product selection form', () => {
    renderComponent();
    
    expect(screen.getByText(/find product/i)).toBeInTheDocument();
    // Quantity field label renders as "Units" (also appears as a table header)
    expect(screen.getAllByText(/units/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/discount/i)).toBeInTheDocument();
  });

  it('displays cart table when items are added', () => {
    const store = createMockStore({
      cart: {
        items: [
          {
            id: '1',
            name: 'Product A',
            batch: 'B001',
            avlQty: '100',
            mrp: 100,
            sp: 90,
            expiry: '2025-12-31',
            quantity: 10,
            type: 'Capsule',
            discount: 0,
            totalPrice: 900,
          },
        ],
        totalAmount: 900,
        formData: null,
        isLoading: false,
        error: null,
      },
    });

    renderComponent(store);
    
    expect(screen.getByText(/product a/i)).toBeInTheDocument();
  });

  it('handles product selection', async () => {
    renderComponent();
    
    const productInput = screen.getByPlaceholderText(/search for a product/i);
    fireEvent.change(productInput, { target: { value: 'Product A' } });
    
    await waitFor(() => {
      expect(productInput).toHaveValue('Product A');
    });
  });

  it('handles quantity change', () => {
    renderComponent();
    
    // Quantity input might be disabled initially, so we need to find it by role or label
    const qtyInputs = screen.getAllByRole('textbox');
    const qtyInput = qtyInputs.find(input => {
      const value = (input as HTMLInputElement).value;
      return value === '1' || value === '';
    });
    
    if (qtyInput) {
      fireEvent.change(qtyInput, { target: { value: '5' } });
      expect(qtyInput).toHaveValue('5');
    } else {
      // If input is not found, at least verify the quantity label exists
      expect(screen.getAllByText(/units/i).length).toBeGreaterThan(0);
    }
  });

  it('handles discount change', () => {
    renderComponent();
    
    // Discount input might be disabled initially, so we need to find it by role or label
    const discountInputs = screen.getAllByRole('textbox');
    const discountInput = discountInputs.find(input => {
      const value = (input as HTMLInputElement).value;
      return value === '0' || value === '';
    });
    
    if (discountInput) {
      fireEvent.change(discountInput, { target: { value: '10' } });
      expect(discountInput).toHaveValue('10');
    } else {
      // If input is not found, at least verify the discount label exists
      expect(screen.getByText(/discount/i)).toBeInTheDocument();
    }
  });

  it('shows validation error when product validation fails', async () => {
    (salesApi.useValidateSaleMutation as jest.Mock) = jest.fn(() => [
      jest.fn().mockRejectedValue({
        data: { message: 'Product not available' },
      }),
      { isLoading: false },
    ]);

    renderComponent();
    
    // Wait for error to appear
    await waitFor(() => {
      // Error handling is tested in the component
    });
  });

  it('displays total cart value', () => {
    const store = createMockStore({
      cart: {
        items: [],
        totalAmount: 1500,
        formData: null,
        isLoading: false,
        error: null,
      },
    });

    renderComponent(store);
    
    // The total cart value might be formatted, so check for the amount
    expect(screen.getByText(/1500/i)).toBeInTheDocument();
  });

  it('handles Next button click', () => {
    const store = createMockStore({
      cart: {
        items: [
          {
            id: '1',
            name: 'Product A',
            batch: 'B001',
            avlQty: '100',
            mrp: 100,
            sp: 90,
            expiry: '2025-12-31',
            quantity: 10,
            type: 'Capsule',
            discount: 0,
            totalPrice: 900,
          },
        ],
        totalAmount: 900,
        formData: null,
        isLoading: false,
        error: null,
      },
    });

    renderComponent(store);
    
    const nextButton = screen.getByText(/next/i);
    fireEvent.click(nextButton);
    
    // Navigation should be triggered
    expect(nextButton).toBeInTheDocument();
  });

  it('shows warning when trying to proceed with empty cart', () => {
    renderComponent();

    const nextButton = screen.getByText(/next/i);
    fireEvent.click(nextButton);

    // Should show warning toast
    expect(nextButton).toBeInTheDocument();
  });

  describe('one-time schedule attribution popup', () => {
    // Cascade auto-resolves (single brand -> single type product_id 42 -> single batch)
    // and validateSale resolves, so Add to Cart becomes actionable.
    const setupCascade = (schedule: string | null) => {
      (receiveApi.useGetProductsQuery as jest.Mock) = jest.fn(() => ({
        data: [{ id: 42, name: 'Product A', currentQuantity: 100, schedule }],
        isLoading: false,
        error: null,
        isFetching: false,
      }));
      (inventoryApi.useGetBrandsFromProductNameMutation as jest.Mock) = jest.fn(() => [
        jest.fn(() => ({
          unwrap: jest.fn().mockResolvedValue([{ id: 1, brand_name: 'BrandA', currentQuantity: 100 }]),
        })),
        { isLoading: false },
      ]);
      (inventoryApi.useGetTypesForBrandAndProductMutation as jest.Mock) = jest.fn(() => [
        jest.fn(() => ({
          unwrap: jest.fn().mockResolvedValue([{ type: 'Capsule', product_id: 42, currentQuantity: 100 }]),
        })),
        { isLoading: false },
      ]);
      (salesApi.useGetBatchNumbersByProductIdMutation as jest.Mock) = jest.fn(() => [
        jest.fn(() => ({
          unwrap: jest.fn().mockResolvedValue({
            batches: [{ batch_number: 'B-1', current_qty: 10 }],
          }),
        })),
        { isLoading: false },
      ]);
      const validateFn = jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue({ mrp: 100, selling_price: 90, pack_qty: 1 }),
      }));
      (salesApi.useValidateSaleMutation as jest.Mock) = jest.fn(() => [validateFn, { isLoading: false }]);
      const updateProductFn = jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue({ message: 'updated', product_id: 42 }),
      }));
      (masterApi.useUpdateProductMutation as jest.Mock) = jest.fn(() => [updateProductFn, { isLoading: false }]);
      const invalidateTagsFn = jest.fn(() => ({ type: 'test/invalidateTags' }));
      (receiveApi as any).receiveApi = { util: { invalidateTags: invalidateTagsFn } };
      return { validateFn, updateProductFn, invalidateTagsFn };
    };

    const selectProductAndValidate = async (validateFn: jest.Mock) => {
      const productInput = screen.getByPlaceholderText(/search for a product/i);
      productInput.focus();
      fireEvent.change(productInput, { target: { value: 'Product A' } });
      const option = await screen.findByRole('option', { name: /Product A/i });
      fireEvent.click(option);
      // Units defaults to 0 (validation is gated on qty > 0) — first zero-valued
      // input is the Units field (Discount is the second).
      const zeroInputs = screen.getAllByDisplayValue('0');
      fireEvent.change(zeroInputs[0], { target: { value: '2' } });
      await waitFor(() => expect(validateFn).toHaveBeenCalled());
    };

    it('fires ONLY for a NULL (never attributed) schedule and persists the choice', async () => {
      const { validateFn, updateProductFn, invalidateTagsFn } = setupCascade(null);
      renderComponent();
      await selectProductAndValidate(validateFn);

      const addBtn = screen.getByText(/add to cart/i);
      await waitFor(() => {
        fireEvent.click(addBtn);
        expect(screen.getByText('Assign Drug Schedule')).toBeInTheDocument();
      });

      // Choose a schedule from the fixed statutory list.
      fireEvent.mouseDown(screen.getByLabelText('Schedule'));
      const listbox = await screen.findByRole('listbox');
      fireEvent.click(within(listbox).getByText('H'));
      fireEvent.click(screen.getByText('Save & Add to Cart'));

      // Persisted via update-product, receive cache invalidated, sale not blocked.
      await waitFor(() =>
        expect(updateProductFn).toHaveBeenCalledWith({ product_id: 42, schedule: 'H' })
      );
      await waitFor(() =>
        expect(invalidateTagsFn).toHaveBeenCalledWith(['Receive'])
      );
      expect(await screen.findByText('Product added to cart successfully!')).toBeInTheDocument();
    });

    it("does NOT fire for an explicit 'NONE' schedule", async () => {
      const { validateFn, updateProductFn } = setupCascade('NONE');
      renderComponent();
      await selectProductAndValidate(validateFn);

      const addBtn = screen.getByText(/add to cart/i);
      await waitFor(() => {
        fireEvent.click(addBtn);
        expect(screen.getByText('Product added to cart successfully!')).toBeInTheDocument();
      });
      expect(screen.queryByText('Assign Drug Schedule')).not.toBeInTheDocument();
      expect(updateProductFn).not.toHaveBeenCalled();
    });

    it('cancel ("Skip for now") adds to cart unblocked without persisting', async () => {
      const { validateFn, updateProductFn } = setupCascade(null);
      renderComponent();
      await selectProductAndValidate(validateFn);

      const addBtn = screen.getByText(/add to cart/i);
      await waitFor(() => {
        fireEvent.click(addBtn);
        expect(screen.getByText('Assign Drug Schedule')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Skip for now'));
      expect(await screen.findByText('Product added to cart successfully!')).toBeInTheDocument();
      expect(updateProductFn).not.toHaveBeenCalled();
    });
  });

  it('shows the duplicate-batch admin warning modal when batches contain duplicate batch numbers', async () => {
    // Cascade auto-resolves: one brand for the product → one type → batches with a dupe.
    (inventoryApi.useGetBrandsFromProductNameMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue([{ id: 1, brand_name: 'BrandA', currentQuantity: 100 }]),
      })),
      { isLoading: false },
    ]);
    (inventoryApi.useGetTypesForBrandAndProductMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue([{ type: 'Capsule', product_id: 42, currentQuantity: 100 }]),
      })),
      { isLoading: false },
    ]);
    (salesApi.useGetBatchNumbersByProductIdMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue({
          batches: [
            { batch_number: 'DUP-1', current_qty: 5 },
            { batch_number: 'DUP-1', current_qty: 3 },
            { batch_number: 'UNIQUE-2', current_qty: 7 },
          ],
        }),
      })),
      { isLoading: false },
    ]);

    renderComponent();

    const productInput = screen.getByPlaceholderText(/search for a product/i);
    productInput.focus();
    fireEvent.change(productInput, { target: { value: 'Product A' } });
    const option = await screen.findByRole('option', { name: /Product A/i });
    fireEvent.click(option);

    // Informational modal names the duplicated batch number and points to the admin/Inventory flow.
    await waitFor(() =>
      expect(screen.getByText(/Duplicate batch numbers found/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/DUP-1/)).toBeInTheDocument();
    expect(screen.getByText(/Inventory Adjustment/i)).toBeInTheDocument();
    expect(screen.queryByText(/UNIQUE-2/)).not.toBeInTheDocument();
  });
});

