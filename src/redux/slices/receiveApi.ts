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
  supplier_name: string;
  received_on: string;
  received_by: string;
  receipt_status: string;
  total_amount: number;
}

export interface EditReceiptRequest {
  id: number;
  po_id: number;
  received_on: string;
  received_by: string;
  receipt_status: string;
  total_amount: number;
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
  id: number;
  name: string;
  type: string;
  received_qty: number;
  hsn_id: string;
  total_amount: number;
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

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
export const receiveApi = createApi({
  reducerPath: "receiveApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:3000/api",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any)?.auth?.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Receive"],
  endpoints: (builder) => ({
    getCurrentPurchaseOrders: builder.query<PurchaseOrder[], void>({
      query: () => "receive/current-purchase-orders",
      providesTags: ["Receive"],
    }),
    getUniqueSupplierNames: builder.query<string[], void>({
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
        url: "receive/edit-receipts",
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
      providesTags: ["Receive"],
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
      invalidatesTags: ["Receive"],
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
  useEditReceiptLineQuantityMutation,
  useDeleteReceiptLineMutation,
} = receiveApi;