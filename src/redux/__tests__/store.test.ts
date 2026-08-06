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

    // Sanity: the caches and cart really are populated before logout.
    expect(seededQueryCount()).toBeGreaterThanOrEqual(3);
    expect(store.getState().cart.items).toHaveLength(1);
    expect(store.getState().cart.formData).not.toBeNull();

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
