import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQuery";

// All three daily-sales endpoints accept an optional inclusive [start_date, end_date]
// range ("YYYY-MM-DD"). `date` is the legacy single-day field kept for backward compat;
// with all three omitted the backend defaults to today.
export interface DailySalesReportRequest {
  start_date?: string;
  end_date?: string;
  date?: string;
}

export interface WeeklyBillCountsRequest {
  end_date: string;
}

export interface DailySalesTableRequest {
  start_date?: string;
  end_date?: string;
  date?: string;
}

export interface DailySalesTableItem {
  transaction_date: string;
  transaction_type?: string;
  invoice_number: string;
  customer_name: string | null;
  doctor_name: string | null;
  payment_type: string;
  sales_amount: string;
  discount_amount: string;
  cgst: string;
  sgst: string;
  igst: string;
  total_amount: string;
  patient_type: string;
  // Invoice-level free-text detail (Sale + Refund rows; null where not applicable)
  customer_details: string | null;
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
  total_returns?: number | string | null;
  inpatient_returns?: number | string | null;
  outpatient_returns?: number | string | null;
  total_deletions?: number | string | null;
  inpatient_deletions?: number | string | null;
  outpatient_deletions?: number | string | null;
  total_deletion_amount?: number | string | null;
  inpatient_deletion_amount?: number | string | null;
  outpatient_deletion_amount?: number | string | null;
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

// ---------------------------------------------------------------------------
// Supplier / tax / product-level reporting endpoints (5 reports)
//
// CRITICAL: All money / qty / rate / tax / discount / value fields are
// Postgres `numeric` columns serialized by the pg driver as JSON STRINGS
// (e.g. "1234.50"), NOT numbers. The `Num` alias below marks every such field
// so callers parse it (via the shared `toNum` helper) before any arithmetic,
// formatting, or sort comparison. Only `*_id` fields and integer counts
// (line_count, product_count, invoice_count, receipt_count, supplier_count,
// payment_count, chart `count`) arrive as real JSON numbers.
// ---------------------------------------------------------------------------

/** A Postgres numeric serialized as a JSON string (e.g. "1234.50"). Parse before use. */
export type Num = string;

// ---- (A) Supplier Receipt Report -----------------------------------------

export interface SupplierReportDateRequest {
  start_date: string; // "YYYY-MM-DD"
  end_date: string; // "YYYY-MM-DD"
  supplier_id?: number;
}

export interface SupplierReceiptReportRow {
  receipt_id: number;
  receipt_date: string;
  invoice_number: string | null;
  po_number: string | null;
  supplier_id: number;
  supplier_name: string;
  supplier_gst: string | null;
  supplier_contact: string | null;
  supplier_phone: string | null;
  product_id: number;
  product_name: string;
  product_code: string | null;
  hsn_code: string | null;
  mrp: Num;
  purchase_price: Num;
  received_qty: Num;
  cgst: Num;
  sgst: Num;
  igst: Num;
  total_tax: Num;
  discount: Num;
  total_value: Num;
}

export interface SupplierReceiptReportSummary {
  total_spend: Num;
  total_qty_received: Num;
  receipt_count: number;
  product_count: number;
  supplier_count: number;
}

export interface SupplierReceiptReportResponse {
  rows: SupplierReceiptReportRow[];
  summary: SupplierReceiptReportSummary;
  charts: {
    spend_by_date: { date: string; spend: Num }[];
    qty_by_date: { date: string; qty: Num }[];
    top_products_by_value: { product_name: string; value: Num; qty: Num }[];
    top_suppliers_by_value: { supplier_name: string; value: Num; qty: Num }[];
  };
}

// ---- (B) Supplier Payment Report ------------------------------------------

export interface SupplierPaymentReportRow {
  payment_id: number;
  receipt_id: number | null;
  invoice_date: string | null;
  supplier_id: number | null;
  supplier_name: string | null;
  total_bill_amount: Num;
  cgst: Num;
  sgst: Num;
  igst: Num;
  total_tax: Num;
  discount: Num;
  payment_done: Num;
  transaction_date: string;
  payment_method: string | null;
  details: string | null;
  pending_due_supplier: Num;
}

export interface SupplierPaymentReportSummary {
  total_paid: Num;
  payment_count: number;
  supplier_count: number;
  total_pending_due: Num;
}

export interface SupplierPaymentReportResponse {
  rows: SupplierPaymentReportRow[];
  summary: SupplierPaymentReportSummary;
  charts: {
    paid_by_date: { date: string; paid: Num }[];
    paid_by_method: { method: string | null; paid: Num; count: number }[];
  };
}

// ---- (C) Product Sales Report ---------------------------------------------

export interface ProductSalesReportRequest {
  start_date: string;
  end_date: string;
  product_id?: number;
  patient_type?: 0 | 1;
}

export interface ProductSalesReportRow {
  invoice_line_id: number;
  invoice_id: number;
  invoice_number: string | null;
  sale_date: string;
  product_id: number | null;
  product_name: string | null;
  product_code: string | null;
  hsn_code: string | null;
  batch_number: string | null;
  patient_type: "INPATIENT" | "OUTPATIENT" | "UNKNOWN";
  customer_name: string | null;
  quantity: Num;
  mrp: Num | null;
  pack_qty: number | null;
  unit_mrp: Num;
  selling_price: Num;
  discount_pct: Num;
  discount_amount: Num;
  cgst_amount: Num;
  sgst_amount: Num;
  igst_amount: Num;
  total_tax: Num;
  line_total: Num;
  // Invoice-level free-text detail repeated on each of that invoice's lines
  customer_details: string | null;
}

export interface ProductSalesReportSummary {
  line_count: number;
  total_quantity: Num;
  total_sales: Num;
  total_cgst: Num;
  total_sgst: Num;
  total_igst: Num;
  total_tax: Num;
  product_count: number;
  invoice_count: number;
}

export interface ProductSalesReportResponse {
  rows: ProductSalesReportRow[];
  summary: ProductSalesReportSummary;
}

// ---- (D) Sales Tax Report -------------------------------------------------

export type SalesTaxLevel = "product" | "hsn" | "invoice";

export interface SalesTaxReportRequest {
  start_date: string;
  end_date: string;
  product_id?: number;
  patient_type?: 0 | 1;
  level?: SalesTaxLevel;
  hsn_code?: string;
}

export interface SalesTaxReportRow {
  invoice_line_id: number;
  invoice_id: number;
  invoice_number: string | null;
  sale_date: string;
  product_id: number | null;
  product_name: string | null;
  product_code: string | null;
  hsn_code: string | null;
  batch_number: string | null;
  quantity: Num;
  mrp: Num | null;
  selling_price: Num;
  taxable_value: Num;
  discount_amount: Num;
  cgst_rate: Num;
  sgst_rate: Num;
  igst_rate: Num;
  cgst_amount: Num;
  sgst_amount: Num;
  igst_amount: Num;
  total_tax: Num;
  line_total: Num;
  // Invoice-level free-text detail (product level ONLY — hsn rows are aggregated)
  customer_details: string | null;
}

export interface SalesTaxHsnRow {
  hsn_code: string | null;
  cgst_rate: Num;
  sgst_rate: Num;
  igst_rate: Num;
  line_count: number;
  product_count: number;
  quantity: Num;
  taxable_value: Num;
  discount_amount: Num;
  cgst_amount: Num;
  sgst_amount: Num;
  igst_amount: Num;
  total_tax: Num;
  line_total: Num;
}

// One row per invoice (level "invoice"). `invoice_total` is the WHOLE-RUPEE
// stored invoice grand total (ROUND(invoice.total_amount, 0)); other money
// fields are 2dp line-derived aggregates. All money fields are pg numeric-strings.
export interface SalesTaxInvoiceRow {
  invoice_id: number;
  invoice_number: string | null;
  sale_date: string;
  customer_details: string | null;
  line_count: number;
  product_count: number;
  quantity: Num;
  taxable_value: Num;
  discount_amount: Num;
  cgst_amount: Num;
  sgst_amount: Num;
  igst_amount: Num;
  total_tax: Num;
  line_total: Num;
  invoice_total: Num;
  // SIGNED 2dp string (e.g. "0.10" / "-0.40"): invoice_total − exact stored total
  round_off: Num;
}

export interface SalesTaxReportSummary {
  line_count: number;
  total_quantity: Num;
  total_taxable: Num;
  total_discount: Num;
  total_cgst: Num;
  total_sgst: Num;
  total_igst: Num;
  total_tax: Num;
  total_sales: Num;
  // SIGNED 2dp string, ALL levels: SUM over distinct invoices of (rounded − exact
  // invoice total); positive = collected more than exact. exact sum + round_off = total_sales.
  round_off: Num;
  total_mrp_value: Num;
  product_count: number;
  invoice_count: number;
  hsn_count: number;
}

export interface SalesTaxProductResponse {
  level: "product";
  rows: SalesTaxReportRow[];
  summary: SalesTaxReportSummary;
}

export interface SalesTaxHsnResponse {
  level: "hsn";
  rows: SalesTaxHsnRow[];
  summary: SalesTaxReportSummary;
}

export interface SalesTaxInvoiceResponse {
  level: "invoice";
  rows: SalesTaxInvoiceRow[];
  summary: SalesTaxReportSummary;
}

export type SalesTaxReportResponse =
  | SalesTaxProductResponse
  | SalesTaxHsnResponse
  | SalesTaxInvoiceResponse;

// ---- (E) Supplier Tax Report (two modes via `level` discriminant) ----------

export type SupplierTaxLevel = "receipt" | "supplier";

export interface SupplierTaxReportRequest {
  start_date: string;
  end_date: string;
  level: SupplierTaxLevel;
  supplier_id?: number;
}

export interface SupplierTaxReceiptRow {
  receipt_id: number;
  receipt_date: string;
  invoice_number: string | null;
  supplier_id: number;
  supplier_name: string | null;
  supplier_gst: string | null;
  taxable_value: Num;
  discount: Num;
  cgst: Num;
  sgst: Num;
  igst: Num;
  total_tax: Num;
  gst_rate: Num | null;
  receipt_total: Num;
}

export interface SupplierTaxSupplierRow {
  supplier_id: number;
  supplier_name: string | null;
  supplier_gst: string | null;
  receipt_count: number;
  taxable_value: Num;
  discount: Num;
  cgst: Num;
  sgst: Num;
  igst: Num;
  total_tax: Num;
  gst_rate: Num | null;
  total_with_tax: Num;
}

export interface SupplierTaxReportSummary {
  receipt_count: number;
  supplier_count: number;
  total_taxable: Num;
  total_discount: Num;
  total_cgst: Num;
  total_sgst: Num;
  total_igst: Num;
  total_tax: Num;
  gst_rate: Num | null;
  total_with_tax: Num;
}

export interface SupplierTaxReceiptResponse {
  level: "receipt";
  rows: SupplierTaxReceiptRow[];
  summary: SupplierTaxReportSummary;
}

export interface SupplierTaxSupplierResponse {
  level: "supplier";
  rows: SupplierTaxSupplierRow[];
  summary: SupplierTaxReportSummary;
}

export type SupplierTaxReportResponse =
  | SupplierTaxReceiptResponse
  | SupplierTaxSupplierResponse;

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
      query: (body) => ({
        url: "reports/dailySalesReport/get-daily-sales-table",
        method: "POST",
        body,
      }),
      providesTags: ["Reports"],
    }),
    getSupplierReceiptReport: builder.query<SupplierReceiptReportResponse, SupplierReportDateRequest>({
      query: (body) => ({
        url: "reports/suppliers/receipt-report",
        method: "POST",
        body,
      }),
      providesTags: ["Reports"],
    }),
    getSupplierPaymentReport: builder.query<SupplierPaymentReportResponse, SupplierReportDateRequest>({
      query: (body) => ({
        url: "reports/suppliers/payment-report",
        method: "POST",
        body,
      }),
      providesTags: ["Reports"],
    }),
    getProductSalesReport: builder.query<ProductSalesReportResponse, ProductSalesReportRequest>({
      query: (body) => ({
        url: "reports/productSales/get-product-sales-report",
        method: "POST",
        body,
      }),
      providesTags: ["Reports"],
    }),
    getSalesTaxReport: builder.query<SalesTaxReportResponse, SalesTaxReportRequest>({
      query: (body) => ({
        url: "reports/salesTax/get-sales-tax-report",
        method: "POST",
        body,
      }),
      providesTags: ["Reports"],
    }),
    getSupplierTaxReport: builder.query<SupplierTaxReportResponse, SupplierTaxReportRequest>({
      query: (body) => ({
        url: "reports/supplierTax/get-supplier-tax-report",
        method: "POST",
        body,
      }),
      providesTags: ["Reports"],
    }),
  }),
});

export const {
  useGetDailySalesReportQuery,
  useGetWeeklyBillCountsQuery,
  useGetDailySalesTableQuery,
  useGetSupplierReceiptReportQuery,
  useGetSupplierPaymentReportQuery,
  useGetProductSalesReportQuery,
  useGetSalesTaxReportQuery,
  useGetSupplierTaxReportQuery,
} = reportsApi;
