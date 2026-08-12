import { reportsApi } from '../reportsApi';
import { baseQueryWithReauth } from '../../baseQuery';
import { configureStore } from '@reduxjs/toolkit';

// Mock the baseQueryWithReauth
jest.mock('../../baseQuery', () => ({
  baseQueryWithReauth: jest.fn(),
}));

const mockBaseQuery = baseQueryWithReauth as jest.MockedFunction<typeof baseQueryWithReauth>;

const makeStore = () =>
  configureStore({
    reducer: {
      [reportsApi.reducerPath]: reportsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(reportsApi.middleware),
  });

const apiObject = expect.objectContaining({
  dispatch: expect.any(Function),
  getState: expect.any(Function),
});

const mockMeta = (status: number, statusText: string, url: string) => ({
  request: new Request(`http://localhost:3000/api/${url}`),
  response: { status, statusText } as Response,
});

describe('Reports API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST reports/dailySalesReport/get-daily-sales-report (getDailySalesReport)', () => {
    // Range request: inclusive [start_date, end_date]
    const body = { start_date: '2026-06-16', end_date: '2026-06-18' };

    it('should successfully fetch the daily sales report', async () => {
      const mockResponse = {
        total_bills: '5',
        inpatient_bills: 2,
        outpatient_bills: 3,
        total_sales: '1000',
        inpatient_sales: '400',
        outpatient_sales: '600',
        total_discount: '50',
        inpatient_discount: '20',
        outpatient_discount: '30',
        cash_in_hand_total: 950,
        cash_in_hand_inpatient: 380,
        cash_in_hand_outpatient: 570,
        total_tax: '90',
        inpatient_tax: '36',
        outpatient_tax: '54',
        total_cgst: '45',
        total_sgst: '45',
        total_igst: '0',
        payment_method_breakdown: [],
      };
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'reports/dailySalesReport/get-daily-sales-report'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        reportsApi.endpoints.getDailySalesReport.initiate(body)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'reports/dailySalesReport/get-daily-sales-report', method: 'POST', body },
        apiObject,
        undefined
      );
    });

    it('should handle error when fetching the daily sales report fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'reports/dailySalesReport/get-daily-sales-report'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        reportsApi.endpoints.getDailySalesReport.initiate(body)
      );

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(500);
      }
    });
  });

  describe('POST reports/dailySalesReport/get-weekly-bill-counts (getWeeklyBillCounts)', () => {
    const body = { end_date: '2026-06-16' };

    it('should successfully fetch weekly bill counts', async () => {
      const mockResponse = [
        { day: 'Monday', inpatient_bills: '2', outpatient_bills: '3', total_bills: '5' },
      ];
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'reports/dailySalesReport/get-weekly-bill-counts'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        reportsApi.endpoints.getWeeklyBillCounts.initiate(body)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'reports/dailySalesReport/get-weekly-bill-counts', method: 'POST', body },
        apiObject,
        undefined
      );
    });

    it('should handle error when fetching weekly bill counts fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'reports/dailySalesReport/get-weekly-bill-counts'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        reportsApi.endpoints.getWeeklyBillCounts.initiate(body)
      );

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(500);
      }
    });
  });

  describe('POST reports/dailySalesReport/get-daily-sales-table (getDailySalesTable)', () => {
    // Range request: inclusive [start_date, end_date]
    const body = { start_date: '2026-06-16', end_date: '2026-06-18' };

    it('should successfully fetch the daily sales table', async () => {
      const mockResponse = [
        {
          transaction_date: '2026-06-16',
          invoice_number: 'INV-1',
          customer_name: 'John',
          doctor_name: 'Dr. Smith',
          payment_type: 'cash',
          sales_amount: '100',
          discount_amount: '5',
          cgst: '4.5',
          sgst: '4.5',
          igst: '0',
          total_amount: '104',
          patient_type: 'outpatient',
        },
      ];
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'reports/dailySalesReport/get-daily-sales-table'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        reportsApi.endpoints.getDailySalesTable.initiate(body)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'reports/dailySalesReport/get-daily-sales-table', method: 'POST', body },
        apiObject,
        undefined
      );
    });

    it('should handle error when fetching the daily sales table fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'reports/dailySalesReport/get-daily-sales-table'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        reportsApi.endpoints.getDailySalesTable.initiate(body)
      );

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(500);
      }
    });
  });

  describe('POST reports/salesTax/get-sales-tax-report (getSalesTaxReport, level "invoice")', () => {
    const body = { start_date: '2026-07-01', end_date: '2026-07-29', level: 'invoice' as const };

    it('should fetch invoice-level rows (money fields as pg numeric-strings)', async () => {
      const mockResponse = {
        level: 'invoice',
        rows: [
          {
            invoice_id: 12,
            invoice_number: 'INV-12',
            sale_date: '2026-07-28',
            customer_details: 'Ward 4',
            line_count: 3,
            product_count: 2,
            quantity: '5.00',
            taxable_value: '400.00',
            discount_amount: '10.00',
            cgst_amount: '24.00',
            sgst_amount: '24.00',
            igst_amount: '0.00',
            total_tax: '48.00',
            line_total: '456.50',
            // Whole-rupee ROUND(invoice.total_amount, 0), serialized 2dp by pg
            invoice_total: '457.00',
            // SIGNED 2dp string: invoice_total − exact stored total
            round_off: '0.50',
          },
        ],
        summary: { line_count: 3, total_sales: '457.00', round_off: '0.50' },
      };
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'reports/salesTax/get-sales-tax-report'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        reportsApi.endpoints.getSalesTaxReport.initiate(body)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'reports/salesTax/get-sales-tax-report', method: 'POST', body },
        apiObject,
        undefined
      );
    });

    it('should handle error when fetching the sales tax report fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 400, data: { error: "level must be one of 'product', 'hsn', or 'invoice'" } },
        meta: mockMeta(400, 'Bad Request', 'reports/salesTax/get-sales-tax-report'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        reportsApi.endpoints.getSalesTaxReport.initiate(body)
      );

      expect(result.error).toBeDefined();
    });
  });

  describe('Endpoint Configuration', () => {
    it('should have all endpoints defined', () => {
      expect(reportsApi.endpoints.getDailySalesReport).toBeDefined();
      expect(reportsApi.endpoints.getWeeklyBillCounts).toBeDefined();
      expect(reportsApi.endpoints.getDailySalesTable).toBeDefined();
      expect(reportsApi.endpoints.getSalesTaxReport).toBeDefined();
    });

    it('should export correct hooks', () => {
      expect(reportsApi.useGetDailySalesReportQuery).toBeDefined();
      expect(reportsApi.useGetWeeklyBillCountsQuery).toBeDefined();
      expect(reportsApi.useGetDailySalesTableQuery).toBeDefined();
      expect(reportsApi.useGetSalesTaxReportQuery).toBeDefined();
    });
  });
});
