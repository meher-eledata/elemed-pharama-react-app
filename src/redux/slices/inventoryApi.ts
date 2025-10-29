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
}

export interface InventorySummary {
  belowMinCount: number;
  aboveMaxCount: number;
  pastExpiryCount: number;
}

// Add Product interfaces
export interface AddProductRequest {
  product_name: string;
  product_code: string;
  type: string;
  hsn_id: string;
  package_info: string;
  unit_of_measure: string;
  max_quantity: number;
  min_quantity: number;
  expiry: string;
  mrp: number;
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
    package_info: string;
    unit_of_measure: string;
    dosage: string | null;
    current_qty: number;
    min_qty: number;
    max_qty: number;
    mrp: number;
    selling_price: number;
    discount: string;
    created_at: string;
    updated_at: string;
    expiry: string | null;
  };
}

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Inventory"],
  endpoints: (builder) => ({
    getLowStock: builder.query<InventoryItem[], void>({
      query: () => "inventory/min-quantity",
      providesTags: ["Inventory"],
    }),
    getExcessStock: builder.query<InventoryItem[], void>({
      query: () => "inventory/max-quantity",
      providesTags: ["Inventory"],
    }),
    getExpiredStock: builder.query<InventoryItem[], void>({
      query: () => "inventory/expiry",
      providesTags: ["Inventory"],
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
  }),
});

export const {
  useGetLowStockQuery,
  useGetExcessStockQuery,
  useGetExpiredStockQuery,
  useGetInventorySummaryQuery,
  useAddProductMutation,
} = inventoryApi;