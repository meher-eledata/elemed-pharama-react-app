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
import * as draftsApi from '../../../redux/slices/draftsApi';

// Autosave-on-leave: when the New Sale page unmounts on any exit that is NOT the
// sanctioned "Next" hop to the receipt, a NON-EMPTY cart is snapshotted via a
// fire-and-forget createDraft(...) (POST sales/drafts) BEFORE the cart is wiped.
// An EMPTY cart must NOT fire createDraft (but still clears). The Next hop keeps
// the cart and creates no draft. See feature/draft-limit-and-autosave.
//
// Mirrors salepage.cartClearOnLeave.test.tsx's harness exactly, but additionally
// mocks draftsApi so we can assert the mutation trigger fired with the cart
// snapshot (the sibling suite leaves the real, no-op trigger in place).

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/sales', state: null }),
}));

jest.mock('../../../redux/slices/salesApi');
jest.mock('../../../redux/slices/receiveApi');
jest.mock('../../../redux/slices/inventoryApi');
jest.mock('../../../redux/slices/masterApi');
jest.mock('../../../redux/slices/draftsApi');
jest.mock('../../../hooks/useDebounce', () => ({
  useDebounce: (value: any) => value,
}));

const theme = createTheme();

// The mocked createDraft mutation trigger. Fire-and-forget: salepage calls
// createDraft(body).catch(() => {}), so the trigger must return a thenable.
const mockCreateDraft = jest.fn((_body: any) => Promise.resolve({}));

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

const emptyCart: Partial<CartState> = {
  items: [],
  totalAmount: 0,
  formData: null,
};

const dispatchedTypes = (spy: jest.SpyInstance) =>
  spy.mock.calls.map((c) => (c[0] as any)?.type);

describe('SalePage — auto-saves a draft when leaving the New Sale flow', () => {
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

    (draftsApi.useCreateDraftMutation as jest.Mock) = jest.fn(() => [
      mockCreateDraft,
      { isLoading: false },
    ]);

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

  it('fires createDraft (POST sales/drafts) with the cart snapshot when unmounted with a NON-EMPTY cart', () => {
    const store = createStore(populatedCart);
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { unmount } = renderComponent(store);

    dispatchSpy.mockClear();
    unmount();

    // The snapshot mutation fired exactly once.
    expect(mockCreateDraft).toHaveBeenCalledTimes(1);

    // Its body carries the live cart: item_count + payload.items reflect the cart.
    const body = mockCreateDraft.mock.calls[0][0] as any;
    expect(body.item_count).toBe(1);
    expect(body.total_amount).toBe(900);
    expect(body.payload.items).toHaveLength(1);
    expect(body.payload.items[0].id).toBe('1');
    expect(body.payload.items[0].name).toBe('Product A');
    // Customer metadata is denormalized onto the draft from the form snapshot.
    expect(body.customer_name).toBe('John Doe');
    expect(body.customer_phone).toBe('1234567890');

    // The cart is still cleared after the snapshot (existing invariant).
    const types = dispatchedTypes(dispatchSpy);
    expect(types).toContain('cart/clearCart');
    expect(types).toContain('cart/clearFormData');
    expect(store.getState().cart.items).toHaveLength(0);
    expect(store.getState().cart.totalAmount).toBe(0);
    expect(store.getState().cart.formData).toBeNull();
  });

  it('does NOT fire createDraft when unmounted with an EMPTY cart, but still clears', () => {
    const store = createStore(emptyCart);
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { unmount } = renderComponent(store);

    dispatchSpy.mockClear();
    unmount();

    // No snapshot for an empty cart.
    expect(mockCreateDraft).not.toHaveBeenCalled();

    // Cleanup still runs (idempotent clears).
    const types = dispatchedTypes(dispatchSpy);
    expect(types).toContain('cart/clearCart');
    expect(types).toContain('cart/clearFormData');
    expect(store.getState().cart.items).toHaveLength(0);
  });

  it('does NOT fire createDraft and PRESERVES the cart on the sanctioned Next hop to the receipt', () => {
    const store = createStore(populatedCart);
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { unmount } = renderComponent(store);

    // Pressing Next flips goingToReceiptRef → the unmount cleanup is skipped
    // entirely (no draft snapshot, cart preserved for the receipt step).
    const nextButton = screen.getByText(/next/i);
    fireEvent.click(nextButton);

    dispatchSpy.mockClear();
    unmount();

    expect(mockCreateDraft).not.toHaveBeenCalled();

    const types = dispatchedTypes(dispatchSpy);
    expect(types).not.toContain('cart/clearCart');
    expect(types).not.toContain('cart/clearFormData');
    expect(store.getState().cart.items).toHaveLength(1);
    expect(store.getState().cart.totalAmount).toBe(900);
  });
});
