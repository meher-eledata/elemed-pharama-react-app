import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

// A single near-expiry alert (GET /api/alerts).
export interface AlertItem {
  id: string; // e.g. "near-expiry-123"
  type: 'NEAR_EXPIRY';
  product_id: number;
  name: string; // medicine name
  brand_name: string | null;
  medicine_type: string | null;
  batch_id: number;
  batchNumber: string;
  currentQuantity: number;
  expiryDate: string; // ISO date
  daysUntilExpiry: number; // >= 0
  window: '1month' | '3month'; // <=30 days => '1month', 31-90 => '3month'
}

export interface GetAlertsResponse {
  count: number;
  alerts: AlertItem[];
}

export const alertsApi = createApi({
  reducerPath: 'alertsApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getAlerts: builder.query<GetAlertsResponse, void>({
      query: () => 'alerts',
    }),
  }),
});

export const { useGetAlertsQuery } = alertsApi;
