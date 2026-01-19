import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQuery";

export interface DailySalesReportRequest {
  date: string;
}

export interface WeeklyBillCountsRequest {
  end_date: string;
}

export interface WeeklyBillCountItem {
  day: string;
  inpatient_bills: string;
  outpatient_bills: string;
  total_bills: string;
}

export interface PaymentMethodBreakdown {
  payment_method: string;
  count: number;
  total_amount: number | string | null;
}

export interface DailySalesReportResponse {
  total_bills: string;
  inpatient_bills: number | null;
  outpatient_bills: number | null;
  total_sales: number | string | null;
  inpatient_sales: number | string | null;
  outpatient_sales: number | string | null;
  total_discount: number | string | null;
  inpatient_discount: number | string | null;
  outpatient_discount: number | string | null;
  cash_in_hand_total: number;
  cash_in_hand_inpatient: number;
  cash_in_hand_outpatient: number;
  total_tax: number | string | null;
  inpatient_tax: number | string | null;
  outpatient_tax: number | string | null;
  total_cgst: number | string | null;
  total_sgst: number | string | null;
  total_igst: number | string | null;
  payment_method_breakdown: PaymentMethodBreakdown[];
}

export const reportsApi = createApi({
  reducerPath: "reportsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Reports"],
  endpoints: (builder) => ({
    getDailySalesReport: builder.query<DailySalesReportResponse, DailySalesReportRequest>({
      query: (body) => ({
        url: "reports/dailySalesReport/get-daily-sales-report",
        method: "POST",
        body,
      }),
      providesTags: ["Reports"],
    }),
    getWeeklyBillCounts: builder.query<WeeklyBillCountItem[], WeeklyBillCountsRequest>({
      query: (body) => ({
        url: "reports/dailySalesReport/get-weekly-bill-counts",
        method: "POST",
        body,
      }),
      providesTags: ["Reports"],
    }),
  }),
});

export const { 
  useGetDailySalesReportQuery,
  useGetWeeklyBillCountsQuery 
} = reportsApi;
