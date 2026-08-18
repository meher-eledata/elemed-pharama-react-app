import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';
import { receiveApi } from './receiveApi';
import { inventoryApi } from './inventoryApi';

// ---------------------------------------------------------------------------
// Supplier Purchase Return API (/api/supplier-returns/*, JWT'd, not admin-gated).
// Shapes per api-contract.md "Supplier Purchase Return endpoints".
// The SERVER recomputes all money — the client only sends supplier/settlement
// choices and { batch_id, quantity } lines.
// NOTE: in get-return-details each line's cgst/sgst/igst/discount arrive as raw
// pg DECIMAL STRINGS; they are Number()-normalized in transformResponse below.
// ---------------------------------------------------------------------------

export type GstTreatment = 'WITH_GST' | 'WITHOUT_GST';
export type ValueBasis = 'PURCHASE_PRICE' | 'MRP';
export type SettlementMode = 'CREDIT_NOTE' | 'CASH' | 'UPI';
export type ReturnStatus = 'AWAITING_CREDIT' | 'CREDIT_RECEIVED' | 'SETTLED';
export type ExpiryStatus = 'EXPIRED' | 'NEAR_EXPIRY' | 'OK';

// ---- GET /supplier-returns/returnable-batches ----
export interface ReturnableBatch {
  batch_id: number;
  batch_number: string;
  product_id: number;
  product_name: string;
  type: string;
  brand_name: string | null;
  quantity: number; // UNITS on hand
  receipt_qty: number | null; // UNITS originally received (comparable with quantity)
  pack_qty: number;
  purchase_price_per_unit: number | null; // per UNIT; null = no attributed purchase price
  mrp: number; // per unit
  gst_rate: number | null; // % from the attributed PO line; null when unknown/unattributed
  expiry_date: string | null;
  days_until_expiry: number | null; // negative when past
  expiry_status: ExpiryStatus;
  supplier_id: number | null; // null = unattributable (not returnable)
  supplier_name: string | null;
  receipt_id: number | null;
  // OUR generated GRN document number (opaque — never parse or rebuild it);
  // null exactly when the batch is unattributable. Display only — identity stays receipt_id.
  receipt_number: string | null;
  supplier_invoice_number: string | null;
  po_number: string | null;
  receipt_line_id: number | null;
}

export interface ReturnableBatchesResponse {
  batches: ReturnableBatch[];
}

// ---- POST /supplier-returns/submit-return ----
export interface SubmitReturnRequest {
  supplier_id: number;
  idempotency_key?: string; // duplicate key → 200 with the original result body (no second return)
  gst_treatment: GstTreatment;
  value_basis: ValueBasis;
  settlement_mode: SettlementMode;
  settlement_reference?: string; // REQUIRED non-empty for UPI; optional for CASH; ignored for CREDIT_NOTE
  reason?: string; // truncated to 255 server-side
  notes?: string;
  lines: Array<{ batch_id: number; quantity: number }>;
}

export interface SubmitReturnResponse {
  message: string;
  supplier_return_id: number;
  return_number: string; // e.g. 'SR-000042'
  return_status: ReturnStatus;
  totals: {
    taxable_value: number;
    cgst_amount: number;
    sgst_amount: number;
    igst_amount: number; // inter-state returns carry IGST here (CGST/SGST 0)
    total_amount: number;
  };
  // non-null only for CREDIT_NOTE; new_balance may be null on an idempotent duplicate 200.
  credit: { credit_txn_id: number; new_balance: number | null } | null;
}

// ---- POST /supplier-returns/list-returns ----
export interface ListReturnsRequest {
  search?: string;
  status?: ReturnStatus;
  supplier_id?: number; // positive integer; ANDed with search/status
  start_date?: string; // 'YYYY-MM-DD', inclusive; blank/whitespace ignored server-side
  end_date?: string; // 'YYYY-MM-DD', inclusive; 400 when start_date > end_date
  limit?: number; // default 50, capped at 200
  offset?: number;
}

export interface SupplierReturnRow {
  supplier_return_id: number;
  return_number: string | null;
  supplier_id: number;
  supplier_name: string;
  return_date: string;
  created_by: string;
  reason: string | null;
  notes: string | null;
  return_status: ReturnStatus;
  gst_treatment: GstTreatment;
  value_basis: ValueBasis;
  settlement_mode: SettlementMode;
  settlement_reference: string | null;
  taxable_value: number | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  total_amount: number | null;
  // Cumulative credit received so far (default 0). A return stays AWAITING_CREDIT until this
  // reaches total_amount; the remaining owed is total_amount - credit_received_amount.
  credit_received_amount: number | null;
  credit_received_date: string | null; // 'YYYY-MM-DD'
  credit_received_reference: string | null; // added 2026-08-11 (same field as the get-return-details header)
  credit_note_file_name: string | null;
  credit_note_file_uploaded_at: string | null;
  line_count: number;
  units_count: number;
}

export interface ListReturnsResponse {
  rows: SupplierReturnRow[];
  total: number;
  // Aggregates over the COMPLETE filtered set, IGNORING limit/offset (0 when empty,
  // never null) — the page fetches at most 200 rows, so never sum `rows` client-side.
  total_amount_owed: number;
  // REMAINING owed = SUM(total_amount - credit_received_amount) over AWAITING_CREDIT rows.
  total_awaiting_credit: number;
}

// ---- POST /supplier-returns/get-return-details ----
export interface ReturnDetailsLine {
  id: number;
  supplier_return_id: number;
  product_id: number;
  product_name: string;
  batch_number: string;
  quantity: number; // UNITS
  reason: string | null;
  purchase_price: number | null; // per UNIT
  unit_value: number | null; // per-UNIT valuation used
  gst_rate: number | null; // % from the attributed PO line
  mrp: number | null;
  total_amount: number | null;
  // Arrive as raw pg DECIMAL strings; Number()-normalized in transformResponse.
  cgst: number;
  sgst: number;
  igst: number;
  discount: number;
  batch_id: number | null;
  expiry_date: string | null; // 'YYYY-MM-DD' snapshot at return time
  receipt_id: number | null;
  receipt_line_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReturnDetailsResponse {
  id: number;
  supplier_return_id: number;
  return_number: string | null;
  supplier_id: number;
  supplier_name: string;
  return_date: string;
  created_by: string;
  reason: string | null;
  notes: string | null;
  payment_id: number | null;
  return_status: ReturnStatus;
  gst_treatment: GstTreatment;
  value_basis: ValueBasis;
  settlement_mode: SettlementMode;
  settlement_reference: string | null;
  taxable_value: number | null;
  cgst_amount: number | null;
  sgst_amount: number | null;
  igst_amount: number | null; // inter-state returns carry IGST here (CGST/SGST 0)
  total_amount: number | null;
  credit_txn_id: number | null;
  credit_received_amount: number | null;
  credit_received_date: string | null;
  credit_received_reference: string | null;
  credit_received_by: string | null;
  credit_received_at: string | null;
  credit_note_file_name: string | null;
  credit_note_file_uploaded_at: string | null;
  created_at: string;
  updated_at: string;
  lines: ReturnDetailsLine[];
}

// ---- Credit-note file (photo/scan) endpoints — mirrors the receipt-file pattern ----
export interface UploadCreditNoteFileResponse {
  message: string;
  credit_note_file: {
    name: string;
    type: string;
    uploaded_at: string;
    uploaded_by: string;
  };
}

export interface CreditNoteFileLinkResponse {
  url: string | null; // null = disk driver → fall back to the authenticated blob fetch
  name: string | null;
  type: string | null;
}

// ---- POST /supplier-returns/record-credit-received ----
export interface RecordCreditReceivedRequest {
  supplier_return_id: number;
  amount: number; // > 0, metadata only
  date: string; // 'YYYY-MM-DD'
  reference?: string;
}

export interface RecordCreditReceivedResponse {
  message: string;
  supplier_return_id: number;
  return_number: string | null;
  // A PARTIAL record keeps AWAITING_CREDIT; only a fully-covered return flips to CREDIT_RECEIVED.
  return_status: 'AWAITING_CREDIT' | 'CREDIT_RECEIVED';
  // Backend returns only these keys on record-credit (date/reference/by live on the row/details, not here).
  credit_received: {
    amount: number; // this record's amount (2 dp)
    cumulative_received: number; // total received so far including this record
    remaining: number | null; // total_amount - cumulative_received (null when total_amount is null)
    fully_received: boolean;
  };
}

export const supplierReturnsApi = createApi({
  reducerPath: 'supplierReturnsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['ReturnableBatches', 'SupplierReturns', 'SupplierReturnDetails'] as const,
  endpoints: (builder) => ({
    getReturnableBatches: builder.query<ReturnableBatchesResponse, void>({
      query: () => 'supplier-returns/returnable-batches',
      providesTags: ['ReturnableBatches'],
    }),

    submitReturn: builder.mutation<SubmitReturnResponse, SubmitReturnRequest>({
      query: (body) => ({
        url: 'supplier-returns/submit-return',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ReturnableBatches', 'SupplierReturns'],
      // Stock is decremented and (CREDIT_NOTE) supplier credit is posted, so
      // refresh the inventory feeds and the receive-module credit balance too.
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(inventoryApi.util.invalidateTags(['Inventory']));
          dispatch(receiveApi.util.invalidateTags(['Receive']));
        } catch (error) { }
      },
    }),

    listReturns: builder.query<ListReturnsResponse, ListReturnsRequest>({
      query: (body) => ({
        url: 'supplier-returns/list-returns',
        method: 'POST',
        body,
      }),
      providesTags: ['SupplierReturns'],
    }),

    getReturnDetails: builder.query<ReturnDetailsResponse, { supplier_return_id: number }>({
      query: (body) => ({
        url: 'supplier-returns/get-return-details',
        method: 'POST',
        body,
      }),
      // Number()-normalize the four pg DECIMAL string leaks at the boundary.
      transformResponse: (response: any): ReturnDetailsResponse => ({
        ...response,
        lines: (response?.lines ?? []).map((line: any) => ({
          ...line,
          cgst: Number(line.cgst) || 0,
          sgst: Number(line.sgst) || 0,
          igst: Number(line.igst) || 0,
          discount: Number(line.discount) || 0,
        })),
      }),
      providesTags: (_res, _err, arg) => [
        { type: 'SupplierReturnDetails', id: arg.supplier_return_id },
      ],
    }),

    // Optional credit-note photo/scan (png/jpeg/pdf, 15 MB); replace allowed.
    // 409 when the return is not CREDIT_NOTE.
    uploadCreditNoteFile: builder.mutation<
      UploadCreditNoteFileResponse,
      { supplierReturnId: number; file: File }
    >({
      query: ({ supplierReturnId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `supplier-returns/${supplierReturnId}/credit-note-file`,
          method: 'POST',
          body: formData,
          // RTK Query sets the multipart Content-Type (with boundary) for FormData.
        };
      },
      invalidatesTags: (_res, _err, arg) => [
        'SupplierReturns',
        { type: 'SupplierReturnDetails', id: arg.supplierReturnId },
      ],
    }),

    // Presigned link resolver; url null on the local-disk driver (use the blob route).
    getCreditNoteFileLink: builder.query<CreditNoteFileLinkResponse, number>({
      query: (supplierReturnId) => `supplier-returns/${supplierReturnId}/credit-note-file-link`,
    }),

    // Authenticated byte stream — never link to it with a plain <a href> (needs Bearer).
    getCreditNoteFile: builder.query<Blob, number>({
      query: (supplierReturnId) => ({
        url: `supplier-returns/${supplierReturnId}/credit-note-file`,
        responseHandler: async (response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch file');
          }
          return await response.blob();
        },
      }),
    }),

    recordCreditReceived: builder.mutation<
      RecordCreditReceivedResponse,
      RecordCreditReceivedRequest
    >({
      query: (body) => ({
        url: 'supplier-returns/record-credit-received',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        'SupplierReturns',
        { type: 'SupplierReturnDetails', id: arg.supplier_return_id },
      ],
    }),
  }),
});

export const {
  useGetReturnableBatchesQuery,
  useSubmitReturnMutation,
  useListReturnsQuery,
  useGetReturnDetailsQuery,
  useRecordCreditReceivedMutation,
  useUploadCreditNoteFileMutation,
  useLazyGetCreditNoteFileLinkQuery,
  useLazyGetCreditNoteFileQuery,
} = supplierReturnsApi;
