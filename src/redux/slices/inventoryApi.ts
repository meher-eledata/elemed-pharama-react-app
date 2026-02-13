import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQuery";

// Define interfaces for your API responses
export interface InventoryItem {
  id?: string;
  name: string;
  currentQuantity: number;
  minQuantity?: number;
  maxQuantity?: number;
  batchNumber?: string;
  expiryDate?: string;
  daysPastExpiry?: number;
  daysToExpiry?: number;
  brand?: string;
  type?: string;
}

export interface InventorySummary {
  belowMinCount: number;
  aboveMaxCount: number;
  pastExpiryCount: number;
  withinThreeMonthsCount: number;
  withinOneMonthCount: number;
}

// Add Product interfaces
export interface AddProductRequest {
  product_name: string;
  type: string;
  hsn_id: string;
  unit_of_measure: string;
  max_quantity: number;
  min_quantity: number;
  brand_name: string;
}

export interface AddProductResponse {
  message: string;
  product: {
    id: number;
    name: string;
    product_id: number;
    product_code: string;
    type: string;
    brand_id: string;
    hsn_id: string;
    description: string | null;
    package_info: string; // Not Used for Product. Stored in Inventory Batch
    unit_of_measure: string;
    dosage: string | null;
    current_qty: number;
    min_qty: number;
    max_qty: number;
    mrp: number; // Not Used for Product. Stored in Inventory Batch
    selling_price: number; // Not Used for Product. No longer stored
    discount: string;
    created_at: string;
    updated_at: string;
    expiry: string | null;
  };
}

// Get Batches for Product interfaces
export interface GetBatchesForProductRequest {
  product_id: number;
}

export interface Batch {
  batch_id?: number; // Numeric batch ID (required for API calls)
  batch_number: number | string; // Batch number (can be string like "CTZ-2026-06-A")
  current_qty: number;
  expiry_date: string;
  mrp?: number;
  pack_qty?: number;
}

export interface ProductInfo {
  product_id: number;
  product_name: string;
  type: string;
  brand_id: string;
  brand_name?: string;
  product_code?: string;
  hsn_id: string;
  total_quantity: number;
}

export interface GetBatchesForProductResponse {
  product: ProductInfo;
  batches: Batch[];
}

// Brand interfaces
export interface Brand {
  id: number;
  brand_name: string;
}

// Product for Brand interfaces
export interface ProductForBrand {
  product_id: number;
  name: string;
}

export interface GetProductsForBrandRequest {
  brand_id: number;
}

// Type for Brand and Product interfaces
export interface TypeForBrandAndProduct {
  type: string;
  product_id: number;
}

export interface GetTypesForBrandAndProductRequest {
  brand_id: number;
  product_name: string;
}

export interface GetBrandsFromProductIdRequest {
  product_id: number;
}

export interface GetBrandsFromProductIdResponse {
  id: number;
  brand_name: string;
}

export interface AdjustInventoryBatchLine {
  batch_number: string | number;
  old_qty: number;
  new_qty: number;
  expiry_date: string;
  mrp: number;
  pack_qty: number;
}

export interface AdjustInventoryBatchesRequest {
  user: string;
  product_id: number;
  lines: AdjustInventoryBatchLine[];
}

export interface AdjustInventoryBatchesResponse {
  message: string;
  product_id: number;
  total_delta: number;
  new_balance_quantity: number;
}

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Inventory"],
  endpoints: (builder) => ({
    getLowStock: builder.query<InventoryItem[], void>({
      query: () => "inventory/min-quantity",
      providesTags: ["Inventory"],
      transformResponse: (response: any[]): InventoryItem[] => {
        if (!Array.isArray(response)) return [];
        return response.map((item: any) => ({
          id: item.product_id?.toString(),
          name: item.name || '',
          currentQuantity: item.current_qty ?? 0,
          minQuantity: item.min_qty ?? undefined,
          brand: item.brand_name || item.brand,
          type: item.type || item.product_type,
        }));
      },
    }),
    getExcessStock: builder.query<InventoryItem[], void>({
      query: () => "inventory/max-quantity",
      providesTags: ["Inventory"],
      transformResponse: (response: any[]): InventoryItem[] => {
        if (!Array.isArray(response)) return [];
        return response.map((item: any) => ({
          id: item.product_id?.toString(),
          name: item.name || '',
          currentQuantity: item.current_qty ?? 0,
          maxQuantity: item.max_qty ?? undefined,
          brand: item.brand_name || item.brand,
          type: item.type || item.product_type,
        }));
      },
    }),
    getExpiredStock: builder.query<InventoryItem[], void>({
      query: () => "inventory/expiry",
      providesTags: ["Inventory"],
      transformResponse: (response: any[]): InventoryItem[] => {
        if (!Array.isArray(response)) return [];
        return response.map((item: any) => ({
          id: item.product_id?.toString() || item.id?.toString(),
          name: item.name || '',
          currentQuantity: item.current_qty ?? item.currentQuantity ?? 0,
          batchNumber: item.batch_number || item.batchNumber,
          expiryDate: item.expiry_date || item.expiryDate,
          daysPastExpiry: item.days_past_expiry ?? item.daysPastExpiry,
          brand: item.brand_name || item.brand,
          type: item.type || item.product_type,
        }));
      },
    }),
    getNearExpiryStock: builder.query<InventoryItem[], { months: number }>({
      query: () => `inventory/near-expiry`,
      providesTags: ["Inventory"],
      transformResponse: (response: any, meta, arg): InventoryItem[] => {
        if (!response || typeof response !== 'object') return [];

        const itemsArray = arg.months === 1
          ? (response.withinOneMonth || [])
          : (response.withinThreeMonths || []);

        if (!Array.isArray(itemsArray)) return [];

        return itemsArray.map((item: any) => ({
          id: item.product_id?.toString() || item.id?.toString() || `${item.name}-${item.batchNumber}`,
          name: item.name || '',
          currentQuantity: typeof item.currentQuantity === 'string'
            ? parseFloat(item.currentQuantity)
            : (item.current_qty ?? item.currentQuantity ?? 0),
          batchNumber: item.batchNumber || item.batch_number,
          expiryDate: item.expiryDate || item.expiry_date,
          daysToExpiry: item.daysUntilExpiry ?? item.days_to_expiry ?? item.daysToExpiry,
          brand: item.brand_name || item.brand,
          type: item.type || item.product_type,
        }));
      },
    }),
    getInventorySummary: builder.query<InventorySummary, void>({
      query: () => "inventory/get-alert-counts",
      providesTags: ["Inventory"],
    }),
    addProduct: builder.mutation<AddProductResponse, AddProductRequest>({
      query: (body) => ({
        url: "inventory/add-product",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Inventory"],
    }),
    getBatchesForProduct: builder.mutation<GetBatchesForProductResponse, GetBatchesForProductRequest>({
      query: (body) => ({
        url: "inventory/get-batches-for-product",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Inventory"],
    }),
    getAllBrands: builder.query<Brand[], void>({
      query: () => "inventory/get-all-brands",
      providesTags: ["Inventory"],
    }),
    getProductsForBrand: builder.mutation<ProductForBrand[], GetProductsForBrandRequest>({
      query: (body) => ({
        url: "inventory/get-products-for-brand",
        method: "POST",
        body,
      }),
    }),
    getBrandsFromProductId: builder.mutation<GetBrandsFromProductIdResponse, GetBrandsFromProductIdRequest>({
      query: (body) => ({
        url: "inventory/get-brands-from-product-id",
        method: "POST",
        body,
      }),
    }),
    getTypesForBrandAndProduct: builder.mutation<TypeForBrandAndProduct[], GetTypesForBrandAndProductRequest>({
      query: (body) => ({
        url: "inventory/get-types-for-brand-and-product",
        method: "POST",
        body,
      }),
    }),
    adjustInventoryBatches: builder.mutation<AdjustInventoryBatchesResponse, AdjustInventoryBatchesRequest>({
      query: (body) => ({
        url: "inventory/adjust-inventory-batches",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Inventory"],
    }),
  }),
});

export const {
  useGetLowStockQuery,
  useGetExcessStockQuery,
  useGetExpiredStockQuery,
  useGetNearExpiryStockQuery,
  useGetInventorySummaryQuery,
  useAddProductMutation,
  useGetBatchesForProductMutation,
  useGetAllBrandsQuery,
  useGetProductsForBrandMutation,
  useGetBrandsFromProductIdMutation,
  useGetTypesForBrandAndProductMutation,
  useAdjustInventoryBatchesMutation,
} = inventoryApi;