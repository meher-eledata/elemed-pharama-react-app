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
  id: number;
  po_id: number;
  po_number?: string; // Add po_number field
  supplier_name: string;
  received_on: string;
  received_by: string;
  receipt_status: string;
  total_amount: number;
  transaction_number?: string;
  payment_vendor?: string;
  invoice_date?: string; // Invoice date from form
  invoice_attachment?: string; // Invoice attachment (base64 data URL)
}

export interface EditReceiptRequest {
  receipt_id: number;
  po_id: number;
  supplier_name: string;
  supplier_id: number;
  po_number: string;
  payment_method: string;
  payment_vendor: string;
  transaction_number: string;
  invoice_date?: string; // Invoice date in ISO format
  invoice_attachment?: string; // Invoice attachment (base64 data URL)
  notes: string;
  created_by: string;
  Deleted: Array<{
    receipt_line_id: number;
  }>;
  Added: Array<{
    product: string;
    product_id: number;
    received_qty: number;
    free_qty: number;
    expiry_date: string;
    unit_price: number;
    cgst: number;
    sgst: number;
    igst: number;
    discount: number;
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
    unit_price: string;
    cgst: string;
    sgst: string;
    igst: string;
    discount: string;
  }>;
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
  receipt_line_id: number;
  received_qty: number;
  sgst: string;
  supplier_id: number;
  supplier_name: string;
  transaction_number: string;
  unit_price: string;
  expiry_date?: string | null; // Expiry date field from backend
  batch_number?: string; // Batch number field from backend
  hsn_id?: string; // HSN ID field from backend
  hsn_code?: string; // HSN code field from backend (if exists)
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

export interface DeleteReceiptRequest {
  id: number;
}

export interface DeleteReceiptResponse {
  message: string;
}

export interface DeleteReceiptLineRequest {
  id: number;
}

export interface DeleteReceiptLineResponse {
  message: string;
}

import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQuery";

export const receiveApi = createApi({
  reducerPath: "receiveApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Receive", "ReceiptLines"] as const,
  endpoints: (builder) => ({
    getCurrentPurchaseOrders: builder.query<PurchaseOrder[], void>({
      query: () => "receive/current-purchase-orders",
      providesTags: ["Receive"],
    }),
    getUniqueSupplierNames: builder.query<{supplier_name: string, supplier_id: number}[], void>({
      query: () => "receive/unique-supplier-names",
      providesTags: ["Receive"],
    }),
    getReceiptsForSupplier: builder.mutation<
      ReceiptLineItem[],
      { supplierID: string | number }
    >({
      query: (body) => ({
        url: "receive/receipts-for-supplier",
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
        url: `receive/purchase-orders/${encodeURIComponent(poNumber)}`,
        method: "PATCH",
        body: changes,
      }),
      invalidatesTags: ["Receive"],
    }),

    deletePurchaseOrder: builder.mutation<void, { poNumber: string }>({
      query: ({ poNumber }) => ({
        url: `receive/purchase-orders/${encodeURIComponent(poNumber)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Receive"],
    }),

    // New endpoints for Receipt management
    getReceipts: builder.query<Receipt[], void>({
      query: () => "receive/get-receipts",
      providesTags: ["Receive"],
    }),

    editReceipt: builder.mutation<EditReceiptResponse, EditReceiptRequest>({
      query: (body) => ({
        url: "receive/edit-receipt",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Receive"],
    }),

    deleteReceipt: builder.mutation<DeleteReceiptResponse, DeleteReceiptRequest>({
      query: (body) => ({
        url: "receive/delete-receipts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Receive"],
    }),

    // Receipt line endpoints
    getReceiptLines: builder.query<ReceiptLine[], GetReceiptLinesRequest>({
      query: (body) => ({
        url: "receive/get-receipt-lines",
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
        url: "receive/edit-receipt-line-quantity",
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
        url: "receive/delete-receipt-line",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Receive", "ReceiptLines"],
    }),

    // Submit receipt endpoint
    submitReceipt: builder.mutation<
      { message: string; receiptId: number },
      {
        supplier_name: string;
        supplier_id?: number; // Make supplier_id optional
        po_number: string;
        payment_method: string;
        payment_vendor: string;
        transaction_number: string;
        invoice_date?: string; // Invoice date in ISO format
        invoice_attachment?: string; // Invoice attachment (base64 data URL)
        notes: string;
        created_by: string;
        lines: Array<{
          product: string;
          product_id: number | null; // Allow null for product_id
          batch_number?: string; // Optional batch_number
          received_qty: number;
          free_qty: number;
          expiry_date: string;
          unit_price: number;
          cgst: number;
          sgst: number;
          igst: number;
          discount: number;
        }>;
      }
    >({
      query: (body) => {
        return {
          url: "receive/submit-receipt",
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["Receive"],
    }),

    // Get all products endpoint (shared across modules)
    getProducts: builder.query<{name: string, id: number}[], void>({
      query: () => {
        return "receive/get-products";
      },
      providesTags: ["Receive"],
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
            const isValid = product && Array.isArray(product) && product.length >= 2;
            return isValid;
          })
          .map((product: any) => ({
            name: product[0],
            id: product[1]
          }))
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
  useEditReceiptLineQuantityMutation,
  useDeleteReceiptLineMutation,
  useSubmitReceiptMutation,
  useGetProductsQuery,
} = receiveApi;