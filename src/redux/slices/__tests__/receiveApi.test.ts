import { receiveApi } from '../receiveApi';
import { baseQueryWithReauth } from '../../baseQuery';
import { configureStore } from '@reduxjs/toolkit';

// Mock the baseQueryWithReauth
jest.mock('../../baseQuery', () => ({
  baseQueryWithReauth: jest.fn(),
}));

const mockBaseQuery = baseQueryWithReauth as jest.MockedFunction<
  typeof baseQueryWithReauth
>;

const makeStore = () =>
  configureStore({
    reducer: {
      [receiveApi.reducerPath]: receiveApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(receiveApi.middleware),
  });

const okMeta = {
  request: new Request('http://localhost:3000/api/receive'),
  response: { status: 200, statusText: 'OK' } as Response,
};

const expectExtraArgs = expect.objectContaining({
  dispatch: expect.any(Function),
  getState: expect.any(Function),
});

const mockOk = (data: unknown) =>
  mockBaseQuery.mockResolvedValueOnce({ data: data as any, meta: okMeta });

const mockErr = (status: number) =>
  mockBaseQuery.mockResolvedValueOnce({
    error: { status, data: { message: 'error' } },
    meta: okMeta,
  });

describe('Receive API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET receive/current-purchase-orders/ (getCurrentPurchaseOrders query)', () => {
    it('calls baseQuery with the string url', async () => {
      mockOk([{ po_number: 'PO-1' }]);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.getCurrentPurchaseOrders.initiate()
      );

      expect(result.data).toEqual([{ po_number: 'PO-1' }]);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'receive/current-purchase-orders/',
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('GET receive/unique-supplier-names/ (getUniqueSupplierNames query)', () => {
    it('calls baseQuery with the string url', async () => {
      mockOk([{ supplier_name: 'S', supplier_id: 1 }]);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.getUniqueSupplierNames.initiate()
      );

      expect(result.data).toEqual([{ supplier_name: 'S', supplier_id: 1 }]);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'receive/unique-supplier-names/',
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST receive/receipts-for-supplier/ (getReceiptsForSupplier mutation)', () => {
    it('builds the correct request', async () => {
      mockOk([]);
      const store = makeStore();
      const body = { supplierID: 5 };
      const result = await store.dispatch(
        receiveApi.endpoints.getReceiptsForSupplier.initiate(body)
      );

      expect(result.data).toEqual([]);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'receive/receipts-for-supplier/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(400);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.getReceiptsForSupplier.initiate({ supplierID: 5 })
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(400);
    });
  });

  describe('PATCH receive/purchase-orders/:poNumber/ (updatePurchaseOrder mutation)', () => {
    it('url-encodes poNumber and sends changes as body', async () => {
      mockOk({ po_number: 'PO/1' });
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.updatePurchaseOrder.initiate({
          poNumber: 'PO/1',
          changes: { status: 'received' },
        })
      );

      expect(result.data).toEqual({ po_number: 'PO/1' });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        {
          url: `receive/purchase-orders/${encodeURIComponent('PO/1')}/`,
          method: 'PATCH',
          body: { status: 'received' },
        },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(404);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.updatePurchaseOrder.initiate({
          poNumber: 'PO-1',
          changes: {},
        })
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(404);
    });
  });

  describe('DELETE receive/purchase-orders/:poNumber/ (deletePurchaseOrder mutation)', () => {
    it('url-encodes poNumber with DELETE method', async () => {
      mockOk(null);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.deletePurchaseOrder.initiate({ poNumber: 'PO 1' })
      );

      expect(result.error).toBeUndefined();
      expect(mockBaseQuery).toHaveBeenCalledWith(
        {
          url: `receive/purchase-orders/${encodeURIComponent('PO 1')}/`,
          method: 'DELETE',
        },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(404);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.deletePurchaseOrder.initiate({ poNumber: 'PO-1' })
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(404);
    });
  });

  describe('GET receive/get-receipts/ (getReceipts query)', () => {
    it('calls baseQuery with the string url', async () => {
      mockOk([]);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.getReceipts.initiate()
      );

      expect(result.data).toEqual([]);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'receive/get-receipts/',
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST receive/edit-receipt/ (editReceipt mutation)', () => {
    const body = {
      receipt_id: 1,
      po_id: 1,
      supplier_name: 'S',
      supplier_id: 1,
      po_number: 'PO-1',
      payment_method: 'Cash',
      payment_vendor: '',
      transaction_number: '',
      notes: '',
      created_by: 'me',
      Deleted: [],
      Added: [],
      Edited: [],
    };

    it('builds the correct request', async () => {
      mockOk({ id: 1 });
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.editReceipt.initiate(body)
      );

      expect(result.data).toEqual({ id: 1 });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'receive/edit-receipt/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(422);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.editReceipt.initiate(body)
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(422);
    });
  });

  describe('POST receive/delete-receipts/ (deleteReceipt mutation)', () => {
    it('builds the correct request', async () => {
      mockOk({ message: 'deleted' });
      const store = makeStore();
      const body = { id: 3 };
      const result = await store.dispatch(
        receiveApi.endpoints.deleteReceipt.initiate(body)
      );

      expect(result.data).toEqual({ message: 'deleted' });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'receive/delete-receipts/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(404);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.deleteReceipt.initiate({ id: 3 })
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(404);
    });
  });

  describe('POST receive/get-receipt-lines/ (getReceiptLines query)', () => {
    it('builds the correct request', async () => {
      mockOk([]);
      const store = makeStore();
      const body = { receipt_id: 1 };
      const result = await store.dispatch(
        receiveApi.endpoints.getReceiptLines.initiate(body)
      );

      expect(result.data).toEqual([]);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'receive/get-receipt-lines/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST receive/edit-receipt-line-quantity/ (editReceiptLineQuantity mutation)', () => {
    it('builds the correct request', async () => {
      mockOk({ id: 1, received_qty: 5 });
      const store = makeStore();
      const body = { id: 1, received_qty: 5 };
      const result = await store.dispatch(
        receiveApi.endpoints.editReceiptLineQuantity.initiate(body)
      );

      expect(result.data).toEqual({ id: 1, received_qty: 5 });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'receive/edit-receipt-line-quantity/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(400);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.editReceiptLineQuantity.initiate({
          id: 1,
          received_qty: 5,
        })
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(400);
    });
  });

  describe('POST receive/delete-receipt-line/ (deleteReceiptLine mutation)', () => {
    it('builds the correct request', async () => {
      mockOk({ message: 'deleted' });
      const store = makeStore();
      const body = { id: 2 };
      const result = await store.dispatch(
        receiveApi.endpoints.deleteReceiptLine.initiate(body)
      );

      expect(result.data).toEqual({ message: 'deleted' });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'receive/delete-receipt-line/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(404);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.deleteReceiptLine.initiate({ id: 2 })
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(404);
    });
  });

  describe('POST receive/submit-receipt/ (submitReceipt mutation)', () => {
    const body = {
      supplier_name: 'S',
      supplier_id: 1,
      po_number: 'PO-1',
      notes: '',
      created_by: 'me',
      lines: [
        {
          product: 'P',
          product_id: 1,
          received_qty: 10,
          free_qty: 0,
          expiry_date: '2027-01-01',
          purchase_price: 5,
          cgst: 1,
          sgst: 1,
          igst: 0,
          discount: 0,
        },
      ],
    };

    it('builds the correct request', async () => {
      mockOk({
        message: 'ok',
        po_id: 1,
        receipt_id: 2,
        total_amount: 50,
        amount_paid: 0,
        amount_due: 50,
        payment_status: 'unpaid',
      });
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.submitReceipt.initiate(body)
      );

      expect((result.data as { receipt_id: number }).receipt_id).toBe(2);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'receive/submit-receipt/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(409);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.submitReceipt.initiate(body)
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(409);
    });
  });

  describe('GET receive/get-products/ (getProducts query)', () => {
    it('calls baseQuery with the string url and transforms object rows', async () => {
      mockOk([{ name: 'P', product_id: 3, currentQuantity: '12' }]);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.getProducts.initiate()
      );

      expect(result.data).toEqual([{ name: 'P', id: 3, currentQuantity: 12 }]);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'receive/get-products/',
        expectExtraArgs,
        undefined
      );
    });

    it('transforms tuple rows and filters invalid entries', async () => {
      mockOk([['P2', 4, '7'], ['', 5]]);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.getProducts.initiate()
      );
      expect(result.data).toEqual([{ name: 'P2', id: 4, currentQuantity: 7 }]);
    });
  });

  describe('POST receive/:receiptId/upload-file/ (uploadReceiptFile mutation)', () => {
    it('interpolates receiptId and sends FormData body', async () => {
      mockOk({
        message: 'ok',
        receipt_id: 8,
        receipt_file_url: 'http://x/file',
        receipt_file_type: 'pdf',
        receipt_file_name: 'f.pdf',
        size_bytes: 10,
      });
      const store = makeStore();
      const file = new File(['data'], 'f.pdf', { type: 'application/pdf' });
      const result = await store.dispatch(
        receiveApi.endpoints.uploadReceiptFile.initiate({ receiptId: 8, file })
      );

      expect((result.data as { receipt_id: number }).receipt_id).toBe(8);

      const callArg = mockBaseQuery.mock.calls[0][0] as {
        url: string;
        method: string;
        body: FormData;
      };
      expect(callArg.url).toBe('receive/8/upload-file/');
      expect(callArg.method).toBe('POST');
      expect(callArg.body).toBeInstanceOf(FormData);
      expect((callArg.body as FormData).get('file')).toBe(file);
    });

    it('handles error', async () => {
      mockErr(400);
      const store = makeStore();
      const file = new File(['data'], 'f.pdf', { type: 'application/pdf' });
      const result = await store.dispatch(
        receiveApi.endpoints.uploadReceiptFile.initiate({ receiptId: 8, file })
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(400);
    });
  });

  describe('GET receive/:receiptId/file/ (getReceiptFile query)', () => {
    it('interpolates receiptId and provides a responseHandler', async () => {
      const blob = new Blob(['x']);
      mockOk(blob);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.getReceiptFile.initiate(9)
      );

      expect(result.data).toBe(blob);
      const callArg = mockBaseQuery.mock.calls[0][0] as {
        url: string;
        responseHandler: unknown;
      };
      expect(callArg.url).toBe('receive/9/file/');
      expect(typeof callArg.responseHandler).toBe('function');
    });
  });

  describe('POST receive/upsert-purchase-order-payments/ (upsertPurchaseOrderPayments mutation)', () => {
    const body = {
      receipt_id: 1,
      created_by: 'me',
      payments: [
        {
          payment_method: 'Cash',
          payment_vendor: null,
          transaction_number: 'TX-1',
          transaction_date: '2026-06-16',
          payment_amount: 100,
          details: '',
        },
      ],
    };

    it('builds the correct request', async () => {
      mockOk({ message: 'ok' });
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.upsertPurchaseOrderPayments.initiate(body)
      );

      expect(result.data).toEqual({ message: 'ok' });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'receive/upsert-purchase-order-payments/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(400);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.upsertPurchaseOrderPayments.initiate(body)
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(400);
    });
  });

  describe('POST receive/get-purchase-order-payments/ (getPurchaseOrderPayments mutation)', () => {
    it('builds the correct request', async () => {
      mockOk({
        po: { po_id: 1, po_number: 'PO-1', supplier_id: 1, total_amount: '100' },
        payments: [],
        total_paid: 0,
        amount_left_to_pay: 100,
      });
      const store = makeStore();
      const body = { po_id: 1 };
      const result = await store.dispatch(
        receiveApi.endpoints.getPurchaseOrderPayments.initiate(body)
      );

      expect((result.data as { total_paid: number }).total_paid).toBe(0);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'receive/get-purchase-order-payments/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST receive/get-supplier-credit-balance/ (getSupplierCreditBalance query)', () => {
    it('builds the correct request', async () => {
      mockOk({ supplier_id: 1, available_credit: 50, last_txn_id: null });
      const store = makeStore();
      const body = { supplier_id: 1 };
      const result = await store.dispatch(
        receiveApi.endpoints.getSupplierCreditBalance.initiate(body)
      );

      expect(result.data).toEqual({
        supplier_id: 1,
        available_credit: 50,
        last_txn_id: null,
      });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'receive/get-supplier-credit-balance/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST receive/adjust-supplier-credit/ (adjustSupplierCredit mutation)', () => {
    const body = {
      supplier_id: 1,
      direction: 'IN' as const,
      amount: 100,
      credit_type: 'advance',
      notes: '',
      created_by: 'me',
    };

    it('builds the correct request', async () => {
      mockOk({ ok: true });
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.adjustSupplierCredit.initiate(body)
      );

      expect(result.data).toEqual({ ok: true });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'receive/adjust-supplier-credit/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(400);
      const store = makeStore();
      const result = await store.dispatch(
        receiveApi.endpoints.adjustSupplierCredit.initiate(body)
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(400);
    });
  });

  describe('Endpoint Configuration', () => {
    it('defines all endpoints', () => {
      expect(receiveApi.endpoints.getCurrentPurchaseOrders).toBeDefined();
      expect(receiveApi.endpoints.getUniqueSupplierNames).toBeDefined();
      expect(receiveApi.endpoints.getReceiptsForSupplier).toBeDefined();
      expect(receiveApi.endpoints.updatePurchaseOrder).toBeDefined();
      expect(receiveApi.endpoints.deletePurchaseOrder).toBeDefined();
      expect(receiveApi.endpoints.getReceipts).toBeDefined();
      expect(receiveApi.endpoints.editReceipt).toBeDefined();
      expect(receiveApi.endpoints.deleteReceipt).toBeDefined();
      expect(receiveApi.endpoints.getReceiptLines).toBeDefined();
      expect(receiveApi.endpoints.editReceiptLineQuantity).toBeDefined();
      expect(receiveApi.endpoints.deleteReceiptLine).toBeDefined();
      expect(receiveApi.endpoints.submitReceipt).toBeDefined();
      expect(receiveApi.endpoints.getProducts).toBeDefined();
      expect(receiveApi.endpoints.uploadReceiptFile).toBeDefined();
      expect(receiveApi.endpoints.getReceiptFile).toBeDefined();
      expect(receiveApi.endpoints.upsertPurchaseOrderPayments).toBeDefined();
      expect(receiveApi.endpoints.getPurchaseOrderPayments).toBeDefined();
      expect(receiveApi.endpoints.getSupplierCreditBalance).toBeDefined();
      expect(receiveApi.endpoints.adjustSupplierCredit).toBeDefined();
    });

    it('exports all hooks', () => {
      expect(receiveApi.useGetCurrentPurchaseOrdersQuery).toBeDefined();
      expect(receiveApi.useGetUniqueSupplierNamesQuery).toBeDefined();
      expect(receiveApi.useGetReceiptsForSupplierMutation).toBeDefined();
      expect(receiveApi.useUpdatePurchaseOrderMutation).toBeDefined();
      expect(receiveApi.useDeletePurchaseOrderMutation).toBeDefined();
      expect(receiveApi.useGetReceiptsQuery).toBeDefined();
      expect(receiveApi.useEditReceiptMutation).toBeDefined();
      expect(receiveApi.useDeleteReceiptMutation).toBeDefined();
      expect(receiveApi.useGetReceiptLinesQuery).toBeDefined();
      expect(receiveApi.useEditReceiptLineQuantityMutation).toBeDefined();
      expect(receiveApi.useDeleteReceiptLineMutation).toBeDefined();
      expect(receiveApi.useSubmitReceiptMutation).toBeDefined();
      expect(receiveApi.useGetProductsQuery).toBeDefined();
      expect(receiveApi.useUploadReceiptFileMutation).toBeDefined();
      expect(receiveApi.useGetReceiptFileQuery).toBeDefined();
      expect(receiveApi.useUpsertPurchaseOrderPaymentsMutation).toBeDefined();
      expect(receiveApi.useGetPurchaseOrderPaymentsMutation).toBeDefined();
      expect(receiveApi.useGetSupplierCreditBalanceQuery).toBeDefined();
      expect(receiveApi.useAdjustSupplierCreditMutation).toBeDefined();
    });
  });
});
