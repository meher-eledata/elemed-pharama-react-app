import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQuery";


export interface InvoiceKpisResponse {
  startDate: string;
  endDate: string;
  dateField: string;
  totalRevenue: number;
  totalSales: number;
  uniquePatients: number;
  grossRevenue?: number;
  returnsAmount?: number;
  netRevenue?: number;
  revenueByDay: Array<{
    date: string;
    amount: number;
  }>;
  salesByDay: Array<{
    date: string;
    count: number;
  }>;
  uniquePatientsByDay: Array<{
    date: string;
    count: number;
  }>;
}

// Inventory Product Interface
export interface InventoryProduct {
  product_id: number;
  name: string;
  batchNumber: string;
  currentQuantity: number;
  minQty: number;
  maxQty: number;
  expiryDate: string;
  activityDate: string;
}

// Inventory By Date Response
export interface InventoryByDateResponse {
  startDate: string;
  endDate: string;
  dateFieldUsed: string;
  belowMinCount: number;
  aboveMaxCount: number;
  expiredInRangeCount: number;
  belowMinProducts: InventoryProduct[];
  aboveMaxProducts: InventoryProduct[];
  expiredProducts: InventoryProduct[];
}

// Invoice Stats Response
export interface InvoiceStatsResponse {
  startDate: string;
  endDate: string;
  activeSalesDays: number;
  returns: number;
  latestBatchReceivedOn: string;
}

// Request Body Interface
export interface DateRangeRequest {
  startDate: string;
  endDate: string;
}

// ============= API Definition =============

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Dashboard"],
  endpoints: (builder) => ({
    // Get Invoice KPIs (Revenue, Sales, Daily Data)
    getInvoiceKpis: builder.query<InvoiceKpisResponse, DateRangeRequest>({
      query: (body) => ({
        url: "dashboard/invoice-kpis",
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => ({
        ...response,
        totalRevenue: response.netRevenue !== undefined
          ? response.netRevenue
          : ((response.grossRevenue || 0) - (response.returnsAmount || 0)),
      }),
      providesTags: ["Dashboard"],
    }),

    // Get Inventory Stats by Date Range
    getInventoryByDate: builder.query<InventoryByDateResponse, DateRangeRequest>({
      query: (body) => ({
        url: "dashboard/inventory-by-date",
        method: "POST",
        body,
      }),
      providesTags: ["Dashboard"],
    }),

    // Get Invoice Stats
    getInvoiceStats: builder.query<InvoiceStatsResponse, DateRangeRequest>({
      query: (body) => ({
        url: "dashboard/invoice-stats",
        method: "POST",
        body,
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useGetInvoiceKpisQuery,
  useGetInventoryByDateQuery,
  useGetInvoiceStatsQuery,
} = dashboardApi;