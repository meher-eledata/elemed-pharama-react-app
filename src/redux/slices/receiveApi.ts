export interface PurchaseOrder {
  po_number: string;
  ordered_date: string;
  supplier_name: string;
  total_amount: string;
  status: string;
  created_by?: number | string | null;
}

export interface ReceiptLineItem {
  product_id: string | number;
  received_qty: number;
  free_qty: number;
  total_amount: string;
  received_on: string;
}

export interface Receipt {
  receipt_id: number;
  // OUR goods-receipt number (legacy `GRN-000123` or the org's `receipt` scheme).
  // NOT the same as `invoice_number` below, which is the SUPPLIER's invoice number.
  receipt_number: string | null;
  po_id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string | null;
  received_on: string;
  received_by: string;
  receipt_status: string;
  receipt_file_url: string | null;
  receipt_file_type: string | null;
  receipt_file_name: string | null;
  receipt_file_uploaded_at: string | null;
  po_total_amount: string;
  total_paid: number;
  amount_left_to_pay: number;
  supplier_credit_available: string;
  last_payment_at: string | null;
  last_payment_method: string | null;
  last_payment_vendor: string | null;
  last_transaction_number: string | null;
  // ---- Soft-delete state (backend migration 028; POST /api/receive/delete-receipt) ----
  // A retired receipt is NOT hidden from this list — the row stays visible and carries
  // who deleted it, when and why, so the history is auditable. Treat every one of these
  // as read-only history: a DELETED receipt cannot be edited or paid (both endpoints
  // answer 409 RECEIPT_DELETED). `record_status` is COALESCEd server-side, so it is
  // always present; the other three are null on an ACTIVE receipt.
  record_status: 'ACTIVE' | 'DELETED';
  deletion_reason: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  // Legacy fields for backward compatibility
  id?: number; // Alias for receipt_id
  total_amount?: number; // Alias for po_total_amount (converted to number)
  transaction_number?: string; // Alias for last_transaction_number
  payment_vendor?: string; // Alias for last_payment_vendor
  invoice_date?: string; // Supplier invoice date from form
  invoice_number?: string; // The SUPPLIER's invoice number (r.supplier_invoice_number, aliased)
  invoice_attachment?: string; // Invoice attachment (base64 data URL)
}

export interface EditReceiptRequest {
  receipt_id: number;
  po_id: number;
  supplier_name: string;
  supplier_id: number;
  po_number: string | null;
  payment_method: string;
  payment_vendor: string;
  transaction_number: string;
  invoice_number?: string;
  invoice_date?: string; // Invoice date in ISO format
  invoice_attachment?: string; // Invoice attachment (base64 data URL)
  notes: string;
  created_by: string;
  total_amount?: number;
  Deleted: Array<{
    receipt_line_id: number;
  }>;
  Added: Array<{
    product: string;
    product_id: number;
    received_qty: number;
    free_qty: number;
    expiry_date: string;
    purchase_price: number;
    cgst: number;
    sgst: number;
    igst: number;
    discount: number;
    mrp: number;
    selling_price: number;
    pack_qty?: string;
  }>;
  Edited: Array<{
    receipt_line_id: number;
    po_line_id: number;
    batch_id: number;
    batch_number?: string;
    product_id: number;
    product_name: string;
    received_qty: number;
    free_qty: number;
    expiry_date: string;
    purchase_price: string;
    cgst: string;
    sgst: string;
    igst: string;
    discount: string;
    mrp: string;
    selling_price: string;
    pack_qty?: string;
  }>;
  // OPTIONAL (≤64 chars): duplicate submit with the same key returns 200 with the
  // stored outcome of the first attempt (see useIdempotencyKey).
  idempotency_key?: string;
}

export interface EditReceiptResponse {
  id: number;
  po_id: number;
  supplier_id: number;
  product_id: number;
  shipment_id: number;
  received_by: string;
  received_on: string;
  notes: string;
  receipt_status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

// New types for receipt lines
export interface ReceiptLine {
  batch_id: number;
  // The receipt header's own number, repeated on every line (see Receipt.receipt_number).
  receipt_number: string | null;
  cgst: string;
  discount: string;
  free_qty: number;
  igst: string;
  notes: string;
  payment_method: string;
  payment_vendor: string;
  po_id: number;
  po_line_id: number;
  po_number: string;
  product_id: number;
  product_name: string;
  type?: string; // Dosage form / product type (backend adds this to the get-receipt-lines feed)
  receipt_line_id: number;
  received_qty: number;
  sgst: string;
  supplier_id: number;
  supplier_name: string;
  transaction_number: string;
  unit_price: string;
  mrp?: string; // MRP field from backend (DECIMAL returned as string)
  purchase_price?: string; // Purchase price field from backend (DECIMAL returned as string)
  expiry_date?: string | null; // Expiry date field from backend
  batch_number?: string; // Batch number field from backend
  hsn_id?: string; // HSN ID field from backend
  hsn_code?: string; // HSN code field from backend (if exists)
  // Soft-delete state of the PARENT receipt, repeated on every line (see Receipt above).
  record_status?: 'ACTIVE' | 'DELETED';
  deletion_reason?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export interface GetReceiptLinesRequest {
  receipt_id: number;
}

export interface EditReceiptLineQuantityRequest {
  id: number;
  received_qty: number;
}

export interface EditReceiptLineQuantityResponse {
  id: number;
  receipt_id: number;
  po_line_id: number;
  supplier_id: number;
  product_id: number;
  received_qty: number;
  free_qty: number;
  received_on: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

// POST /api/receive/delete-receipt — SOFT delete. Nothing is destroyed: stock is
// reversed with a posted `Receipt_Delete_OUT` transaction, supplier payments are
// VOIDed, and the receipt is flagged record_status='DELETED'.
// `deleted_by` and `deletion_reason` are BOTH mandatory server-side (400 otherwise) —
// they are the audit trail, so the UI must collect a reason before calling this.
export interface DeleteReceiptRequest {
  receipt_id: number;
  deleted_by: string;
  deletion_reason: string;
}

export interface DeleteReceiptResponse {
  message: string;
  receipt_id: number;
  receipt_number: string | null;
  po_id: number;
  record_status: 'DELETED';
  deleted_by: string;
  deletion_reason: string;
  reversed_line_count: number;
  reversed_unit_quantity: number;
  voided_payment_count: number;
  reversed_credit_txn_count: number;
}

export interface DeleteReceiptLineRequest {
  id: number;
}

export interface DeleteReceiptLineResponse {
  message: string;
}

export interface GetPurchaseOrderPaymentsRequest {
  po_id: number;
}

export interface PurchaseOrderPayment {
  id: number;
  payment_method: string;
  payment_vendor: string | null;
  transaction_number: string;
  payment_status: string;
  payment_amount: number;
  payment_currency: string;
  created_at: string;
  updated_at: string;
}

export interface GetPurchaseOrderPaymentsResponse {
  po: {
    po_id: number;
    po_number: string;
    supplier_id: number;
    total_amount: string;
  };
  payments: PurchaseOrderPayment[];
  total_paid: number;
  amount_left_to_pay: number;
}

export interface GetSupplierCreditBalanceRequest {
  supplier_id: number;
}

export interface GetSupplierCreditBalanceResponse {
  supplier_id: number;
  available_credit: number;
  last_txn_id: number | null;
}

// ---- Invoice extraction (POST /api/receive/extract-invoice) ----
// Confidence-scored DRAFT used to PRE-FILL the receive form. Persists nothing.
// Every field carries a 0-1 `confidence`; the UI auto-fills at/above meta.threshold
// and leaves below-threshold/unmatched fields BLANK (listed in unresolved_fields).
export interface ExtractInvoiceCandidate {
  id: number;
  name: string;
  score: number;
  // Product candidates carry dosage-form + brand so same-named products are
  // distinguishable in the review banner (supplier candidates omit these).
  type?: string | null;
  brand_name?: string | null;
}

export interface ExtractInvoiceField<T = string | null> {
  value: T;
  confidence: number;
}

export interface ExtractInvoiceSupplier {
  id: number | null;
  matched_name: string | null;
  confidence: number;
  candidates: ExtractInvoiceCandidate[];
}

export interface ExtractInvoiceProduct {
  id: number | null;
  name: string | null;
  confidence: number;
  candidates: ExtractInvoiceCandidate[];
}

export interface ExtractInvoiceLine {
  raw_text: string;
  product: ExtractInvoiceProduct;
  batch_number: ExtractInvoiceField;
  expiry_date: ExtractInvoiceField; // YYYY-MM-DD
  received_qty: ExtractInvoiceField<string | number | null>;
  free_qty: ExtractInvoiceField<string | number | null>;
  purchase_price: ExtractInvoiceField<string | number | null>;
  cgst: ExtractInvoiceField<string | number | null>;
  sgst: ExtractInvoiceField<string | number | null>;
  igst: ExtractInvoiceField<string | number | null>;
  discount: ExtractInvoiceField<string | number | null>;
  mrp: ExtractInvoiceField<string | number | null>;
}

export interface ExtractInvoiceDraft {
  header: {
    supplier: ExtractInvoiceSupplier;
    invoice_number: ExtractInvoiceField;
    invoice_date: ExtractInvoiceField; // YYYY-MM-DD
    po_number: ExtractInvoiceField;
  };
  lines: ExtractInvoiceLine[];
  unresolved_fields: string[]; // dotted/indexed paths below threshold or unmatched
  meta: { driver: "textract" | "stub"; threshold: number };
  // Id of the best-effort persisted `invoice_extraction_draft` row for this
  // extraction (null when persistence failed). Echoed back as the optional
  // `extraction_id` on submit-receipt to link draft → receipt.
  extraction_id: number | null;
}

import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQuery";
import { dashboardApi } from "./dashboardApi";
import { inventoryApi } from "./inventoryApi";
import { reportsApi } from "./reportsApi";

export const receiveApi = createApi({
  reducerPath: "receiveApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Receive", "ReceiptLines", "Inventory", "Dashboard"] as const,
  endpoints: (builder) => ({
    getCurrentPurchaseOrders: builder.query<PurchaseOrder[], void>({
      query: () => "receive/current-purchase-orders/",
      providesTags: ["Receive"],
    }),
    getUniqueSupplierNames: builder.query<{ supplier_name: string, supplier_id: number }[], void>({
      query: () => "receive/unique-supplier-names/",
      providesTags: ["Receive"],
    }),
    getReceiptsForSupplier: builder.mutation<
      ReceiptLineItem[],
      { supplierID: string | number }
    >({
      query: (body) => ({
        url: "receive/receipts-for-supplier/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Receive"],
    }),

    updatePurchaseOrder: builder.mutation<
      PurchaseOrder,
      { poNumber: string; changes: Partial<Pick<PurchaseOrder, "ordered_date" | "status" | "total_amount" | "created_by">> & { notes?: string } }
    >({
      query: ({ poNumber, changes }) => ({
        url: `receive/purchase-orders/${encodeURIComponent(poNumber)}/`,
        method: "PATCH",
        body: changes,
      }),
      invalidatesTags: ["Receive"],
    }),

    deletePurchaseOrder: builder.mutation<void, { poNumber: string }>({
      query: ({ poNumber }) => ({
        url: `receive/purchase-orders/${encodeURIComponent(poNumber)}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Receive"],
    }),

    // New endpoints for Receipt management
    getReceipts: builder.query<Receipt[], void>({
      query: () => "receive/get-receipts/",
      providesTags: ["Receive"],
    }),

    editReceipt: builder.mutation<EditReceiptResponse, EditReceiptRequest>({
      query: (body) => ({
        url: "receive/edit-receipt/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Receive"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));
          dispatch(inventoryApi.util.invalidateTags(["Inventory"]));
          dispatch(reportsApi.util.invalidateTags(["Reports"]));
        } catch (error) { }
      },
    }),

    deleteReceipt: builder.mutation<DeleteReceiptResponse, DeleteReceiptRequest>({
      query: (body) => ({
        // Singular. The old "receive/delete-receipts/" (plural) never existed on the
        // backend — this mutation 404'd for its whole life until the endpoint landed
        // 2026-08-19. Invalidates Inventory/Reports below because a delete reverses
        // stock and removes the receipt from the purchase + GST reports.
        url: "receive/delete-receipt",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Receive"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));
          dispatch(inventoryApi.util.invalidateTags(["Inventory"]));
          dispatch(reportsApi.util.invalidateTags(["Reports"]));
        } catch (error) { }
      },
    }),

    // Receipt line endpoints
    getReceiptLines: builder.query<ReceiptLine[], GetReceiptLinesRequest>({
      query: (body) => ({
        url: "receive/get-receipt-lines/",
        method: "POST",
        body,
      }),
      providesTags: ["Receive", "ReceiptLines"],
    }),

    editReceiptLineQuantity: builder.mutation<
      EditReceiptLineQuantityResponse,
      EditReceiptLineQuantityRequest
    >({
      query: (body) => ({
        url: "receive/edit-receipt-line-quantity/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Receive", "ReceiptLines"],
    }),

    deleteReceiptLine: builder.mutation<
      DeleteReceiptLineResponse,
      DeleteReceiptLineRequest
    >({
      query: (body) => ({
        url: "receive/delete-receipt-line/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Receive", "ReceiptLines"],
    }),

    // Submit receipt endpoint
    submitReceipt: builder.mutation<
      {
        message: string;
        po_id: number;
        receipt_id: number;
        // OUR goods-receipt number (legacy `GRN-000123` or the org's `receipt` scheme);
        // opaque — never parsed or derived client-side. See Receipt.receipt_number.
        receipt_number: string | null;
        total_amount: number;
        amount_paid: number;
        amount_due: number;
        payment_status: string;
        // Legacy field for backward compatibility
        receiptId?: number;
      },
      {
        supplier_name: string;
        supplier_id: number;
        po_number: string | null;
        invoice_number?: string;
        notes: string;
        created_by: string;
        total_amount?: number;
        lines: Array<{
          product: string;
          product_id: number | null; // Allow null for product_id
          batch_number?: string; // Optional batch_number
          received_qty: number;
          free_qty: number;
          expiry_date: string;
          purchase_price: number;
          cgst: number;
          sgst: number;
          igst: number;
          discount: number;
          mrp?: number;
          selling_price?: number;
          pack_qty?: string;
        }>;
        // OPTIONAL (≤64 chars): duplicate submit with the same key returns 200 with the
        // stored outcome of the first attempt (see useIdempotencyKey).
        idempotency_key?: string;
        // OPTIONAL: the extract-invoice draft id when the form was pre-filled from an
        // extraction. Absent/invalid values are silently ignored by the backend.
        extraction_id?: number;
      }
    >({
      query: (body) => ({
        url: "receive/submit-receipt/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Receive", "Inventory"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));
          dispatch(inventoryApi.util.invalidateTags(["Inventory"]));
          dispatch(reportsApi.util.invalidateTags(["Reports"]));
        } catch (error) { }
      },
    }),

    // Get all products endpoint (shared across modules)
    // `schedule` semantics (api-contract.md): NULL = not yet attributed (sale-cart popup
    // prompts once); 'NONE' = explicitly none (never prompts). Both display blank.
    getProducts: builder.query<{ name: string, id: number, currentQuantity?: number, type?: string, brand_name?: string | null, schedule: string | null }[], void>({
      query: () => {
        return "receive/get-products/";
      },
      // Tagged with "Inventory" so a sale/return/edit/delete elsewhere refreshes the
      // Find Product dropdown counts automatically (cross-API invalidation from salesApi).
      providesTags: ["Receive", "Inventory"],
      transformResponse: (response: any, meta) => {
        if (!response) {
          return [];
        }

        if (!Array.isArray(response)) {
          return [];
        }

        if (response.length === 0) {
          return [];
        }

        const products = response
          .filter((product: any) => {
            const isArrayFormat = product && Array.isArray(product) && product.length >= 2;
            const isObjectFormat = product && typeof product === 'object' && !Array.isArray(product) && product.name;
            return isArrayFormat || isObjectFormat;
          })
          .map((product: any) => {
            if (Array.isArray(product)) {
              return { name: product[0], id: product[1], currentQuantity: product[2] ? Number(product[2]) : 0, schedule: null };
            }
            return {
              name: product.name,
              id: product.product_id || product.id,
              currentQuantity: product.currentQuantity ? Number(product.currentQuantity) : 0,
              type: product.type ?? '',
              brand_name: product.brand_name ?? null,
              schedule: product.schedule ?? null
            };
          })
          .filter((product: any) => {
            const isValid = product.name && product.name.trim() !== '' && product.id;
            return isValid;
          });

        return products;
      },
      transformErrorResponse: (response: any) => {
        return response;
      },
    }),

    // Upload receipt file endpoint
    uploadReceiptFile: builder.mutation<
      {
        message: string;
        receipt_id: number;
        receipt_file_url: string;
        receipt_file_type: string;
        receipt_file_name: string;
        size_bytes: number;
      },
      { receiptId: number; file: File }
    >({
      query: ({ receiptId, file }) => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: `receive/${receiptId}/upload-file/`,
          method: 'POST',
          body: formData,
          // RTK Query will automatically set Content-Type with boundary for FormData
        };
      },
      invalidatesTags: ['Receive'],
    }),

    // Extract-invoice PREVIEW: uploads the supplier invoice and returns a
    // confidence-scored DRAFT used to pre-fill the receive form. Persists nothing
    // (no receipt is created), so it invalidates no tags. Multipart upload mirrors
    // uploadReceiptFile; the bearer token is injected app-wide by
    // baseQueryWithReauth's prepareHeaders (single-tenant — no location header).
    extractInvoice: builder.mutation<ExtractInvoiceDraft, { file: File }>({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: 'receive/extract-invoice',
          method: 'POST',
          body: formData,
          // RTK Query sets the multipart Content-Type (with boundary) for FormData.
        };
      },
    }),

    // Get receipt file URL (returns the URL to fetch the file)
    getReceiptFile: builder.query<Blob, number>({
      query: (receiptId) => ({
        url: `receive/${receiptId}/file/`,
        responseHandler: async (response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch file');
          }
          return await response.blob();
        },
      }),
    }),

    // Upsert receipt payments endpoint
    upsertPurchaseOrderPayments: builder.mutation<
      { message: string },
      {
        receipt_id: number;
        created_by: string;
        payments: Array<{
          payment_method: string;
          payment_vendor: string | null;
          transaction_number: string;
          transaction_date: string;
          payment_amount: number;
          details: string;
        }>;
      }
    >({
      query: (body) => ({
        url: "receive/upsert-purchase-order-payments/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Receive"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));
          dispatch(reportsApi.util.invalidateTags(["Reports"]));
        } catch (error) { }
      },
    }),

    getPurchaseOrderPayments: builder.mutation<
      GetPurchaseOrderPaymentsResponse,
      GetPurchaseOrderPaymentsRequest
    >({
      query: (body) => ({
        url: "receive/get-purchase-order-payments/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Receive"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));
          dispatch(reportsApi.util.invalidateTags(["Reports"]));
        } catch (error) { }
      },
    }),
    getSupplierCreditBalance: builder.query<
      GetSupplierCreditBalanceResponse,
      GetSupplierCreditBalanceRequest
    >({
      query: (body) => ({
        url: "receive/get-supplier-credit-balance/",
        method: "POST",
        body,
      }),
      providesTags: ["Receive"],
    }),

    // Authenticated file-link resolver: returns a presigned S3 url (dev) or null (local disk).
    getReceiptFileLink: builder.query<
      {
        receipt_id: number;
        url: string | null;
        file_name: string | null;
        file_type: string | null;
        expires_in: number | null;
      },
      number
    >({
      query: (receiptId) => `receive/${receiptId}/file-link`,
    }),

    // Adjust supplier credit
    adjustSupplierCredit: builder.mutation<
      any,
      {
        supplier_id: number;
        direction: "IN" | "OUT";
        amount: number;
        credit_type: string;
        notes: string;
        created_by: string;
        // OPTIONAL (≤64 chars): duplicate submit with the same key returns 200 with the
        // stored outcome of the first attempt (see useIdempotencyKey).
        idempotency_key?: string;
      }
    >({
      query: (body) => ({
        url: "receive/adjust-supplier-credit/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Receive"],
    }),
  }),
});

export const {
  useGetCurrentPurchaseOrdersQuery,
  useGetUniqueSupplierNamesQuery,
  useGetReceiptsForSupplierMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useGetReceiptsQuery,
  useEditReceiptMutation,
  useDeleteReceiptMutation,
  useGetReceiptLinesQuery,
  useLazyGetReceiptLinesQuery,
  useEditReceiptLineQuantityMutation,
  useDeleteReceiptLineMutation,
  useSubmitReceiptMutation,
  useGetProductsQuery,
  useUploadReceiptFileMutation,
  useExtractInvoiceMutation,
  useGetReceiptFileQuery,
  useUpsertPurchaseOrderPaymentsMutation,
  useGetPurchaseOrderPaymentsMutation,
  useGetSupplierCreditBalanceQuery,
  useAdjustSupplierCreditMutation, // IN: Add credit, OUT: Subtract credit
  useLazyGetReceiptFileLinkQuery,
} = receiveApi;

export const getReceiptFileUrl = (receiptId: number): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/';
  return `${baseUrl}receive/${receiptId}/file`;
};