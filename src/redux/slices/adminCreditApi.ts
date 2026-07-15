import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

// ---------------------------------------------------------------------------
// Admin Supplier Credit API (behind admin JWT; all routes under /api/admin/credit).
// NOTE: Postgres serializes DECIMAL/BIGINT as JSON STRINGS. `id` is a string and
// `amount` is a string — Number()-parse amounts before formatting/arithmetic.
// ---------------------------------------------------------------------------

export type CreditDirection = 'IN' | 'OUT';

// ---- E1: POST /admin/credit/list-transactions ----
export interface ListCreditTransactionsRequest {
  persona_type?: string; // default 'SUPPLIER'
  supplier_id?: number;
  start_date?: string; // 'YYYY-MM-DD'
  end_date?: string; // 'YYYY-MM-DD'
  limit?: number; // default 100, cap 500
  offset?: number;
}

export interface CreditTransaction {
  id: string; // BIGINT serialized as string
  credit_type: string;
  direction: CreditDirection;
  amount: string; // DECIMAL serialized as string
  persona_type: string;
  persona_id: number;
  supplier_name: string | null;
  notes: string | null; // reason
  created_by: string; // who
  related_payment_id: number | null;
  related_po_id: number | null;
  created_at: string;
}

export interface ListCreditTransactionsResponse {
  rows: CreditTransaction[];
  total: number;
}

// ---- E2: POST /admin/credit/adjust-supplier-credit ----
export interface AdjustSupplierCreditRequest {
  supplier_id: number;
  direction: CreditDirection;
  amount: number; // > 0
  credit_type?: string; // default 'ADJUSTMENT'
  notes?: string; // reason
}

export interface AdjustSupplierCreditResponse {
  message: string;
  supplier: {
    id: number;
    supplier_name: string;
    supplier_code: string;
  };
  credit_balance: {
    previous_balance: number | string;
    delta: number | string;
    new_balance: number | string;
    last_txn_id: number | null;
  };
  credit_transaction: CreditTransaction;
}

// ---- E3: POST /admin/credit/get-supplier-credit-balance ----
export interface GetSupplierCreditBalanceRequest {
  supplier_id: number;
}

export interface GetSupplierCreditBalanceResponse {
  supplier_id: number;
  available_credit: number;
  last_txn_id: number | null;
}

export const adminCreditApi = createApi({
  reducerPath: 'adminCreditApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['CreditTxns', 'CreditBalance'] as const,
  endpoints: (builder) => ({
    listCreditTransactions: builder.query<
      ListCreditTransactionsResponse,
      ListCreditTransactionsRequest
    >({
      query: (body) => ({
        url: 'admin/credit/list-transactions',
        method: 'POST',
        body,
      }),
      providesTags: ['CreditTxns'],
    }),
    getSupplierCreditBalance: builder.query<
      GetSupplierCreditBalanceResponse,
      GetSupplierCreditBalanceRequest
    >({
      query: (body) => ({
        url: 'admin/credit/get-supplier-credit-balance',
        method: 'POST',
        body,
      }),
      providesTags: (_res, _err, arg) => [
        { type: 'CreditBalance', id: arg.supplier_id },
      ],
    }),
    adjustSupplierCredit: builder.mutation<
      AdjustSupplierCreditResponse,
      AdjustSupplierCreditRequest
    >({
      query: (body) => ({
        url: 'admin/credit/adjust-supplier-credit',
        method: 'POST',
        body,
      }),
      // A successful adjustment refreshes the transactions list AND the adjusted
      // supplier's balance so the table + balance re-fetch automatically.
      invalidatesTags: (_res, _err, arg) => [
        'CreditTxns',
        { type: 'CreditBalance', id: arg.supplier_id },
      ],
    }),
  }),
});

export const {
  useListCreditTransactionsQuery,
  useGetSupplierCreditBalanceQuery,
  useAdjustSupplierCreditMutation,
} = adminCreditApi;
