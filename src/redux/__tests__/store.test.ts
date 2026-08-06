import { store, allApis } from '../store';
import { logout, setCredentials } from '../slices/authSlice';
import { setCartItems, saveFormData } from '../slices/cartSlice';
import { orgApi } from '../slices/orgApi';
import { salesApi } from '../slices/salesApi';
import { alertsApi } from '../slices/alertsApi';

// Regression test for the stale-cache-across-logout bug: RTK Query caches
// (sales rows, alerts, /me org context, ...) survived logout, so a different
// user logging in within keepUnusedDataFor was served the previous org's data.
// The store's resetApiStateOnLogout middleware must purge EVERY api slice on
// logout, and the in-memory working cart must clear too.
describe('store logout purge', () => {
  // Every cartStorage.ts artifact (localStorage entries are browser-global and
  // account-agnostic — the root cause of the stale sales row after an account
  // switch: SaleHistory merges pharma_sales_history into its table).
  const SESSION_KEYS = [
    'pharma_sales_cart',
    'pharma_sales_cart_timestamp',
    'pharma_sales_form_data',
    'pharma_edit_invoice_id',
  ];
  const LOCAL_KEYS = ['pharma_sales_history', 'pharma_invoice_number_counter'];

  const seedSalesStorage = () => {
    sessionStorage.setItem('pharma_sales_cart', JSON.stringify({ cartItems: [{ id: 'x' }], totalAmount: 10, timestamp: Date.now() }));
    sessionStorage.setItem('pharma_sales_cart_timestamp', String(Date.now()));
    sessionStorage.setItem('pharma_sales_form_data', JSON.stringify({ customerName: 'Old', timestamp: Date.now() }));
    sessionStorage.setItem('pharma_edit_invoice_id', '42');
    localStorage.setItem('pharma_sales_history', JSON.stringify([{ id: 1, invoiceNumber: 'INV11' }]));
    localStorage.setItem('pharma_invoice_number_counter', '12');
  };

  const seedCaches = () => {
    // Seed a representative sample of api caches with fake "previous user" data.
    store.dispatch(
      orgApi.util.upsertQueryData('getMe', undefined, {
        user: {
          id: 1,
          username: 'olduser',
          email: 'old@x.com',
          first_name: 'Old',
          last_name: 'User',
          org_role: 'owner',
        },
        organization: {
          id: 1,
          name: 'Old Pharmacy',
          slug: 'old-pharmacy',
          logo_url: null,
          legal_name: null,
          address: null,
          dl_numbers: null,
          gstin: null,
          phone: null,
        },
        activeModules: ['pharmacy'],
      }),
    );
    store.dispatch(
      salesApi.util.upsertQueryData('getInvoices', undefined, [
        { id: 1, invoice_number: 111 } as any,
      ]),
    );
    store.dispatch(
      alertsApi.util.upsertQueryData('getAlerts', undefined, {
        count: 3,
        alerts: [],
      } as any),
    );
  };

  const seededQueryCount = () =>
    ([orgApi, salesApi, alertsApi] as const)
      .map((api) => Object.keys(store.getState()[api.reducerPath].queries).length)
      .reduce((a, b) => a + b, 0);

  it('resets every api slice state and clears the cart on logout', () => {
    seedCaches();
    seedSalesStorage();
    store.dispatch(
      setCartItems([
        {
          id: 'row-1',
          name: 'Paracetamol',
          batch: 'B1',
          avlQty: '2',
          mrp: 20,
          sp: 18,
          unit_selling_price: 9,
          expiry: '2027-01',
          quantity: 2,
          type: 'Tablet',
          discount: 0,
          totalPrice: 18,
        },
      ]),
    );
    store.dispatch(
      saveFormData({
        customerName: 'Old Customer',
        customerMobile: '9999999999',
        customerCity: '',
        patientType: '',
        doctorName: '',
        doctorMobile: '',
        doctorEmail: '',
        paymentMode: 'Cash',
        insuranceCompany: '',
        invoiceNumber: 'INV-1',
        invoiceDate: '2026-08-06',
      }),
    );

    // Sanity: the caches, cart and browser storage really are populated.
    expect(seededQueryCount()).toBeGreaterThanOrEqual(3);
    expect(store.getState().cart.items).toHaveLength(1);
    expect(store.getState().cart.formData).not.toBeNull();
    SESSION_KEYS.forEach((key) => expect(sessionStorage.getItem(key)).not.toBeNull());
    LOCAL_KEYS.forEach((key) => expect(localStorage.getItem(key)).not.toBeNull());

    store.dispatch(logout());

    // EVERY api slice (not just the seeded sample) is back to pristine state.
    allApis.forEach((api) => {
      const apiState = store.getState()[api.reducerPath];
      expect(Object.keys(apiState.queries)).toHaveLength(0);
      expect(Object.keys(apiState.mutations)).toHaveLength(0);
    });

    // The in-memory working cart is cleared.
    expect(store.getState().cart.items).toHaveLength(0);
    expect(store.getState().cart.totalAmount).toBe(0);
    expect(store.getState().cart.formData).toBeNull();

    // Org context is also reset (existing orgSlice logout extraReducer).
    expect(store.getState().org.organization).toBeNull();
    expect(store.getState().org.activeModules).toHaveLength(0);
    expect(store.getState().org.loaded).toBe(false);

    // Every persisted sales artifact is gone (session + local storage).
    SESSION_KEYS.forEach((key) => expect(sessionStorage.getItem(key)).toBeNull());
    LOCAL_KEYS.forEach((key) => expect(localStorage.getItem(key)).toBeNull());
  });

  it('does not purge caches on unrelated actions', () => {
    seedCaches();
    expect(seededQueryCount()).toBeGreaterThanOrEqual(3);

    store.dispatch(
      setCredentials({
        user: {
          id: 2,
          username: 'newuser',
          email: 'new@x.com',
          first_name: 'New',
          last_name: 'User',
        },
        token: 'JWT',
      }),
    );

    expect(seededQueryCount()).toBeGreaterThanOrEqual(3);

    // Clean up for other tests in this file.
    store.dispatch(logout());
  });
});
