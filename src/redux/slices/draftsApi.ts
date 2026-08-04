import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';
import { CartItem, SalesFormData } from './cartSlice';

// Financial summary snapshot (strings mirror SalesReceipt state exactly).
export interface DraftFinancials {
  totalValue: string;
  totalDiscount: string;
  taxAmount: string;
  totalPayableAmount: string;
}

// Loss-free snapshot of an in-progress sale — everything needed to rehydrate the
// working cart on resume. Reuses the canonical cart types (no parallel shapes).
export interface DraftPayload {
  formData: SalesFormData | null;
  items: CartItem[];
  financials: DraftFinancials;
  splitPayments: any[];
  doctorId?: number;
  patientType: string;
}

// Row returned by the list endpoint (no payload).
export interface DraftListItem {
  id: number;
  customer_name: string | null;
  customer_phone: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  // node-postgres returns DECIMAL as a string; coerce with Number(...) at the UI boundary.
  total_amount: string | null;
  item_count: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// Full draft returned by GET sales/drafts/:id (list row + payload).
export interface DraftDetail extends DraftListItem {
  payload: DraftPayload;
}

export interface GetDraftsResponse {
  drafts: DraftListItem[];
}

// Body shared by create + update. Summary columns are denormalized for the list;
// payload is the source of truth for resume.
export interface DraftRequest {
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  invoice_number?: string;
  invoice_date?: string; // YYYY-MM-DD
  total_amount?: number;
  item_count?: number;
  payload: DraftPayload;
}

export interface CreateDraftResponse {
  id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateDraftResponse {
  id: number;
  updated_at: string;
}

export interface DeleteDraftResponse {
  message: string;
  id: number;
}

export const draftsApi = createApi({
  reducerPath: 'draftsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Drafts'] as const,
  endpoints: (builder) => ({
    createDraft: builder.mutation<CreateDraftResponse, DraftRequest>({
      query: (body) => ({
        url: 'sales/drafts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Drafts'],
    }),

    getDrafts: builder.query<DraftListItem[], void>({
      query: () => 'sales/drafts',
      transformResponse: (response: GetDraftsResponse): DraftListItem[] =>
        response?.drafts ?? [],
      providesTags: ['Drafts'],
    }),

    getDraft: builder.query<DraftDetail, number>({
      query: (id) => `sales/drafts/${id}`,
      providesTags: ['Drafts'],
    }),

    updateDraft: builder.mutation<UpdateDraftResponse, { id: number } & DraftRequest>({
      query: ({ id, ...body }) => ({
        url: `sales/drafts/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Drafts'],
    }),

    deleteDraft: builder.mutation<DeleteDraftResponse, number>({
      query: (id) => ({
        url: `sales/drafts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Drafts'],
    }),
  }),
});

export const {
  useCreateDraftMutation,
  useGetDraftsQuery,
  useGetDraftQuery,
  useLazyGetDraftQuery,
  useUpdateDraftMutation,
  useDeleteDraftMutation,
} = draftsApi;
