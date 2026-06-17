import { salesApi } from '../salesApi';
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
      [salesApi.reducerPath]: salesApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(salesApi.middleware),
  });

const okMeta = {
  request: new Request('http://localhost:3000/api/sales'),
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

describe('Sales API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST sales/get-product-type (getProductType query)', () => {
    it('builds the correct request', async () => {
      mockOk([{ type: 'tablet' }]);
      const store = makeStore();
      const arg = { productID: 5 };
      const result = await store.dispatch(
        salesApi.endpoints.getProductType.initiate(arg)
      );

      expect(result.data).toEqual([{ type: 'tablet' }]);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/get-product-type', method: 'POST', body: arg },
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST sales/create-sales (createSales mutation)', () => {
    const body = {
      customerName: 'C',
      customerMobile: '999',
      customerCity: 'City',
      doctorName: 'D',
      doctorMobile: '888',
      doctorEmail: 'd@e.com',
      paymentMode: 'Cash',
      insuranceCompany: '',
      invoiceNumber: 'INV-1',
      invoiceDate: '2026-06-16',
      items: [],
      totalValue: '100',
      totalDiscount: '0',
      taxAmount: '5',
      totalPayableAmount: '105',
    };

    it('builds the correct request', async () => {
      mockOk({ id: 1, message: 'ok', invoiceNumber: 'INV-1' });
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.createSales.initiate(body)
      );

      expect(result.data).toEqual({ id: 1, message: 'ok', invoiceNumber: 'INV-1' });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/create-sales', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(400);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.createSales.initiate(body)
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(400);
    });
  });

  describe('GET sales/history (getSalesHistory query)', () => {
    it('calls baseQuery with the string url', async () => {
      mockOk([{ id: 1 }]);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.getSalesHistory.initiate()
      );

      expect(result.data).toEqual([{ id: 1 }]);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'sales/history',
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('GET sales/get-invoices (getInvoices query)', () => {
    it('calls baseQuery with the string url', async () => {
      mockOk([{ id: 1 }]);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.getInvoices.initiate()
      );

      expect(result.data).toEqual([{ id: 1 }]);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'sales/get-invoices',
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('GET sales/:id (getSalesById query)', () => {
    it('interpolates the id into the url string', async () => {
      mockOk({ id: 42 });
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.getSalesById.initiate({ id: 42 })
      );

      expect(result.data).toEqual({ id: 42 });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'sales/42',
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('PATCH sales/:id (updateSales mutation)', () => {
    it('interpolates id and sends data body', async () => {
      mockOk({ ok: true });
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.updateSales.initiate({
          id: 3,
          data: { customerName: 'X' },
        })
      );

      expect(result.data).toEqual({ ok: true });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/3', method: 'PATCH', body: { customerName: 'X' } },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(500);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.updateSales.initiate({ id: 3, data: {} })
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(500);
    });
  });

  describe('POST sales/edit-sale (editSale mutation)', () => {
    const body = {
      invoice_id: 1,
      invoice_number: 'INV-1',
      quantity: 1,
      disc: 0,
      payment_method: 'Cash',
      payment_amount: 100,
      created_by: 'me',
      customer_id: 2,
    };

    it('builds the correct request', async () => {
      mockOk({
        message: 'ok',
        invoice_id: 1,
        invoice_number: 'INV-1',
        total_amount: 100,
      });
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.editSale.initiate(body)
      );

      expect(result.data).toEqual({
        message: 'ok',
        invoice_id: 1,
        invoice_number: 'INV-1',
        total_amount: 100,
      });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/edit-sale', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(422);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.editSale.initiate(body)
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(422);
    });
  });

  describe('DELETE sales/:id (deleteSales mutation)', () => {
    it('interpolates id with DELETE method', async () => {
      mockOk({ message: 'deleted' });
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.deleteSales.initiate({ id: 9 })
      );

      expect(result.data).toEqual({ message: 'deleted' });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/9', method: 'DELETE' },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(404);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.deleteSales.initiate({ id: 9 })
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(404);
    });
  });

  describe('GET sales/get-doctors (getDoctors query)', () => {
    it('calls baseQuery with the string url and transforms array response', async () => {
      mockOk([{ id: 1, name: 'Dr A', mobile: '1' }]);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.getDoctors.initiate()
      );

      expect(result.data).toEqual([{ id: 1, name: 'Dr A', mobile: '1' }]);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'sales/get-doctors',
        expectExtraArgs,
        undefined
      );
    });

    it('transforms { doctors: [...] } response shape', async () => {
      mockOk({ doctors: [{ id: 2, name: 'Dr B', mobile: '2' }] });
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.getDoctors.initiate()
      );
      expect(result.data).toEqual([{ id: 2, name: 'Dr B', mobile: '2' }]);
    });
  });

  describe('GET sales/get-doctor-names (getDoctorNames query)', () => {
    it('calls baseQuery with the string url and maps id to string', async () => {
      mockOk([{ id: 5, name: 'Dr C' }]);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.getDoctorNames.initiate()
      );

      expect(result.data).toEqual([{ id: '5', name: 'Dr C' }]);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'sales/get-doctor-names',
        expectExtraArgs,
        undefined
      );
    });

    it('converts legacy string array into id/name objects', async () => {
      mockOk(['Dr X', 'Dr Y']);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.getDoctorNames.initiate()
      );
      expect(result.data).toEqual([
        { id: '1', name: 'Dr X' },
        { id: '2', name: 'Dr Y' },
      ]);
    });
  });

  describe('GET sales/doctors/:id (getDoctorById query)', () => {
    it('interpolates the doctor id into the url string', async () => {
      mockOk({ id: 7, name: 'Dr Z', mobile: '7' });
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.getDoctorById.initiate({ id: 7 })
      );

      expect(result.data).toEqual({ id: 7, name: 'Dr Z', mobile: '7' });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'sales/doctors/7',
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST sales/validate-sale (validateSale mutation)', () => {
    const body = {
      product_name: 'Prod',
      product_id: '1',
      quantity: 2,
      type: 'tablet',
      disc: 0,
    };

    it('builds the correct request', async () => {
      mockOk({ product_name: 'Prod', mrp: 10 });
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.validateSale.initiate(body)
      );

      expect(result.data).toEqual({ product_name: 'Prod', mrp: 10 });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/validate-sale', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(400);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.validateSale.initiate(body)
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(400);
    });
  });

  describe('GET sales/get-products (getSalesProducts query)', () => {
    it('calls baseQuery with the string url and transforms object response', async () => {
      mockOk([{ name: 'P', product_id: 3, currentQuantity: '12' }]);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.getSalesProducts.initiate()
      );

      expect(result.data).toEqual([{ name: 'P', id: 3, currentQuantity: 12 }]);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'sales/get-products',
        expectExtraArgs,
        undefined
      );
    });

    it('transforms tuple/array rows', async () => {
      mockOk([['P2', 4]]);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.getSalesProducts.initiate()
      );
      expect(result.data).toEqual([{ name: 'P2', id: 4, currentQuantity: 0 }]);
    });
  });

  describe('POST sales/submit-sale (submitSale mutation)', () => {
    const body = {
      quantity: 1,
      disc: 0,
      payment_method: 'Cash',
      payment_amount: 100,
      created_by: 'me',
      lines: [{ product_id: 1, quantity: 1, mrp: 10, sp: 9, discount: 0 }],
    };

    it('builds the correct request', async () => {
      mockOk({ message: 'ok', invoice_number: 1, lines: [] });
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.submitSale.initiate(body)
      );

      expect(result.data).toEqual({ message: 'ok', invoice_number: 1, lines: [] });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/submit-sale', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(409);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.submitSale.initiate(body)
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(409);
    });
  });

  describe('POST sales/add-customer (addCustomer mutation)', () => {
    const body = {
      name: 'C',
      email: null,
      phone: '999',
      billing_address: 'Addr',
      shipping_address: null,
      gstin: null,
      pancard_num: null,
      drug_license: null,
      gender: null,
    };

    it('builds the correct request', async () => {
      mockOk({ message: 'ok', id: '1', name: 'C' });
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.addCustomer.initiate(body)
      );

      expect(result.data).toEqual({ message: 'ok', id: '1', name: 'C' });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/add-customer', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(400);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.addCustomer.initiate(body)
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(400);
    });
  });

  describe('GET sales/get-all-customer-names (getAllCustomerNames query)', () => {
    it('calls baseQuery with the string url', async () => {
      mockOk(['Alice', 'Bob']);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.getAllCustomerNames.initiate()
      );

      expect(result.data).toEqual(['Alice', 'Bob']);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'sales/get-all-customer-names',
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('GET sales/get-customers (getCustomers query)', () => {
    it('calls baseQuery with the string url', async () => {
      mockOk([{ id: 1, name: 'C', mobile: '1' }]);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.getCustomers.initiate()
      );

      expect(result.data).toEqual([{ id: 1, name: 'C', mobile: '1' }]);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'sales/get-customers',
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST sales/get-customer-phones/ (getCustomerPhones mutation)', () => {
    it('builds the correct request with trailing slash url', async () => {
      mockOk({ name: 'C', phones: ['999'] });
      const store = makeStore();
      const body = { name: 'C' };
      const result = await store.dispatch(
        salesApi.endpoints.getCustomerPhones.initiate(body)
      );

      expect(result.data).toEqual({ name: 'C', phones: ['999'] });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/get-customer-phones/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST sales/get-doctor-phones-and-emails/ (getDoctorPhonesAndEmails mutation)', () => {
    it('builds the correct request with trailing slash url', async () => {
      mockOk({ name: 'Dr', info: [] });
      const store = makeStore();
      const body = { name: 'Dr' };
      const result = await store.dispatch(
        salesApi.endpoints.getDoctorPhonesAndEmails.initiate(body)
      );

      expect(result.data).toEqual({ name: 'Dr', info: [] });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/get-doctor-phones-and-emails/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST sales/get-batch-numbers-by-product-id (getBatchNumbersByProductId mutation)', () => {
    it('builds the correct request', async () => {
      mockOk({ batches: [] });
      const store = makeStore();
      const body = { product_id: 5 };
      const result = await store.dispatch(
        salesApi.endpoints.getBatchNumbersByProductId.initiate(body)
      );

      expect(result.data).toEqual({ batches: [] });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/get-batch-numbers-by-product-id', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST sales/get-invoice-details/ (getInvoiceDetails mutation)', () => {
    it('builds the correct request with trailing slash url', async () => {
      mockOk({ invoice_id: 1 });
      const store = makeStore();
      const body = { invoice_number: 'INV-1' };
      const result = await store.dispatch(
        salesApi.endpoints.getInvoiceDetails.initiate(body)
      );

      expect(result.data).toEqual({ invoice_id: 1 });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/get-invoice-details/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST sales/submit-sales-return/ (submitSalesReturn mutation)', () => {
    const body = {
      invoice_number: 'INV-1',
      created_by: 'me',
      reason: 'damaged',
      notes: '',
      lines: [
        {
          invoice_line_id: 1,
          batch_number: 'B1',
          quantity: 1,
          restock_action: 'restock',
        },
      ],
    };

    it('builds the correct request with trailing slash url', async () => {
      mockOk({ message: 'ok' });
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.submitSalesReturn.initiate(body)
      );

      expect(result.data).toEqual({ message: 'ok' });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/submit-sales-return/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(400);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.submitSalesReturn.initiate(body)
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(400);
    });
  });

  describe('POST sales/upsert-invoice-payments/ (upsertInvoicePayments mutation)', () => {
    it('builds the correct request with trailing slash url', async () => {
      mockOk({ ok: true });
      const store = makeStore();
      const body = {
        invoice_id: 1,
        created_by: 'me',
        payments: [{ payment_method: 'Cash', payment_amount: 100 }],
      };
      const result = await store.dispatch(
        salesApi.endpoints.upsertInvoicePayments.initiate(body)
      );

      expect(result.data).toEqual({ ok: true });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/upsert-invoice-payments/', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });
  });

  describe('POST sales/delete-invoice (deleteInvoice mutation)', () => {
    const body = {
      invoice_id: 1,
      deleted_by: 'me',
      deletion_reason: 'mistake',
    };

    it('builds the correct request', async () => {
      mockOk({ message: 'deleted' });
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.deleteInvoice.initiate(body)
      );

      expect(result.data).toEqual({ message: 'deleted' });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/delete-invoice', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(403);
      const store = makeStore();
      const result = await store.dispatch(
        salesApi.endpoints.deleteInvoice.initiate(body)
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(403);
    });
  });

  describe('Endpoint Configuration', () => {
    it('defines all endpoints', () => {
      expect(salesApi.endpoints.getProductType).toBeDefined();
      expect(salesApi.endpoints.createSales).toBeDefined();
      expect(salesApi.endpoints.getSalesHistory).toBeDefined();
      expect(salesApi.endpoints.getInvoices).toBeDefined();
      expect(salesApi.endpoints.getSalesById).toBeDefined();
      expect(salesApi.endpoints.updateSales).toBeDefined();
      expect(salesApi.endpoints.editSale).toBeDefined();
      expect(salesApi.endpoints.deleteSales).toBeDefined();
      expect(salesApi.endpoints.getDoctors).toBeDefined();
      expect(salesApi.endpoints.getDoctorNames).toBeDefined();
      expect(salesApi.endpoints.getDoctorById).toBeDefined();
      expect(salesApi.endpoints.validateSale).toBeDefined();
      expect(salesApi.endpoints.getSalesProducts).toBeDefined();
      expect(salesApi.endpoints.submitSale).toBeDefined();
      expect(salesApi.endpoints.addCustomer).toBeDefined();
      expect(salesApi.endpoints.getAllCustomerNames).toBeDefined();
      expect(salesApi.endpoints.getCustomers).toBeDefined();
      expect(salesApi.endpoints.getCustomerPhones).toBeDefined();
      expect(salesApi.endpoints.getDoctorPhonesAndEmails).toBeDefined();
      expect(salesApi.endpoints.getBatchNumbersByProductId).toBeDefined();
      expect(salesApi.endpoints.getInvoiceDetails).toBeDefined();
      expect(salesApi.endpoints.submitSalesReturn).toBeDefined();
      expect(salesApi.endpoints.upsertInvoicePayments).toBeDefined();
      expect(salesApi.endpoints.deleteInvoice).toBeDefined();
    });

    it('exports all hooks', () => {
      expect(salesApi.useGetProductTypeQuery).toBeDefined();
      expect(salesApi.useCreateSalesMutation).toBeDefined();
      expect(salesApi.useGetSalesHistoryQuery).toBeDefined();
      expect(salesApi.useGetInvoicesQuery).toBeDefined();
      expect(salesApi.useGetSalesByIdQuery).toBeDefined();
      expect(salesApi.useUpdateSalesMutation).toBeDefined();
      expect(salesApi.useEditSaleMutation).toBeDefined();
      expect(salesApi.useDeleteSalesMutation).toBeDefined();
      expect(salesApi.useGetDoctorsQuery).toBeDefined();
      expect(salesApi.useGetDoctorNamesQuery).toBeDefined();
      expect(salesApi.useGetDoctorByIdQuery).toBeDefined();
      expect(salesApi.useValidateSaleMutation).toBeDefined();
      expect(salesApi.useGetSalesProductsQuery).toBeDefined();
      expect(salesApi.useSubmitSaleMutation).toBeDefined();
      expect(salesApi.useAddCustomerMutation).toBeDefined();
      expect(salesApi.useGetAllCustomerNamesQuery).toBeDefined();
      expect(salesApi.useGetCustomersQuery).toBeDefined();
      expect(salesApi.useGetCustomerPhonesMutation).toBeDefined();
      expect(salesApi.useGetDoctorPhonesAndEmailsMutation).toBeDefined();
      expect(salesApi.useGetBatchNumbersByProductIdMutation).toBeDefined();
      expect(salesApi.useGetInvoiceDetailsMutation).toBeDefined();
      expect(salesApi.useSubmitSalesReturnMutation).toBeDefined();
      expect(salesApi.useUpsertInvoicePaymentsMutation).toBeDefined();
      expect(salesApi.useDeleteInvoiceMutation).toBeDefined();
    });
  });
});
