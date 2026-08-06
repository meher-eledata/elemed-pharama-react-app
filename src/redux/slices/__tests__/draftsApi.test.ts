import { draftsApi } from '../draftsApi';
import { baseQueryWithReauth } from '../../baseQuery';
import { configureStore } from '@reduxjs/toolkit';

// Mock the baseQueryWithReauth so we can assert the exact request each endpoint builds
// (mirrors src/redux/slices/__tests__/salesApi.test.ts).
jest.mock('../../baseQuery', () => ({
  baseQueryWithReauth: jest.fn(),
}));

const mockBaseQuery = baseQueryWithReauth as jest.MockedFunction<
  typeof baseQueryWithReauth
>;

const makeStore = () =>
  configureStore({
    reducer: {
      [draftsApi.reducerPath]: draftsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(draftsApi.middleware),
  });

const okMeta = {
  request: new Request('http://localhost:3000/api/sales/drafts'),
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

// A representative loss-free payload snapshot (shape only — not asserted field-by-field here).
const payload = {
  formData: null,
  items: [],
  financials: {
    totalValue: '100',
    totalDiscount: '0',
    taxAmount: '5',
    totalPayableAmount: '105',
  },
  splitPayments: [],
  doctorId: 2,
  patientType: 'OPD',
};

describe('Drafts API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST sales/drafts (createDraft mutation)', () => {
    const body = {
      customer_id: 7,
      customer_name: 'John Doe',
      customer_phone: '5551231000',
      invoice_number: 'INV-1',
      invoice_date: '2026-08-04',
      // request sends a NUMBER; node-postgres returns it as a DECIMAL string on read.
      total_amount: 105,
      item_count: 3,
      payload,
    };

    it('builds the correct request', async () => {
      mockOk({ id: 1, status: 'DRAFT', created_at: 't', updated_at: 't' });
      const store = makeStore();
      const result = await store.dispatch(
        draftsApi.endpoints.createDraft.initiate(body)
      );

      expect(result.data).toEqual({
        id: 1,
        status: 'DRAFT',
        created_at: 't',
        updated_at: 't',
      });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/drafts', method: 'POST', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(400);
      const store = makeStore();
      const result = await store.dispatch(
        draftsApi.endpoints.createDraft.initiate(body)
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(400);
    });
  });

  describe('GET sales/drafts (getDrafts query)', () => {
    it('calls baseQuery with the string url', async () => {
      mockOk({ drafts: [] });
      const store = makeStore();
      await store.dispatch(draftsApi.endpoints.getDrafts.initiate());

      expect(mockBaseQuery).toHaveBeenCalledWith(
        'sales/drafts',
        expectExtraArgs,
        undefined
      );
    });

    it('transformResponse unwraps res.drafts into a bare array', async () => {
      const rows = [
        {
          id: 1,
          customer_name: 'John Doe',
          customer_phone: '5551231000',
          invoice_number: 'INV-1',
          invoice_date: '2026-08-04',
          total_amount: '1000.50',
          item_count: 3,
          status: 'DRAFT',
          created_at: 't',
          updated_at: 't',
        },
      ];
      mockOk({ drafts: rows });
      const store = makeStore();
      const result = await store.dispatch(
        draftsApi.endpoints.getDrafts.initiate()
      );

      // The { drafts: [...] } envelope is stripped — the caller gets the array directly.
      expect(result.data).toEqual(rows);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('keeps total_amount as a string (the DECIMAL-as-string fix)', async () => {
      mockOk({
        drafts: [
          {
            id: 1,
            customer_name: null,
            customer_phone: null,
            invoice_number: null,
            invoice_date: null,
            total_amount: '1000.50',
            item_count: null,
            status: 'DRAFT',
            created_at: 't',
            updated_at: 't',
          },
        ],
      });
      const store = makeStore();
      const result = await store.dispatch(
        draftsApi.endpoints.getDrafts.initiate()
      );

      const amount = result.data![0].total_amount;
      // node-postgres serialises DECIMAL as a string; the slice must NOT coerce it to a number.
      expect(typeof amount).toBe('string');
      expect(amount).toBe('1000.50');
    });

    it('transformResponse defaults to an empty array when drafts is missing', async () => {
      mockOk({});
      const store = makeStore();
      const result = await store.dispatch(
        draftsApi.endpoints.getDrafts.initiate()
      );
      expect(result.data).toEqual([]);
    });

    it('handles error', async () => {
      mockErr(500);
      const store = makeStore();
      const result = await store.dispatch(
        draftsApi.endpoints.getDrafts.initiate()
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(500);
    });
  });

  describe('GET sales/drafts/:id (getDraft query)', () => {
    it('interpolates the id into the url string', async () => {
      const detail = {
        id: 7,
        customer_name: 'John Doe',
        customer_phone: '5551231000',
        invoice_number: 'INV-1',
        invoice_date: '2026-08-04',
        total_amount: '105.00',
        item_count: 3,
        status: 'DRAFT',
        created_at: 't',
        updated_at: 't',
        payload,
      };
      mockOk(detail);
      const store = makeStore();
      const result = await store.dispatch(
        draftsApi.endpoints.getDraft.initiate(7)
      );

      expect(result.data).toEqual(detail);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        'sales/drafts/7',
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(404);
      const store = makeStore();
      const result = await store.dispatch(
        draftsApi.endpoints.getDraft.initiate(7)
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(404);
    });
  });

  describe('PUT sales/drafts/:id (updateDraft mutation)', () => {
    const body = {
      customer_name: 'Jane Doe',
      customer_phone: '5559998888',
      invoice_number: 'INV-2',
      invoice_date: '2026-08-04',
      total_amount: 250,
      item_count: 5,
      payload,
    };

    it('interpolates id and sends the body without the id field', async () => {
      mockOk({ id: 5, updated_at: 't' });
      const store = makeStore();
      const result = await store.dispatch(
        draftsApi.endpoints.updateDraft.initiate({ id: 5, ...body })
      );

      expect(result.data).toEqual({ id: 5, updated_at: 't' });
      // id is pulled out of the body and used only in the URL.
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/drafts/5', method: 'PUT', body },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(404);
      const store = makeStore();
      const result = await store.dispatch(
        draftsApi.endpoints.updateDraft.initiate({ id: 5, ...body })
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(404);
    });
  });

  describe('DELETE sales/drafts/:id (deleteDraft mutation)', () => {
    it('interpolates id with the DELETE method', async () => {
      mockOk({ message: 'deleted', id: 9 });
      const store = makeStore();
      const result = await store.dispatch(
        draftsApi.endpoints.deleteDraft.initiate(9)
      );

      expect(result.data).toEqual({ message: 'deleted', id: 9 });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'sales/drafts/9', method: 'DELETE' },
        expectExtraArgs,
        undefined
      );
    });

    it('handles error', async () => {
      mockErr(404);
      const store = makeStore();
      const result = await store.dispatch(
        draftsApi.endpoints.deleteDraft.initiate(9)
      );
      expect(result.error).toBeDefined();
      expect((result.error as { status: number }).status).toBe(404);
    });
  });

  describe('Endpoint Configuration', () => {
    it('defines all five endpoints', () => {
      expect(draftsApi.endpoints.createDraft).toBeDefined();
      expect(draftsApi.endpoints.getDrafts).toBeDefined();
      expect(draftsApi.endpoints.getDraft).toBeDefined();
      expect(draftsApi.endpoints.updateDraft).toBeDefined();
      expect(draftsApi.endpoints.deleteDraft).toBeDefined();
    });

    it('exports all hooks', () => {
      expect(draftsApi.useCreateDraftMutation).toBeDefined();
      expect(draftsApi.useGetDraftsQuery).toBeDefined();
      expect(draftsApi.useGetDraftQuery).toBeDefined();
      expect(draftsApi.useLazyGetDraftQuery).toBeDefined();
      expect(draftsApi.useUpdateDraftMutation).toBeDefined();
      expect(draftsApi.useDeleteDraftMutation).toBeDefined();
    });
  });
});
