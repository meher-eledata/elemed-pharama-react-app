


import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define interfaces for your API responses
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  expiryDate?: string;
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
  baseQuery: fetchBaseQuery({ 
    baseUrl: "http://localhost:3000/api",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any)?.auth?.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
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
      // Corrected endpoint name to match the API
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