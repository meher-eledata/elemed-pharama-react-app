import { adminCreditApi } from '../adminCreditApi';
import { baseQueryWithReauth } from '../../baseQuery';
import { configureStore } from '@reduxjs/toolkit';

// Mock the shared reauth base query so we assert the built request args directly.
jest.mock('../../baseQuery', () => ({
  baseQueryWithReauth: jest.fn(),
}));

const mockBaseQuery = baseQueryWithReauth as jest.MockedFunction<
  typeof baseQueryWithReauth
>;

const makeStore = () =>
  configureStore({
    reducer: {
      [adminCreditApi.reducerPath]: adminCreditApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(adminCreditApi.middleware),
  });

const okMeta = {
  request: new Request('http://localhost:3000/api/admin/credit'),
  response: { status: 200, statusText: 'OK' } as Response,
};

const expectExtraArgs = expect.objectContaining({
  dispatch: expect.any(Function),
  getState: expect.any(Function),
});

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('Admin Supplier Credit API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST admin/credit/list-transactions (E1)', () => {
    it('builds the correct request (url/method/body) and returns { rows, total }', async () => {
      const mockResponse = {
        rows: [
          {
            id: '57',
            credit_type: 'SUPPLIER_APPLY',
            direction: 'OUT' as const,
            amount: '1200.00',
            persona_type: 'SUPPLIER',
            persona_id: 3,
            supplier_name: 'Acme',
            notes: 'apply credit',
            created_by: 'admin',
            related_payment_id: 9,
            related_po_id: 500,
            created_at: '2026-07-01T10:00:00.000Z',
          },
        ],
        total: 1,
      };
      mockBaseQuery.mockResolvedValueOnce({ data: mockResponse, meta: okMeta });

      const body = {
        persona_type: 'SUPPLIER',
        supplier_id: 3,
        start_date: '2026-07-01',
        end_date: '2026-07-31',
        limit: 500,
        offset: 0,
      };
      const store = makeStore();
      const result = await store.dispatch(
        adminCreditApi.endpoints.listCreditTransactions.initiate(body)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'admin/credit/list-transactions', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('keeps amount as a pg string (no coercion) in the returned rows', async () => {
      const mockResponse = {
        rows: [{ id: '1', amount: '999.99' }],
        total: 1,
      };
      mockBaseQuery.mockResolvedValueOnce({ data: mockResponse, meta: okMeta });
      const store = makeStore();
      const result = await store.dispatch(
        adminCreditApi.endpoints.listCreditTransactions.initiate({})
      );
      expect(result.data?.rows[0].amount).toBe('999.99');
    });
  });

  describe('POST admin/credit/get-supplier-credit-balance (E3)', () => {
    it('builds the correct request and returns the balance', async () => {
      const mockResponse = {
        supplier_id: 3,
        available_credit: 150.5,
        last_txn_id: 9,
      };
      mockBaseQuery.mockResolvedValueOnce({ data: mockResponse, meta: okMeta });

      const store = makeStore();
      const result = await store.dispatch(
        adminCreditApi.endpoints.getSupplierCreditBalance.initiate({ supplier_id: 3 })
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        {
          url: 'admin/credit/get-supplier-credit-balance',
          method: 'POST',
          body: { supplier_id: 3 },
        },
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST admin/credit/adjust-supplier-credit (E2)', () => {
    const body = {
      supplier_id: 3,
      direction: 'IN' as const,
      amount: 100,
      notes: 'topup',
    };

    it('builds the correct request (url/method/body) and returns data', async () => {
      const mockResponse = {
        message: 'Supplier credit adjusted',
        supplier: { id: 3, supplier_name: 'Acme', supplier_code: 'AC' },
        credit_balance: {
          previous_balance: 20,
          delta: 100,
          new_balance: 120,
          last_txn_id: 77,
        },
        credit_transaction: {
          id: '77',
          credit_type: 'ADJUSTMENT',
          direction: 'IN' as const,
          amount: '100.00',
          persona_type: 'SUPPLIER',
          persona_id: 3,
          supplier_name: 'Acme',
          notes: 'topup',
          created_by: 'admin',
          related_payment_id: null,
          related_po_id: null,
          created_at: '2026-07-09T10:00:00.000Z',
        },
      };
      mockBaseQuery.mockResolvedValueOnce({ data: mockResponse, meta: okMeta });

      const store = makeStore();
      const result = await store.dispatch(
        adminCreditApi.endpoints.adjustSupplierCredit.initiate(body)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'admin/credit/adjust-supplier-credit', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles a 400 (insufficient credit) error', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 400, data: { error: 'Insufficient supplier credit. Current=10, Requested=50' } },
        meta: okMeta,
      });
      const store = makeStore();
      const result = await store.dispatch(
        adminCreditApi.endpoints.adjustSupplierCredit.initiate({
          ...body,
          direction: 'OUT',
          amount: 50,
        })
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(400);
    });

    it('a successful adjust invalidates CreditTxns + the per-supplier CreditBalance, refetching both', async () => {
      const store = makeStore();

      // 1) Prime the transactions list (provides tag CreditTxns) with a live subscription.
      mockBaseQuery.mockResolvedValueOnce({
        data: { rows: [], total: 0 },
        meta: okMeta,
      });
      const listSub = store.dispatch(
        adminCreditApi.endpoints.listCreditTransactions.initiate({ supplier_id: 3 })
      );
      await listSub;

      // 2) Prime the per-supplier balance (provides tag { CreditBalance, id: 3 }).
      mockBaseQuery.mockResolvedValueOnce({
        data: { supplier_id: 3, available_credit: 20, last_txn_id: 9 },
        meta: okMeta,
      });
      const balSub = store.dispatch(
        adminCreditApi.endpoints.getSupplierCreditBalance.initiate({ supplier_id: 3 })
      );
      await balSub;

      const callsBeforeAdjust = mockBaseQuery.mock.calls.length;

      // 3) Successful adjust for supplier 3 → invalidates CreditTxns + CreditBalance:3.
      mockBaseQuery.mockResolvedValueOnce({
        data: {
          message: 'Supplier credit adjusted',
          supplier: { id: 3, supplier_name: 'Acme', supplier_code: 'AC' },
          credit_balance: { previous_balance: 20, delta: 100, new_balance: 120, last_txn_id: 78 },
          credit_transaction: { id: '78', amount: '100.00' },
        },
        meta: okMeta,
      });
      // The two invalidated queries refetch.
      mockBaseQuery.mockResolvedValue({ data: { rows: [], total: 0 }, meta: okMeta });

      await store.dispatch(
        adminCreditApi.endpoints.adjustSupplierCredit.initiate(body)
      );
      await flush();

      const urlsAfter = mockBaseQuery.mock.calls
        .slice(callsBeforeAdjust)
        .map((c) => (c[0] as { url: string }).url);

      // The mutation itself + the two tag-invalidated refetches.
      expect(urlsAfter).toContain('admin/credit/adjust-supplier-credit');
      expect(urlsAfter).toContain('admin/credit/list-transactions');
      expect(urlsAfter).toContain('admin/credit/get-supplier-credit-balance');

      listSub.unsubscribe();
      balSub.unsubscribe();
    });
  });

  describe('Endpoint & hook configuration', () => {
    it('defines all three endpoints', () => {
      expect(adminCreditApi.endpoints.listCreditTransactions).toBeDefined();
      expect(adminCreditApi.endpoints.getSupplierCreditBalance).toBeDefined();
      expect(adminCreditApi.endpoints.adjustSupplierCredit).toBeDefined();
    });

    it('exports all three hooks', () => {
      expect(adminCreditApi.useListCreditTransactionsQuery).toBeDefined();
      expect(adminCreditApi.useGetSupplierCreditBalanceQuery).toBeDefined();
      expect(adminCreditApi.useAdjustSupplierCreditMutation).toBeDefined();
    });
  });
});
