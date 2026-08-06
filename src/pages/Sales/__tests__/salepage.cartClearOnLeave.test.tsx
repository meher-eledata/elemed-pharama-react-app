import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import SalePage from '../salepage';
import cartReducer, { CartState } from '../../../redux/slices/cartSlice';
import * as salesApi from '../../../redux/slices/salesApi';
import * as receiveApi from '../../../redux/slices/receiveApi';
import * as inventoryApi from '../../../redux/slices/inventoryApi';
import * as masterApi from '../../../redux/slices/masterApi';

// Regression: leaving the New Sale flow (any unmount that is NOT the sanctioned
// "Next" hop to the receipt) must clear the Redux cart + form data, so returning
// to /sales/new starts empty. The sanctioned Next hop must PRESERVE the cart
// (guarded by goingToReceiptRef in salepage.tsx). See fix/sales-cart-no-persist.

// Mock dependencies (mirrors salepage.test.tsx)
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

// Unlike the sibling suite this uses the REAL cart reducer so we can (a) let
// clearCart/clearFormData actually empty the store and (b) spy on store.dispatch
// to prove the cleanup fired (or did NOT fire on the sanctioned Next hop).
const createStore = (cart?: Partial<CartState>) =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
      cart: cartReducer,
    },
    preloadedState: cart
      ? {
          cart: {
            items: [],
            totalAmount: 0,
            formData: null,
            isLoading: false,
            error: null,
            ...cart,
          } as CartState,
        }
      : undefined,
  });

const populatedCart: Partial<CartState> = {
  items: [
    {
      id: '1',
      name: 'Product A',
      batch: 'B001',
      avlQty: '100',
      mrp: 100,
      sp: 90,
      unit_selling_price: 90,
      expiry: '2025-12-31',
      quantity: 10,
      type: 'Capsule',
      discount: 0,
      totalPrice: 900,
    },
  ],
  totalAmount: 900,
  formData: {
    customerName: 'John Doe',
    customerMobile: '1234567890',
    customerCity: 'Mumbai',
    patientType: 'Out Patient',
    doctorName: 'Dr. Smith',
    doctorMobile: '',
    doctorEmail: '',
    paymentMode: 'Cash',
    insuranceCompany: '',
    invoiceNumber: 'INV1',
    invoiceDate: '2026-08-04',
  },
};

const dispatchedTypes = (spy: jest.SpyInstance) =>
  spy.mock.calls.map((c) => (c[0] as any)?.type);

describe('SalePage — clears cart when leaving the New Sale flow', () => {
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
      jest.fn().mockResolvedValue({ data: [{ type: 'Capsule' }, { type: 'Tablet' }] }),
      { isLoading: false },
    ]);

    (salesApi.useValidateSaleMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({
        unwrap: jest.fn().mockResolvedValue({ mrp: 100, selling_price: 90 }),
      })),
      { isLoading: false },
    ]);

    (salesApi.useGetDoctorNamesQuery as jest.Mock) = jest.fn(() => ({
      data: [{ id: '1', name: 'Dr. Smith' }],
      isLoading: false,
    }));

    (salesApi.useGetBatchNumbersByProductIdMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue({ batches: [] }) })),
      { isLoading: false },
    ]);

    (inventoryApi.useGetBrandsFromProductNameMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue([]) })),
      { isLoading: false },
    ]);

    (inventoryApi.useGetTypesForBrandAndProductMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue([]) })),
      { isLoading: false },
    ]);

    (inventoryApi.useGetBatchesForProductMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue([]) })),
      { isLoading: false },
    ]);

    (masterApi.useUpdateProductMutation as jest.Mock) = jest.fn(() => [
      jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue({ message: 'updated' }) })),
      { isLoading: false },
    ]);

    (receiveApi as any).receiveApi = {
      util: { invalidateTags: jest.fn(() => ({ type: 'test/invalidateTags' })) },
    };
  });

  const renderComponent = (store: ReturnType<typeof createStore>) =>
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <SalePage />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    );

  it('dispatches clearCart + clearFormData and empties the store when unmounted without pressing Next', () => {
    const store = createStore(populatedCart);
    // Spy BEFORE render so react-redux captures the wrapped dispatch reference.
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { unmount } = renderComponent(store);

    // Isolate the unmount cleanup from any mount/render-time dispatches.
    dispatchSpy.mockClear();
    unmount();

    const types = dispatchedTypes(dispatchSpy);
    expect(types).toContain('cart/clearCart');
    expect(types).toContain('cart/clearFormData');

    // The working cart is actually emptied.
    expect(store.getState().cart.items).toHaveLength(0);
    expect(store.getState().cart.totalAmount).toBe(0);
    expect(store.getState().cart.formData).toBeNull();
  });

  it('does NOT clear the cart on unmount when the user pressed Next (sanctioned receipt hop)', () => {
    const store = createStore(populatedCart);
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { unmount } = renderComponent(store);

    // Pressing Next flips goingToReceiptRef so the working cart survives the hop
    // to /sales/receipt (where the receipt hydrates from Redux).
    const nextButton = screen.getByText(/next/i);
    fireEvent.click(nextButton);

    dispatchSpy.mockClear();
    unmount();

    const types = dispatchedTypes(dispatchSpy);
    expect(types).not.toContain('cart/clearCart');
    expect(types).not.toContain('cart/clearFormData');

    // Cart is preserved for the receipt step.
    expect(store.getState().cart.items).toHaveLength(1);
    expect(store.getState().cart.totalAmount).toBe(900);
  });
});
