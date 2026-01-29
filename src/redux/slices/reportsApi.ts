import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQuery";

export interface DailySalesReportRequest {
  date: string;
}

export interface WeeklyBillCountsRequest {
  end_date: string;
}

export interface DailySalesTableRequest {
  date: string;
}

export interface DailySalesTableItem {
  transaction_date: string;
  invoice_number: string;
  customer_name: string | null;
  payment_type: string;
  sales_amount: string;
  discount_amount: string;
  cgst: string;
  sgst: string;
  igst: string;
  total_amount: string;
  patient_type: string;
}

export interface WeeklyBillCountItem {
  day: string;
  inpatient_bills: string;
  outpatient_bills: string;
  total_bills: string;
}

export interface PaymentMethodBreakdown {
  payment_method: string;
  bill_count: number;
  total_sales: number | string | null;
  inpatient_sales?: number | string | null;
  outpatient_sales?: number | string | null;
  percent_of_sales?: number | string | null;
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
    getDailySalesTable: builder.query<DailySalesTableItem[], DailySalesTableRequest>({
      query: (params) => ({
        url: "reports/dailySalesReport/get-daily-sales-table",
        method: "GET",
        params,
      }),
      providesTags: ["Reports"],
    }),
  }),
});

export const {
  useGetDailySalesReportQuery,
  useGetWeeklyBillCountsQuery,
  useGetDailySalesTableQuery
} = reportsApi;
