import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import SalesReceipt from '../SalesReceipt';
import cartReducer, { CartState } from '../../../redux/slices/cartSlice';
import * as salesApi from '../../../redux/slices/salesApi';
import * as receiveApi from '../../../redux/slices/receiveApi';

// Regression (fix/sales-cart-no-persist): leaving the receipt step by any exit
// other than the sanctioned "Add product to cart" (Edit Cart) hop back to
// /sales/new must clear the Redux cart + form data. The Edit Cart hop is guarded
// by goingToSalepageRef in SalesReceipt.tsx and must PRESERVE the cart.

const theme = createTheme();

const makeMutation = (resolved: any = { data: {} }) =>
  jest.fn(() => [
    jest.fn(() => ({ unwrap: jest.fn().mockResolvedValue(resolved) })),
    { isLoading: false },
  ]);

// Mock dependencies (mirrors SalesReceipt.test.tsx)
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/sales/receipt', state: null }),
}));

jest.mock('../../../redux/slices/salesApi');
jest.mock('../../../redux/slices/receiveApi');
jest.mock('../../../utils/cartStorage', () => ({
  clearCartFromStorage: jest.fn(),
  clearFormDataFromStorage: jest.fn(),
  getCartFromStorage: jest.fn(() => ({ items: [], total: 0 })),
  getFormDataFromStorage: jest.fn(() => null),
  setEditInvoiceId: jest.fn(),
  saveSalesHistoryToStorage: jest.fn(),
}));

// Real cart reducer so the guarded cleanup can actually mutate the store and be
// asserted, alongside a spy on store.dispatch.
const createStore = (cart?: Partial<CartState>) =>
  configureStore({
    reducer: {
      auth: (state = { user: { id: 1, username: 'testuser' } }) => state,
      org: (state = { organization: null, activeModules: [], loaded: false }) => state,
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

describe('SalesReceipt — clears cart when leaving the receipt step', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (salesApi.useGetDoctorNamesQuery as jest.Mock) = jest.fn(() => ({
      data: ['Dr. Smith', 'Dr. Jones'],
      isLoading: false,
    }));

    (salesApi.useGetAllCustomerNamesQuery as jest.Mock) = jest.fn(() => ({
      data: ['John Doe', 'Jane Smith'],
      refetch: jest.fn(),
    }));

    (salesApi.useGetCustomerOptionsQuery as jest.Mock) = jest.fn(() => ({
      data: [
        { id: '1', name: 'John Doe', phone: '1234567890' },
        { id: '2', name: 'Jane Smith', phone: '9876543210' },
      ],
      isLoading: false,
    }));

    (salesApi.useSubmitSaleMutation as jest.Mock) = jest.fn(() => [
      jest.fn().mockResolvedValue({ data: { success: true } }),
      { isLoading: false },
    ]);

    (salesApi.useAddCustomerMutation as jest.Mock) = jest.fn(() => [
      jest.fn().mockResolvedValue({ data: { id: 1, name: 'New Customer', mobile: '1234567890' } }),
    ]);

    (salesApi.useGetCustomerPhonesMutation as jest.Mock) = jest.fn(() => [
      jest.fn().mockImplementation(() => ({
        unwrap: jest.fn().mockResolvedValue({ data: { phones: ['1234567890', '9876543210'] } }),
      })),
    ]);

    (salesApi.useGetDoctorPhonesAndEmailsMutation as jest.Mock) = jest.fn(() => [
      jest.fn().mockImplementation(() => ({
        unwrap: jest.fn().mockResolvedValue({
          data: { info: [{ phone: '1234567890', email: 'doctor@example.com' }] },
        }),
      })),
    ]);

    (receiveApi.useGetProductsQuery as jest.Mock) = jest.fn(() => ({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    }));

    (salesApi.useUpdateSalesMutation as jest.Mock) = makeMutation({ data: { success: true } });
    (salesApi.useEditSaleMutation as jest.Mock) = makeMutation({ data: { success: true } });
    (salesApi.useDeleteSalesMutation as jest.Mock) = makeMutation({ data: { success: true } });
    (salesApi.useUpsertInvoicePaymentsMutation as jest.Mock) = makeMutation({ data: { success: true } });
    (salesApi.useDeleteInvoiceMutation as jest.Mock) = makeMutation({ data: { success: true } });
    (salesApi.useGetInvoiceDetailsMutation as jest.Mock) = makeMutation({ data: {} });
  });

  const renderComponent = (store: ReturnType<typeof createStore>) =>
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <SalesReceipt />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    );

  it('dispatches clearCart + clearFormData and empties the store when unmounted without Edit Cart', () => {
    const store = createStore(populatedCart);
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { unmount } = renderComponent(store);

    dispatchSpy.mockClear();
    unmount();

    const types = dispatchedTypes(dispatchSpy);
    expect(types).toContain('cart/clearCart');
    expect(types).toContain('cart/clearFormData');

    expect(store.getState().cart.items).toHaveLength(0);
    expect(store.getState().cart.formData).toBeNull();
  });

  it('does NOT clear the cart on unmount after Edit Cart (sanctioned hop back to /sales/new)', async () => {
    const store = createStore(populatedCart);
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { unmount } = renderComponent(store);

    // Wait for useCartLoader to hydrate the receipt's items from the Redux cart
    // so the Edit Cart handoff carries the populated cart across the hop.
    await screen.findByText(/Product A/i);

    // "Add product to cart" is the Edit Cart button; it flips goingToSalepageRef.
    fireEvent.click(screen.getByText(/add product to cart/i));

    dispatchSpy.mockClear();
    unmount();

    const types = dispatchedTypes(dispatchSpy);
    expect(types).not.toContain('cart/clearCart');
    expect(types).not.toContain('cart/clearFormData');

    // The working cart survives the hop back to the sale page.
    expect(store.getState().cart.items.length).toBeGreaterThan(0);
  });
});
