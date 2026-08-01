import { inventoryApi } from '../inventoryApi';
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
      [inventoryApi.reducerPath]: inventoryApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(inventoryApi.middleware),
  });

const apiObject = expect.objectContaining({
  dispatch: expect.any(Function),
  getState: expect.any(Function),
});

const mockMeta = (status: number, statusText: string, url: string) => ({
  request: new Request(`http://localhost:3000/api/${url}`),
  response: { status, statusText } as Response,
});

describe('Inventory API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET inventory/min-quantity/ (getLowStock)', () => {
    it('should successfully fetch low stock', async () => {
      const mockResponse = [
        { product_id: 1, name: 'Item A', current_qty: 2, min_qty: 5, brand_name: 'B', type: 'tablet' },
      ];
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'inventory/min-quantity/'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.getLowStock.initiate());

      expect(result.data).toEqual([
        { id: '1', name: 'Item A', currentQuantity: 2, minQuantity: 5, brand: 'B', type: 'tablet' },
      ]);
      expect(mockBaseQuery).toHaveBeenCalledWith('inventory/min-quantity/', apiObject, undefined);
    });

    it('should handle error when fetching low stock fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'inventory/min-quantity/'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.getLowStock.initiate());

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(500);
      }
    });
  });

  describe('GET inventory/max-quantity/ (getExcessStock)', () => {
    it('should successfully fetch excess stock', async () => {
      const mockResponse = [
        { product_id: 2, name: 'Item B', current_qty: 99, max_qty: 50, brand_name: 'C', type: 'syrup' },
      ];
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'inventory/max-quantity/'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.getExcessStock.initiate());

      expect(result.data).toEqual([
        { id: '2', name: 'Item B', currentQuantity: 99, maxQuantity: 50, brand: 'C', type: 'syrup' },
      ]);
      expect(mockBaseQuery).toHaveBeenCalledWith('inventory/max-quantity/', apiObject, undefined);
    });

    it('should handle error when fetching excess stock fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'inventory/max-quantity/'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.getExcessStock.initiate());

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(500);
      }
    });
  });

  describe('GET inventory/expiry/ (getExpiredStock)', () => {
    it('should successfully fetch expired stock', async () => {
      const mockResponse = [
        {
          product_id: 3,
          name: 'Item C',
          current_qty: 10,
          batch_number: 'BN1',
          expiry_date: '2025-01-01',
          days_past_expiry: 5,
          brand_name: 'D',
          type: 'tablet',
        },
      ];
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'inventory/expiry/'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.getExpiredStock.initiate());

      expect(result.data).toEqual([
        {
          id: '3',
          name: 'Item C',
          currentQuantity: 10,
          batchNumber: 'BN1',
          expiryDate: '2025-01-01',
          daysPastExpiry: 5,
          brand: 'D',
          type: 'tablet',
        },
      ]);
      expect(mockBaseQuery).toHaveBeenCalledWith('inventory/expiry/', apiObject, undefined);
    });

    it('should handle error when fetching expired stock fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'inventory/expiry/'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.getExpiredStock.initiate());

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(500);
      }
    });
  });

  describe('GET inventory/near-expiry/ (getNearExpiryStock)', () => {
    it('should successfully fetch near expiry stock (three months)', async () => {
      const mockResponse = {
        withinThreeMonths: [
          {
            product_id: 4,
            name: 'Item D',
            current_qty: 7,
            batch_number: 'BN2',
            expiry_date: '2026-09-01',
            days_to_expiry: 80,
            brand_name: 'E',
            type: 'tablet',
          },
        ],
        withinOneMonth: [],
      };
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'inventory/near-expiry/'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.getNearExpiryStock.initiate({ months: 3 })
      );

      expect(result.data).toEqual([
        {
          id: '4',
          name: 'Item D',
          currentQuantity: 7,
          batchNumber: 'BN2',
          expiryDate: '2026-09-01',
          daysToExpiry: 80,
          brand: 'E',
          type: 'tablet',
        },
      ]);
      expect(mockBaseQuery).toHaveBeenCalledWith('inventory/near-expiry/', apiObject, undefined);
    });

    it('should handle error when fetching near expiry stock fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'inventory/near-expiry/'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.getNearExpiryStock.initiate({ months: 1 })
      );

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(500);
      }
    });
  });

  describe('GET inventory/get-alert-counts/ (getInventorySummary)', () => {
    it('should successfully fetch inventory summary', async () => {
      const mockResponse = {
        belowMinCount: 1,
        belowMinTotalQuantity: 2,
        aboveMaxCount: 3,
        aboveMaxTotalQuantity: 4,
        pastExpiryCount: 5,
        pastExpiryTotalQuantity: 6,
        withinThreeMonthsCount: 7,
        withinThreeMonthsTotalQuantity: 8,
        withinOneMonthCount: 9,
        withinOneMonthTotalQuantity: 10,
      };
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'inventory/get-alert-counts/'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.getInventorySummary.initiate());

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith('inventory/get-alert-counts/', apiObject, undefined);
    });

    it('should handle error when fetching inventory summary fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'inventory/get-alert-counts/'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.getInventorySummary.initiate());

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(500);
      }
    });
  });

  describe('GET inventory/get-total-stock (getTotalStock)', () => {
    it('should successfully fetch total stock', async () => {
      const mockResponse = {
        totalProductCount: 2,
        totalQuantity: 30,
        products: [{ product_id: 1, name: 'A', totalQuantity: 30 }],
      };
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'inventory/get-total-stock'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.getTotalStock.initiate());

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith('inventory/get-total-stock', apiObject, undefined);
    });

    it('should handle error when fetching total stock fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'inventory/get-total-stock'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.getTotalStock.initiate());

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(500);
      }
    });
  });

  describe('POST inventory/add-product/ (addProduct)', () => {
    const body = {
      product_name: 'New Product',
      type: 'tablet',
      hsn_id: 'HSN1',
      unit_of_measure: 'box',
      max_quantity: 100,
      min_quantity: 10,
      brand_name: 'Brand',
      username: 'tester',
    };

    it('should successfully add a product', async () => {
      const mockResponse = { message: 'created', product: { id: 1 } };
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(201, 'Created', 'inventory/add-product/'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.addProduct.initiate(body));

      expect((result as { data?: unknown }).data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'inventory/add-product/', method: 'POST', body },
        apiObject,
        undefined
      );
    });

    it('should pass the optional schedule through in the request body', async () => {
      const bodyWithSchedule = { ...body, schedule: 'H1' };
      mockBaseQuery.mockResolvedValueOnce({
        data: { message: 'created', product: { id: 2, schedule: 'H1' } },
        meta: mockMeta(201, 'Created', 'inventory/add-product/'),
      });

      const store = makeStore();
      await store.dispatch(inventoryApi.endpoints.addProduct.initiate(bodyWithSchedule));

      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'inventory/add-product/', method: 'POST', body: bodyWithSchedule },
        apiObject,
        undefined
      );
    });

    it('should handle error when adding a product fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 400, data: { message: 'exists' } },
        meta: mockMeta(400, 'Bad Request', 'inventory/add-product/'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.addProduct.initiate(body));

      expect((result as { error?: unknown }).error).toBeDefined();
    });
  });

  describe('POST inventory/get-batches-for-product/ (getBatchesForProduct)', () => {
    const body = { product_id: 5 };

    it('should successfully fetch batches for product', async () => {
      const mockResponse = { product: { product_id: 5 }, batches: [] };
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'inventory/get-batches-for-product/'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.getBatchesForProduct.initiate(body)
      );

      expect((result as { data?: unknown }).data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'inventory/get-batches-for-product/', method: 'POST', body },
        apiObject,
        undefined
      );
    });

    it('should handle error when fetching batches fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 404, data: { message: 'not found' } },
        meta: mockMeta(404, 'Not Found', 'inventory/get-batches-for-product/'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.getBatchesForProduct.initiate(body)
      );

      expect((result as { error?: unknown }).error).toBeDefined();
    });
  });

  describe('GET inventory/get-all-brands/ (getAllBrands)', () => {
    it('should successfully fetch all brands', async () => {
      const mockResponse = [{ id: 1, brand_name: 'Brand A' }];
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'inventory/get-all-brands/'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.getAllBrands.initiate());

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith('inventory/get-all-brands/', apiObject, undefined);
    });

    it('should handle error when fetching all brands fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'inventory/get-all-brands/'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.getAllBrands.initiate());

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(500);
      }
    });
  });

  describe('POST inventory/get-products-for-brand/ (getProductsForBrand)', () => {
    const body = { brand_id: 7 };

    it('should successfully fetch products for brand', async () => {
      const mockResponse = [{ product_id: 1, name: 'P1' }];
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'inventory/get-products-for-brand/'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.getProductsForBrand.initiate(body)
      );

      expect((result as { data?: unknown }).data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'inventory/get-products-for-brand/', method: 'POST', body },
        apiObject,
        undefined
      );
    });

    it('should handle error when fetching products for brand fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'inventory/get-products-for-brand/'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.getProductsForBrand.initiate(body)
      );

      expect((result as { error?: unknown }).error).toBeDefined();
    });
  });

  describe('POST inventory/get-brands-from-product-id/ (getBrandsFromProductId)', () => {
    const body = { product_id: 9 };

    it('should successfully fetch brands from product id', async () => {
      const mockResponse = { id: 1, brand_name: 'Brand A' };
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'inventory/get-brands-from-product-id/'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.getBrandsFromProductId.initiate(body)
      );

      expect((result as { data?: unknown }).data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'inventory/get-brands-from-product-id/', method: 'POST', body },
        apiObject,
        undefined
      );
    });

    it('should handle error when fetching brands from product id fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'inventory/get-brands-from-product-id/'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.getBrandsFromProductId.initiate(body)
      );

      expect((result as { error?: unknown }).error).toBeDefined();
    });
  });

  describe('POST inventory/get-brands-from-product-name/ (getBrandsFromProductName)', () => {
    const body = { product_name: 'Paracetamol' };

    it('should successfully fetch brands from product name', async () => {
      const mockResponse = [{ id: 1, brand_name: 'Brand A' }];
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'inventory/get-brands-from-product-name/'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.getBrandsFromProductName.initiate(body)
      );

      expect((result as { data?: unknown }).data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'inventory/get-brands-from-product-name/', method: 'POST', body },
        apiObject,
        undefined
      );
    });

    it('should handle error when fetching brands from product name fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'inventory/get-brands-from-product-name/'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.getBrandsFromProductName.initiate(body)
      );

      expect((result as { error?: unknown }).error).toBeDefined();
    });
  });

  describe('POST inventory/get-types-for-brand-and-product/ (getTypesForBrandAndProduct)', () => {
    const body = { brand_id: 2, product_name: 'Paracetamol' };

    it('should successfully fetch types for brand and product', async () => {
      const mockResponse = [{ type: 'tablet', product_id: 1 }];
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'inventory/get-types-for-brand-and-product/'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.getTypesForBrandAndProduct.initiate(body)
      );

      expect((result as { data?: unknown }).data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'inventory/get-types-for-brand-and-product/', method: 'POST', body },
        apiObject,
        undefined
      );
    });

    it('should handle error when fetching types fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'inventory/get-types-for-brand-and-product/'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.getTypesForBrandAndProduct.initiate(body)
      );

      expect((result as { error?: unknown }).error).toBeDefined();
    });
  });

  describe('POST inventory/adjust-inventory-batches/ (adjustInventoryBatches)', () => {
    const body = {
      username: 'tester',
      product_id: 3,
      lines: [
        {
          batch_id: 11,
          batch_number: 'BN1',
          old_qty: 5,
          new_qty: 10,
          expiry_date: '2026-12-01',
          mrp: 100,
          pack_qty: 1,
        },
      ],
    };

    it('should successfully adjust inventory batches', async () => {
      const mockResponse = {
        message: 'ok',
        product_id: 3,
        total_unit_delta: 5,
        new_balance_quantity: 10,
      };
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'inventory/adjust-inventory-batches/'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.adjustInventoryBatches.initiate(body)
      );

      expect((result as { data?: unknown }).data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'inventory/adjust-inventory-batches/', method: 'POST', body },
        apiObject,
        undefined
      );
    });

    it('should handle error when adjusting inventory batches fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 400, data: { message: 'bad' } },
        meta: mockMeta(400, 'Bad Request', 'inventory/adjust-inventory-batches/'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.adjustInventoryBatches.initiate(body)
      );

      expect((result as { error?: unknown }).error).toBeDefined();
    });
  });

  describe('GET inventory/get-product-ids (getProductIds)', () => {
    it('should successfully fetch product ids', async () => {
      const mockResponse = { product_ids: [1, 2, 3] };
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'inventory/get-product-ids'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.getProductIds.initiate());

      expect(result.data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith('inventory/get-product-ids', apiObject, undefined);
    });

    it('should handle error when fetching product ids fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 500, data: { message: 'error' } },
        meta: mockMeta(500, 'Internal Server Error', 'inventory/get-product-ids'),
      });

      const store = makeStore();
      const result = await store.dispatch(inventoryApi.endpoints.getProductIds.initiate());

      expect(result.error).toBeDefined();
      if ('status' in (result.error || {})) {
        expect((result.error as { status: number }).status).toBe(500);
      }
    });
  });

  describe('POST inventory/update-min-quantity (updateMinQuantity)', () => {
    const body = { product_id: 4, min_quantity: 20 };

    it('should successfully update min quantity', async () => {
      const mockResponse = { message: 'ok', product_id: 4, min_quantity: 20 };
      mockBaseQuery.mockResolvedValueOnce({
        data: mockResponse,
        meta: mockMeta(200, 'OK', 'inventory/update-min-quantity'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.updateMinQuantity.initiate(body)
      );

      expect((result as { data?: unknown }).data).toEqual(mockResponse);
      expect(mockBaseQuery).toHaveBeenCalledWith(
        { url: 'inventory/update-min-quantity', method: 'POST', body },
        apiObject,
        undefined
      );
    });

    it('should handle error when updating min quantity fails', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 400, data: { message: 'bad' } },
        meta: mockMeta(400, 'Bad Request', 'inventory/update-min-quantity'),
      });

      const store = makeStore();
      const result = await store.dispatch(
        inventoryApi.endpoints.updateMinQuantity.initiate(body)
      );

      expect((result as { error?: unknown }).error).toBeDefined();
    });
  });

  describe('Endpoint Configuration', () => {
    it('should have all endpoints defined', () => {
      expect(inventoryApi.endpoints.getLowStock).toBeDefined();
      expect(inventoryApi.endpoints.getExcessStock).toBeDefined();
      expect(inventoryApi.endpoints.getExpiredStock).toBeDefined();
      expect(inventoryApi.endpoints.getNearExpiryStock).toBeDefined();
      expect(inventoryApi.endpoints.getInventorySummary).toBeDefined();
      expect(inventoryApi.endpoints.getTotalStock).toBeDefined();
      expect(inventoryApi.endpoints.addProduct).toBeDefined();
      expect(inventoryApi.endpoints.getBatchesForProduct).toBeDefined();
      expect(inventoryApi.endpoints.getAllBrands).toBeDefined();
      expect(inventoryApi.endpoints.getProductsForBrand).toBeDefined();
      expect(inventoryApi.endpoints.getBrandsFromProductId).toBeDefined();
      expect(inventoryApi.endpoints.getBrandsFromProductName).toBeDefined();
      expect(inventoryApi.endpoints.getTypesForBrandAndProduct).toBeDefined();
      expect(inventoryApi.endpoints.adjustInventoryBatches).toBeDefined();
      expect(inventoryApi.endpoints.getProductIds).toBeDefined();
      expect(inventoryApi.endpoints.updateMinQuantity).toBeDefined();
    });

    it('should export correct hooks', () => {
      expect(inventoryApi.useGetProductIdsQuery).toBeDefined();
      expect(inventoryApi.useGetLowStockQuery).toBeDefined();
      expect(inventoryApi.useGetExcessStockQuery).toBeDefined();
      expect(inventoryApi.useGetExpiredStockQuery).toBeDefined();
      expect(inventoryApi.useGetNearExpiryStockQuery).toBeDefined();
      expect(inventoryApi.useGetInventorySummaryQuery).toBeDefined();
      expect(inventoryApi.useGetTotalStockQuery).toBeDefined();
      expect(inventoryApi.useAddProductMutation).toBeDefined();
      expect(inventoryApi.useGetBatchesForProductMutation).toBeDefined();
      expect(inventoryApi.useGetAllBrandsQuery).toBeDefined();
      expect(inventoryApi.useGetProductsForBrandMutation).toBeDefined();
      expect(inventoryApi.useGetBrandsFromProductIdMutation).toBeDefined();
      expect(inventoryApi.useGetBrandsFromProductNameMutation).toBeDefined();
      expect(inventoryApi.useGetTypesForBrandAndProductMutation).toBeDefined();
      expect(inventoryApi.useAdjustInventoryBatchesMutation).toBeDefined();
      expect(inventoryApi.useUpdateMinQuantityMutation).toBeDefined();
    });
  });
});
