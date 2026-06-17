import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQuery";

/**
 * CRITICAL CROSS-REPO CAVEAT (see api-contract.md → "Supplier reporting endpoints"):
 * All money / quantity / value / lead-time fields backed by Postgres `numeric` columns are
 * serialized by the `pg` driver as JSON STRINGS (e.g. "1234.50"), NOT numbers. Integer counts
 * (po_count, active_supplier_count, order_count, pending_po_count, overdue_po_count,
 * min/max_lead_time_days) and every *_id field arrive as real JSON numbers.
 *
 * Consumers MUST run `toNum(...)` over the numeric-string fields below before any arithmetic,
 * formatting, or comparison. `NumericString` typedefs the affected fields so the caller is
 * forced to acknowledge the conversion.
 */
export type NumericString = string;

/**
 * Centralized numeric-string parser. Tolerates null / undefined / already-numeric values and
 * never returns NaN — that keeps currency formatting and chart math safe.
 */
export const toNum = (val: number | string | null | undefined): number => {
  if (val === null || val === undefined) return 0;
  const parsed = typeof val === "string" ? parseFloat(val) : val;
  return Number.isNaN(parsed) ? 0 : parsed;
};

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------
export interface SupplierOverviewRequest {
  start_date: string; // "YYYY-MM-DD"
  end_date: string; // "YYYY-MM-DD"
  payment_status?: string;
  po_status?: string;
}

export interface SupplierDetailRequest {
  supplier_id: number;
  start_date: string; // "YYYY-MM-DD"
  end_date: string; // "YYYY-MM-DD"
  overdue_days?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Overview response types
// ---------------------------------------------------------------------------
export interface SupplierOverviewKpis {
  total_spend: NumericString;
  total_outstanding: NumericString;
  po_count: number;
  active_supplier_count: number;
  avg_lead_time_days: NumericString | null;
}

export interface SupplierOverviewRow {
  supplier_id: number;
  supplier_name: string;
  spend: NumericString;
  order_count: number;
  amount_due: NumericString;
  avg_lead_time_days: NumericString | null;
  last_order_date: string; // "YYYY-MM-DD"
}

export interface SupplierSpendTrendPoint {
  month: string; // "YYYY-MM"
  spend: NumericString;
}

export interface SupplierOverviewResponse {
  kpis: SupplierOverviewKpis;
  suppliers: SupplierOverviewRow[];
  spend_trend: SupplierSpendTrendPoint[];
}

// ---------------------------------------------------------------------------
// Detail response types
// ---------------------------------------------------------------------------
export interface SupplierDetailSupplier {
  supplier_id: number;
  supplier_name: string;
  supplier_code: string;
  contact_name: string;
  email_id: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  country: string;
  gst_number: string;
  cst_number: string;
}

export interface SupplierDetailSpendPayments {
  total_spend: NumericString;
  total_paid: NumericString;
  total_outstanding: NumericString;
  overdue_amount: NumericString;
  credit_balance: NumericString;
}

export interface SupplierDetailDelivery {
  avg_lead_time_days: NumericString | null;
  min_lead_time_days: number | null;
  max_lead_time_days: number | null;
  pending_po_count: number;
  overdue_po_count: number;
}

export interface SupplierDetailTax {
  cgst: NumericString;
  sgst: NumericString;
  igst: NumericString;
  total_tax: NumericString;
}

export interface SupplierProductSourcingRow {
  product_id: number;
  product_name: string;
  total_qty: NumericString;
  total_value: NumericString;
}

export interface SupplierPoHistoryRow {
  po_id: number;
  po_number: string;
  ordered_date: string; // "YYYY-MM-DD"
  status: string;
  total_amount: NumericString;
  amount_paid: NumericString;
  amount_due: NumericString;
  payment_status: string;
  lead_time_days: number | null;
}

export interface SupplierDetailResponse {
  supplier: SupplierDetailSupplier;
  spend_payments: SupplierDetailSpendPayments;
  delivery: SupplierDetailDelivery;
  tax: SupplierDetailTax;
  product_sourcing: SupplierProductSourcingRow[];
  po_history: SupplierPoHistoryRow[];
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------
export const supplierReportsApi = createApi({
  reducerPath: "supplierReportsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["SupplierReports"],
  endpoints: (builder) => ({
    getSupplierOverview: builder.query<SupplierOverviewResponse, SupplierOverviewRequest>({
      query: (body) => ({
        url: "reports/suppliers/get-overview",
        method: "POST",
        body,
      }),
      providesTags: ["SupplierReports"],
    }),
    getSupplierDetail: builder.query<SupplierDetailResponse, SupplierDetailRequest>({
      query: (body) => ({
        url: "reports/suppliers/get-supplier-detail",
        method: "POST",
        body,
      }),
      providesTags: ["SupplierReports"],
    }),
  }),
});

export const { useGetSupplierOverviewQuery, useGetSupplierDetailQuery } = supplierReportsApi;
