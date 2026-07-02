import { dashboardApi } from '../dashboardApi';
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
      [dashboardApi.reducerPath]: dashboardApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(dashboardApi.middleware),
  });

const apiObject = expect.objectContaining({
  dispatch: expect.any(Function),
  getState: expect.any(Function),
});

const mockMeta = (status: number, statusText: string, url: string) => ({
  request: new Request(`http://localhost:3000/api/${url}`),
  response: { status, statusText } as Response,
});

const dateRange = { startDate: '2026-06-01', endDate: '2026-06-16' };

describe('Dashboard API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST dashboard/invoice-kpis (getInvoiceKpis)', () => {
    it('should successfully fetch invoice KPIs and compute totalRevenue from netRevenue', async () => {
      const mockResponse = {
        startDate: '2026-06-01',
        endDate: '2026-06-16',
        dateField: 'invoice_date',
        totalSales: 5,
        uniquePatients: 3,
        netRevenue: 1200,
        revenueByDay: [],
        salesByDay: [],
        uniquePatientsByDay: [],
      };
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'dashboard/invoice-kpis'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        dashboardApi.endpoints.getInvoiceKpis.initiate(dateRange)
      );

      expect(result.data).toEqual({ ...mockResponse, totalRevenue: 1200 });
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'dashboard/invoice-kpis', method: 'POST', body: dateRange },
        apiObject,
        undefined
      );
    });

    it('should compute totalRevenue from gross minus returns when netRevenue absent', async () => {
      const mockResponse = {
        startDate: '2026-06-01',
        endDate: '2026-06-16',
        dateField: 'invoice_date',
        totalSales: 5,
        uniquePatients: 3,
        grossRevenue: 1000,
        returnsAmount: 250,
        revenueByDay: [],
        salesByDay: [],
        uniquePatientsByDay: [],
      };
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'dashboard/invoice-kpis'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        dashboardApi.endpoints.getInvoiceKpis.initiate(dateRange)
      );

      expect(result.data?.totalRevenue).toBe(750);
    });

    it('should handle error when fetching invoice KPIs fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'dashboard/invoice-kpis'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        dashboardApi.endpoints.getInvoiceKpis.initiate(dateRange)
      );

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(500);
      }
    });
  });

  describe('POST dashboard/inventory-by-date (getInventoryByDate)', () => {
    it('should successfully fetch inventory by date', async () => {
      const mockResponse = {
        startDate: '2026-06-01',
        endDate: '2026-06-16',
        dateFieldUsed: 'activity_date',
        belowMinCount: 1,
        aboveMaxCount: 2,
        expiredInRangeCount: 3,
        belowMinProducts: [],
        aboveMaxProducts: [],
        expiredProducts: [],
      };
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'dashboard/inventory-by-date'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        dashboardApi.endpoints.getInventoryByDate.initiate(dateRange)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'dashboard/inventory-by-date', method: 'POST', body: dateRange },
        apiObject,
        undefined
      );
    });

    it('should handle error when fetching inventory by date fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'dashboard/inventory-by-date'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        dashboardApi.endpoints.getInventoryByDate.initiate(dateRange)
      );

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(500);
      }
    });
  });

  describe('POST dashboard/invoice-stats (getInvoiceStats)', () => {
    it('should successfully fetch invoice stats', async () => {
      const mockResponse = {
        startDate: '2026-06-01',
        endDate: '2026-06-16',
        activeSalesDays: 10,
        returns: 2,
        latestBatchReceivedOn: '2026-06-10',
      };
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'dashboard/invoice-stats'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        dashboardApi.endpoints.getInvoiceStats.initiate(dateRange)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'dashboard/invoice-stats', method: 'POST', body: dateRange },
        apiObject,
        undefined
      );
    });

    it('should handle error when fetching invoice stats fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'dashboard/invoice-stats'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        dashboardApi.endpoints.getInvoiceStats.initiate(dateRange)
      );

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(500);
      }
    });
  });

  describe('Endpoint Configuration', () => {
    it('should have all endpoints defined', () => {
      expect(dashboardApi.endpoints.getInvoiceKpis).toBeDefined();
      expect(dashboardApi.endpoints.getInventoryByDate).toBeDefined();
      expect(dashboardApi.endpoints.getInvoiceStats).toBeDefined();
    });

    it('should export correct hooks', () => {
      expect(dashboardApi.useGetInvoiceKpisQuery).toBeDefined();
      expect(dashboardApi.useGetInventoryByDateQuery).toBeDefined();
      expect(dashboardApi.useGetInvoiceStatsQuery).toBeDefined();
    });
  });
});
