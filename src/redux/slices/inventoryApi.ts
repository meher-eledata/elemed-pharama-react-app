


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

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:3000/api/inventory" }),
  tagTypes: ["Inventory"],
  endpoints: (builder) => ({
    getLowStock: builder.query<InventoryItem[], void>({
      query: () => "min-quantity",
      providesTags: ["Inventory"],
    }),
    getExcessStock: builder.query<InventoryItem[], void>({
      query: () => "max-quantity",
      providesTags: ["Inventory"],
    }),
    getExpiredStock: builder.query<InventoryItem[], void>({
      query: () => "expiry",
      providesTags: ["Inventory"],
    }),
    getInventorySummary: builder.query<InventorySummary, void>({
      // Corrected endpoint name to match the API
      query: () => "get-alert-counts",
      providesTags: ["Inventory"],
    }),
  }),
});

export const {
  useGetLowStockQuery,
  useGetExcessStockQuery,
  useGetExpiredStockQuery,
  useGetInventorySummaryQuery,
} = inventoryApi;