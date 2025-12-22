import { masterApi } from '../masterApi';
import { baseQueryWithReauth } from '../../baseQuery';
import { configureStore } from '@reduxjs/toolkit';

// Mock the baseQueryWithReauth
jest.mock('../../baseQuery', () => ({
  baseQueryWithReauth: jest.fn(),
}));

describe('Master API Endpoints', () => {
  const mockBaseQuery = baseQueryWithReauth as jest.MockedFunction<typeof baseQueryWithReauth>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /master/add-supplier', () => {
    it('should successfully add a supplier with all required fields', async () => {
      const mockSupplierData = {
        supplier_name: 'Test Supplier',
        supplier_code: 'TS',
        contact_name: 'Test Contact',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pin: '123456',
        country: 'Test Country',
        phone_number: '1234567890',
        gst_number: '1234567890',
        cst_number: '1234567890',
        notes: 'Test Notes',
      };

      const mockResponse = {
        supplier: {
          created_at: '2025-12-22T06:24:59.417Z',
          updated_at: '2025-12-22T06:24:59.417Z',
          id: 11,
          supplier_name: 'Test Supplier',
          supplier_code: 'TS',
          contact_name: 'Test Contact',
          address: 'Test Address',
          city: 'Test City',
          state: 'Test State',
          pin: '123456',
          country: 'Test Country',
          phone_number: '1234567890',
          gst_number: '1234567890',
          cst_number: '1234567890',
          notes: 'Test Notes',
          email_id: null,
        },
      };

      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: {
          request: new Request('http://localhost:3000/api/master/add-supplier'),
          response: {
            status: 201,
            statusText: 'Created',
          } as Response,
        },
      });

      const store = configureStore({
        reducer: {
          [masterApi.reducerPath]: masterApi.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(masterApi.middleware),
      });

      const result = await store.dispatch(
        masterApi.endpoints.addSupplier.initiate(mockSupplierData)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        {
          url: 'master/add-supplier',
          method: 'POST',
          body: mockSupplierData,
        },
        expect.objectContaining({
          dispatch: expect.any(Function),
          getState: expect.any(Function),
        }),
        undefined
      );
    });

    it('should handle error when adding supplier fails', async () => {
      const mockSupplierData = {
        supplier_name: 'Test Supplier',
        supplier_code: 'TS',
        contact_name: 'Test Contact',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pin: '123456',
        country: 'Test Country',
        phone_number: '1234567890',
        gst_number: '1234567890',
        cst_number: '1234567890',
        notes: 'Test Notes',
      };

      mockBaseQuery.mockResolvedValueOnce({
        error: {
          status: 400,
          data: { message: 'Supplier already exists' },
        },
        meta: {
          request: new Request('http://localhost:3000/api/master/add-supplier'),
          response: {
            status: 400,
            statusText: 'Bad Request',
          } as Response,
        },
      });

      const store = configureStore({
        reducer: {
          [masterApi.reducerPath]: masterApi.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(masterApi.middleware),
      });

      const result = await store.dispatch(
        masterApi.endpoints.addSupplier.initiate(mockSupplierData)
      );

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(400);
      }
    });
  });

  describe('POST /master/add-doctor', () => {
    it('should successfully add a doctor with all required fields', async () => {
      const mockDoctorData = {
        doctor_name: 'Test Doctor',
        contact_name: 'Test Contact',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pin: '123456',
        country: 'Test Country',
        phone_number: '1234567890',
        gst_number: '1234567890',
        cst_number: '1234567890',
        notes: 'Test Notes',
      };

      const mockResponse = {
        doctor: {
          created_at: '2025-12-22T06:29:34.401Z',
          updated_at: '2025-12-22T06:29:34.401Z',
          id: '11',
          name: 'Test Doctor',
          address: 'Test Address',
          city: 'Test City',
          state: 'Test State',
          pin: '123456',
          country: 'Test Country',
          email: null,
          phone: null,
          gstin: null,
          pancard_num: null,
          drug_license: null,
          gender: null,
        },
      };

      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: {
          request: new Request('http://localhost:3000/api/master/add-doctor'),
          response: {
            status: 201,
            statusText: 'Created',
          } as Response,
        },
      });

      const store = configureStore({
        reducer: {
          [masterApi.reducerPath]: masterApi.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(masterApi.middleware),
      });

      const result = await store.dispatch(
        masterApi.endpoints.addDoctor.initiate(mockDoctorData)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        {
          url: 'master/add-doctor',
          method: 'POST',
          body: mockDoctorData,
        },
        expect.objectContaining({
          dispatch: expect.any(Function),
          getState: expect.any(Function),
        }),
        undefined
      );
    });

    it('should handle error when adding doctor fails', async () => {
      const mockDoctorData = {
        doctor_name: 'Test Doctor',
        contact_name: 'Test Contact',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pin: '123456',
        country: 'Test Country',
        phone_number: '1234567890',
        gst_number: '1234567890',
        cst_number: '1234567890',
        notes: 'Test Notes',
      };

      mockBaseQuery.mockResolvedValueOnce({
        error: {
          status: 400,
          data: { message: 'Doctor already exists' },
        },
        meta: {
          request: new Request('http://localhost:3000/api/master/add-doctor'),
          response: {
            status: 400,
            statusText: 'Bad Request',
          } as Response,
        },
      });

      const store = configureStore({
        reducer: {
          [masterApi.reducerPath]: masterApi.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(masterApi.middleware),
      });

      const result = await store.dispatch(
        masterApi.endpoints.addDoctor.initiate(mockDoctorData)
      );

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(400);
      }
    });
  });

  describe('GET /master/get-master-counts', () => {
    it('should successfully fetch master counts', async () => {
      const mockResponse = {
        suppliers: 11,
        doctors: 11,
        customers: 10,
        products: 10,
      };

      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: {
          request: new Request('http://localhost:3000/api/master/get-master-counts'),
          response: {
            status: 200,
            statusText: 'OK',
          } as Response,
        },
      });

      const store = configureStore({
        reducer: {
          [masterApi.reducerPath]: masterApi.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(masterApi.middleware),
      });

      const result = await store.dispatch(
        masterApi.endpoints.getMasterCounts.initiate(undefined)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        {
          url: 'master/get-master-counts',
          method: 'GET',
        },
        expect.objectContaining({
          dispatch: expect.any(Function),
          getState: expect.any(Function),
        }),
        undefined
      );
    });

    it('should return correct count structure', async () => {
      const mockResponse = {
        suppliers: 11,
        doctors: 11,
        customers: 10,
        products: 10,
      };

      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: {
          request: new Request('http://localhost:3000/api/master/get-master-counts'),
          response: {
            status: 200,
            statusText: 'OK',
          } as Response,
        },
      });

      const store = configureStore({
        reducer: {
          [masterApi.reducerPath]: masterApi.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(masterApi.middleware),
      });

      const result = await store.dispatch(
        masterApi.endpoints.getMasterCounts.initiate(undefined)
      );

      expect(result.data).toHaveProperty('suppliers');
      expect(result.data).toHaveProperty('doctors');
      expect(result.data).toHaveProperty('customers');
      expect(result.data).toHaveProperty('products');
      expect(typeof result.data?.suppliers).toBe('number');
      expect(typeof result.data?.doctors).toBe('number');
      expect(typeof result.data?.customers).toBe('number');
      expect(typeof result.data?.products).toBe('number');
    });

    it('should handle error when fetching master counts fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: {
          status: 500,
          data: { message: 'Internal server error' },
        },
        meta: {
          request: new Request('http://localhost:3000/api/master/get-master-counts'),
          response: {
            status: 500,
            statusText: 'Internal Server Error',
          } as Response,
        },
      });

      const store = configureStore({
        reducer: {
          [masterApi.reducerPath]: masterApi.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(masterApi.middleware),
      });

      const result = await store.dispatch(
        masterApi.endpoints.getMasterCounts.initiate(undefined)
      );

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(500);
      }
    });
  });

  describe('Endpoint Configuration', () => {
    it('should have correct endpoint URLs', () => {
      expect(masterApi.endpoints.addSupplier).toBeDefined();
      expect(masterApi.endpoints.addDoctor).toBeDefined();
      expect(masterApi.endpoints.getMasterCounts).toBeDefined();
    });

    it('should export correct hooks', () => {
      expect(masterApi.useAddSupplierMutation).toBeDefined();
      expect(masterApi.useAddDoctorMutation).toBeDefined();
      expect(masterApi.useGetMasterCountsQuery).toBeDefined();
    });
  });
});

