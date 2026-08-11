import { supplierReturnsApi } from '../supplierReturnsApi';
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
      [supplierReturnsApi.reducerPath]: supplierReturnsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(supplierReturnsApi.middleware),
  });

const okMeta = {
  request: new Request('http://localhost:3000/api/supplier-returns'),
  response: { status: 200, statusText: 'OK' } as Response,
};

const expectExtraArgs = expect.objectContaining({
  dispatch: expect.any(Function),
  getState: expect.any(Function),
});

describe('Supplier Returns API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET supplier-returns/returnable-batches', () => {
    it('builds the correct request (plain GET url) and returns { batches }', async () => {
      const mockResponse = {
        batches: [
          {
            batch_id: 1,
            batch_number: 'B1',
            product_id: 10,
            product_name: 'Paracetamol 500',
            type: 'Tablet',
            brand_name: 'Acme',
            quantity: 20,
            pack_qty: 10,
            purchase_price_per_unit: 10,
            mrp: 5.5,
            expiry_date: '2026-09-01',
            days_until_expiry: 21,
            expiry_status: 'NEAR_EXPIRY' as const,
            supplier_id: 3,
            supplier_name: 'SupCo',
            receipt_id: 7,
            supplier_invoice_number: 'INV-77',
            po_number: 'PO-9',
            receipt_line_id: 12,
          },
        ],
      };
      mockBaseQuery.mockResolvedValueOnce({ data: mockResponse, meta: okMeta });

      const store = makeStore();
      const result = await store.dispatch(
        supplierReturnsApi.endpoints.getReturnableBatches.initiate()
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'supplier-returns/returnable-batches',
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST supplier-returns/submit-return', () => {
    it('builds the correct request (url/method/body) and returns the 201 payload', async () => {
      const mockResponse = {
        message: 'Supplier return submitted',
        supplier_return_id: 42,
        return_number: 'SR-000042',
        return_status: 'AWAITING_CREDIT' as const,
        totals: { taxable_value: 30, cgst_amount: 1.8, sgst_amount: 1.8, total_amount: 33.6 },
        credit: { credit_txn_id: 77, new_balance: 43.6 },
      };
      mockBaseQuery.mockResolvedValueOnce({ data: mockResponse, meta: okMeta });

      // Client sends only supplier/settlement choices + { batch_id, quantity } — no prices.
      const body = {
        supplier_id: 3,
        idempotency_key: 'idem-abc',
        gst_treatment: 'WITH_GST' as const,
        value_basis: 'PURCHASE_PRICE' as const,
        settlement_mode: 'CREDIT_NOTE' as const,
        reason: 'expired stock',
        lines: [{ batch_id: 1, quantity: 3 }],
      };
      const store = makeStore();
      const result = await store.dispatch(
        supplierReturnsApi.endpoints.submitReturn.initiate(body)
      );

      expect('data' in result && result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'supplier-returns/submit-return', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('surfaces a 409 (insufficient stock) as an error result', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: {
          status: 409,
          data: { error: 'Insufficient stock for batch B1: on hand 2, requested 3' },
        },
        meta: okMeta,
      });
      const store = makeStore();
      const result = await store.dispatch(
        supplierReturnsApi.endpoints.submitReturn.initiate({
          supplier_id: 3,
          gst_treatment: 'WITH_GST',
          value_basis: 'MRP',
          settlement_mode: 'CASH',
          lines: [{ batch_id: 1, quantity: 3 }],
        })
      );
      expect('error' in result && result.error).toBeDefined();
      expect(((result as { error: { status: number } }).error).status).toBe(409);
    });
  });

  describe('POST supplier-returns/list-returns', () => {
    it('builds the correct request and returns { rows, total } untouched (already numbers)', async () => {
      const mockResponse = {
        rows: [
          {
            supplier_return_id: 42,
            return_number: 'SR-000042',
            supplier_id: 3,
            supplier_name: 'SupCo',
            return_date: '2026-08-11T09:00:00.000Z',
            created_by: 'currentUser',
            reason: null,
            notes: null,
            return_status: 'AWAITING_CREDIT' as const,
            gst_treatment: 'WITH_GST' as const,
            value_basis: 'PURCHASE_PRICE' as const,
            settlement_mode: 'CREDIT_NOTE' as const,
            settlement_reference: null,
            taxable_value: 30,
            cgst_amount: 1.8,
            sgst_amount: 1.8,
            total_amount: 33.6,
            credit_received_amount: null,
            credit_received_date: null,
            credit_received_reference: null,
            line_count: 1,
            units_count: 3,
          },
        ],
        total: 120,
      };
      mockBaseQuery.mockResolvedValueOnce({ data: mockResponse, meta: okMeta });

      const body = { search: 'SR-0000', status: 'AWAITING_CREDIT' as const, limit: 200, offset: 0 };
      const store = makeStore();
      const result = await store.dispatch(
        supplierReturnsApi.endpoints.listReturns.initiate(body)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'supplier-returns/list-returns', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST supplier-returns/get-return-details', () => {
    it('builds the correct request and Number()-normalizes the four pg-string line leaks (cgst/sgst/igst/discount)', async () => {
      // As-built server response: line cgst/sgst/igst/discount arrive as RAW pg
      // DECIMAL strings (SELECT l.* spread) — the contract-documented leak.
      const serverResponse = {
        id: 42,
        supplier_return_id: 42,
        return_number: 'SR-000042',
        supplier_id: 3,
        supplier_name: 'SupCo',
        return_status: 'AWAITING_CREDIT',
        taxable_value: 221.67,
        cgst_amount: 13.3,
        sgst_amount: 13.3,
        total_amount: 248.27,
        credit_txn_id: 77,
        lines: [
          {
            id: 501,
            supplier_return_id: 42,
            product_id: 10,
            product_name: 'Paracetamol 500',
            batch_number: 'B1',
            quantity: 20,
            purchase_price: 11.0833,
            unit_value: 11.0833,
            gst_rate: 12,
            mrp: 15,
            total_amount: 248.27,
            cgst: '26.6000',
            sgst: '26.6000',
            igst: '0',
            discount: '0.00',
            batch_id: 1,
          },
        ],
      };
      mockBaseQuery.mockResolvedValueOnce({ data: serverResponse, meta: okMeta });

      const store = makeStore();
      const result = await store.dispatch(
        supplierReturnsApi.endpoints.getReturnDetails.initiate({ supplier_return_id: 42 })
      );

      expect(mockBaseQuery).toHaveBeenCalledWith(
        {
          url: 'supplier-returns/get-return-details',
          method: 'POST',
          body: { supplier_return_id: 42 },
        },
        expectExtraArgs,
        undefined
      );

      const line = result.data!.lines[0];
      expect(line.cgst).toBe(26.6);
      expect(line.sgst).toBe(26.6);
      expect(line.igst).toBe(0);
      expect(line.discount).toBe(0);
      // Already-number fields pass through untouched.
      expect(line.unit_value).toBe(11.0833);
      expect(line.total_amount).toBe(248.27);
      // Header untouched by the transform.
      expect(result.data!.credit_txn_id).toBe(77);
      expect(result.data!.total_amount).toBe(248.27);
    });

    it('tolerates a response with no lines array', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        data: { id: 42, supplier_return_id: 42 },
        meta: okMeta,
      });
      const store = makeStore();
      const result = await store.dispatch(
        supplierReturnsApi.endpoints.getReturnDetails.initiate({ supplier_return_id: 42 })
      );
      expect(result.data!.lines).toEqual([]);
    });
  });

  describe('POST supplier-returns/record-credit-received', () => {
    it('builds the correct request (url/method/body) and returns the metadata payload', async () => {
      const mockResponse = {
        message: 'Credit received recorded',
        supplier_return_id: 42,
        return_number: 'SR-000042',
        return_status: 'CREDIT_RECEIVED' as const,
        credit_received: {
          amount: 33.6,
          date: '2026-08-11',
          reference: 'CN-9',
          by: 'currentUser',
        },
      };
      mockBaseQuery.mockResolvedValueOnce({ data: mockResponse, meta: okMeta });

      const body = {
        supplier_return_id: 42,
        amount: 33.6,
        date: '2026-08-11',
        reference: 'CN-9',
      };
      const store = makeStore();
      const result = await store.dispatch(
        supplierReturnsApi.endpoints.recordCreditReceived.initiate(body)
      );

      expect('data' in result && result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'supplier-returns/record-credit-received', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('surfaces the 409 non-AWAITING status conflict as an error result', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: {
          status: 409,
          data: {
            error: 'Credit can only be recorded while status is AWAITING_CREDIT (current: SETTLED)',
          },
        },
        meta: okMeta,
      });
      const store = makeStore();
      const result = await store.dispatch(
        supplierReturnsApi.endpoints.recordCreditReceived.initiate({
          supplier_return_id: 42,
          amount: 10,
          date: '2026-08-11',
        })
      );
      expect('error' in result && result.error).toBeDefined();
      expect(((result as { error: { status: number } }).error).status).toBe(409);
    });
  });

  describe('Endpoint & hook configuration', () => {
    it('defines all five endpoints', () => {
      expect(supplierReturnsApi.endpoints.getReturnableBatches).toBeDefined();
      expect(supplierReturnsApi.endpoints.submitReturn).toBeDefined();
      expect(supplierReturnsApi.endpoints.listReturns).toBeDefined();
      expect(supplierReturnsApi.endpoints.getReturnDetails).toBeDefined();
      expect(supplierReturnsApi.endpoints.recordCreditReceived).toBeDefined();
    });

    it('exports all five hooks', () => {
      expect(supplierReturnsApi.useGetReturnableBatchesQuery).toBeDefined();
      expect(supplierReturnsApi.useSubmitReturnMutation).toBeDefined();
      expect(supplierReturnsApi.useListReturnsQuery).toBeDefined();
      expect(supplierReturnsApi.useGetReturnDetailsQuery).toBeDefined();
      expect(supplierReturnsApi.useRecordCreditReceivedMutation).toBeDefined();
    });
  });
});
