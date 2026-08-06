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

// Router location state is controllable per-test so we can simulate resuming an
// existing draft: salepage reads (location.state as any).draftId to decide
// between updateDraft (in-place edit) and createDraft (fresh draft). The
// `mock`-prefix lets jest's hoisted factory reference it; it is reset to null in
// beforeEach so the create-path tests below see no draftId (their prior default).
let mockLocationState: any = null;
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/sales', state: mockLocationState }),
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
const mockUpdateDraft = jest.fn((_body: any) => Promise.resolve({}));

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
    mockLocationState = null;

    (draftsApi.useCreateDraftMutation as jest.Mock) = jest.fn(() => [
      mockCreateDraft,
      { isLoading: false },
    ]);

    (draftsApi.useUpdateDraftMutation as jest.Mock) = jest.fn(() => [
      mockUpdateDraft,
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

  // Regression (feature/draft-limit-and-autosave): resuming a draft carries its
  // id in router state. Editing that resumed cart and leaving must UPDATE the
  // same draft in place — not POST a brand-new one — so the user does not end up
  // with a duplicate draft on every edit-and-leave.
  it('fires updateDraft (NOT createDraft) with { id, ...snapshot } when leaving with a NON-EMPTY cart and an active draftId', () => {
    mockLocationState = { draftId: 42 };
    const store = createStore(populatedCart);
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { unmount } = renderComponent(store);

    dispatchSpy.mockClear();
    unmount();

    // The in-place update fired exactly once; no duplicate draft was created.
    expect(mockUpdateDraft).toHaveBeenCalledTimes(1);
    expect(mockCreateDraft).not.toHaveBeenCalled();

    // The body targets the resumed draft id and carries the live cart snapshot.
    const body = mockUpdateDraft.mock.calls[0][0] as any;
    expect(body.id).toBe(42);
    expect(body.item_count).toBe(1);
    expect(body.total_amount).toBe(900);
    expect(body.payload.items).toHaveLength(1);
    expect(body.payload.items[0].id).toBe('1');
    expect(body.payload.items[0].name).toBe('Product A');
    expect(body.customer_name).toBe('John Doe');
    expect(body.customer_phone).toBe('1234567890');

    // Cart is still cleared after the snapshot (existing invariant).
    const types = dispatchedTypes(dispatchSpy);
    expect(types).toContain('cart/clearCart');
    expect(types).toContain('cart/clearFormData');
    expect(store.getState().cart.items).toHaveLength(0);
  });

  // Regression (feature/draft-limit-and-autosave follow-up): when leaving a
  // RESUMED draft, the update body MERGES a `draftPreserve` snapshot (threaded in
  // location.state) over the live cart. Only items/total_amount/item_count come
  // from the current cart; every receipt-owned field (financials discount/tax,
  // splitPayments, invoice #/date, customer_id, doctorId, patientType) is
  // preserved from the snapshot — NOT reset to the lean in-progress defaults.
  it('MERGES the draftPreserve snapshot over the live cart in the updateDraft body — preserving receipt-entered fields, overriding only items+totals', () => {
    const snapshot = {
      customer_id: 7,
      invoice_number: 'INV1470',
      invoice_date: '2026-08-06',
      financials: {
        totalValue: '1000',
        totalDiscount: '50',
        taxAmount: '30',
        totalPayableAmount: '980',
      },
      splitPayments: [{ mode: 'Cash', amount: '980' }],
      doctorId: 3,
      patientType: 'Out Patient',
    };
    mockLocationState = { draftId: 42, draftPreserve: snapshot };
    const store = createStore(populatedCart);
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { unmount } = renderComponent(store);

    dispatchSpy.mockClear();
    unmount();

    // In-place update fired exactly once; no duplicate draft was created.
    expect(mockUpdateDraft).toHaveBeenCalledTimes(1);
    expect(mockCreateDraft).not.toHaveBeenCalled();

    const body = mockUpdateDraft.mock.calls[0][0] as any;
    expect(body.id).toBe(42);

    // PRESERVED from the snapshot (receipt-entered fields survive the abandon).
    expect(body.customer_id).toBe(7);
    expect(body.invoice_number).toBe('INV1470');
    expect(body.invoice_date).toBe('2026-08-06');
    expect(body.payload.financials.totalDiscount).toBe('50'); // NOT reset to '0'
    expect(body.payload.financials.taxAmount).toBe('30'); // NOT reset to '0'
    expect(body.payload.splitPayments).toEqual(snapshot.splitPayments); // NOT emptied
    expect(body.payload.doctorId).toBe(3);
    expect(body.payload.patientType).toBe('Out Patient');

    // OVERRIDDEN from the live cart (items + totals reflect the current cart).
    expect(body.item_count).toBe(1);
    expect(body.total_amount).toBe(900);
    expect(body.payload.items).toHaveLength(1);
    expect(body.payload.items[0].id).toBe('1');
    expect(body.payload.items[0].name).toBe('Product A');

    // Cart is still cleared after the snapshot (existing invariant).
    const types = dispatchedTypes(dispatchSpy);
    expect(types).toContain('cart/clearCart');
    expect(types).toContain('cart/clearFormData');
    expect(store.getState().cart.items).toHaveLength(0);
  });

  it('fires createDraft (NOT updateDraft) when leaving with a NON-EMPTY cart and NO draftId in location.state', () => {
    // mockLocationState stays null (reset in beforeEach) → no active draft id.
    const store = createStore(populatedCart);
    const { unmount } = renderComponent(store);

    unmount();

    expect(mockCreateDraft).toHaveBeenCalledTimes(1);
    expect(mockUpdateDraft).not.toHaveBeenCalled();

    // No id is threaded onto the create body.
    const body = mockCreateDraft.mock.calls[0][0] as any;
    expect(body.id).toBeUndefined();
    expect(body.item_count).toBe(1);
  });

  it('fires NEITHER createDraft nor updateDraft when leaving with an EMPTY cart even if a draftId is present, but still clears', () => {
    mockLocationState = { draftId: 42 };
    const store = createStore(emptyCart);
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const { unmount } = renderComponent(store);

    dispatchSpy.mockClear();
    unmount();

    // An empty cart snapshots nothing on either path.
    expect(mockCreateDraft).not.toHaveBeenCalled();
    expect(mockUpdateDraft).not.toHaveBeenCalled();

    // Cleanup still runs.
    const types = dispatchedTypes(dispatchSpy);
    expect(types).toContain('cart/clearCart');
    expect(types).toContain('cart/clearFormData');
    expect(store.getState().cart.items).toHaveLength(0);
  });
});
