import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

// Table-backed notification centre (GET/POST /api/notifications*). Supersedes the
// live-derived GET /api/alerts feed the bell used to read.
//
// `module` and `type` are open VARCHARs server-side (a new module/type ships as a
// registry entry with zero DDL), so both are typed as open strings — the known
// literals are only autocomplete hints and the UI must render an unknown value
// gracefully rather than assuming the union is exhaustive.
export type NotificationType =
  | 'NEAR_EXPIRY'
  | 'EXPIRED'
  | 'LOW_STOCK'
  | 'EXCESS_STOCK'
  | 'COMPLIANCE_EXPIRING'
  | 'COMPLIANCE_EXPIRED'
  | 'COMPLIANCE_MISSING';
export type NotificationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// JSONB column — this interface IS the contract (Postgres enforces nothing).
// Keys are per type: NEAR_EXPIRY has daysUntilExpiry + window, EXPIRED has
// daysPastExpiry instead, LOW_STOCK has min_qty, EXCESS_STOCK has max_qty — so
// every key is optional here and must be narrowed by `type` at the use site.
export interface NotificationPayload {
  product_id?: number;
  batch_id?: number;
  name?: string;
  brand_name?: string | null;
  medicine_type?: string | null;
  batchNumber?: string;
  currentQuantity?: number;
  expiryDate?: string; // ISO date
  daysUntilExpiry?: number; // NEAR_EXPIRY only; 0 = expires today (valid, most urgent)
  daysPastExpiry?: number; // EXPIRED only; >= 1
  window?: '1month' | '3month'; // NEAR_EXPIRY only
  min_qty?: number; // LOW_STOCK only
  max_qty?: number; // EXCESS_STOCK only
  // Compliance types (module 'compliance'). Dates here are plain 'YYYY-MM-DD'.
  // COMPLIANCE_MISSING has two shapes: `document_id`/`title` are null when no
  // document exists at all for a required type.
  document_id?: number | null;
  document_type_id?: number;
  type_key?: string;
  type_name?: string;
  category?: string | null;
  title?: string | null;
  reference_number?: string | null;
  version_id?: number | null;
  valid_from?: string | null;
  valid_to?: string;
  is_required?: boolean;
  lead_days?: number[]; // largest-first; the LAST entry is the innermost threshold
}

export interface NotificationItem {
  id: number;
  module: string; // 'pharmacy' | 'compliance' (registry-driven, open string)
  type: NotificationType | (string & {});
  severity: NotificationSeverity | (string & {}); // server-determined — never re-derive
  title: string; // server-rendered human string — display as-is
  body: string | null;
  payload: NotificationPayload;
  status: 'ACTIVE' | 'RESOLVED';
  first_seen_at: string;
  last_seen_at: string;
  // read_at / dismissed_at are the CALLING USER's receipt. They can legitimately
  // reset server-side (severity escalation / RESOLVED->ACTIVE resurrection), so
  // never cache read state locally — always trust the server.
  read_at: string | null;
  dismissed_at: string | null;
  resolved_at: string | null;
}

export interface GetNotificationsArgs {
  status?: 'active' | 'all';
  module?: string;
  type?: string;
  limit?: number; // integer 1..200 (default 50) — a non-integer is a 400
  includeDismissed?: boolean;
}

export interface GetNotificationsResponse {
  // Counts ACTIVE + unread + not-dismissed rows, IGNORING `status` /
  // `includeDismissed` (but respecting `module`/`type`) — it is the badge
  // number, never re-derive it from `notifications`.
  unreadCount: number;
  count: number; // notifications.length after `limit`, NOT a total
  notifications: NotificationItem[];
}

export interface NotificationSummary {
  unreadCount: number;
  // Zero-filled from a server registry that grows without DDL — open records.
  byType: Record<string, number>;
  byModule: Record<string, number>;
}

export interface MarkReadResponse {
  id: number;
  read_at: string;
}

export interface MarkAllReadArgs {
  module?: string;
  type?: string;
}

export interface MarkAllReadResponse {
  updated: number; // newly-stamped rows only — a second call returns 0
}

export interface DismissResponse {
  id: number;
  dismissed_at: string;
}

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Notification'] as const,
  endpoints: (builder) => ({
    // Both GETs regenerate the org's notifications as a side effect (skipped when
    // the last run is fresher than ~5 min), so they are not free: fetch on bell
    // open and on tag invalidation, never on a short polling interval.
    getNotifications: builder.query<GetNotificationsResponse, GetNotificationsArgs | void>({
      query: (args) => ({
        url: 'notifications',
        params: {
          status: args?.status,
          module: args?.module,
          type: args?.type,
          limit: args?.limit,
          includeDismissed: args?.includeDismissed ? 'true' : undefined,
        },
      }),
      providesTags: ['Notification'],
    }),

    getNotificationSummary: builder.query<NotificationSummary, void>({
      query: () => 'notifications/summary',
      providesTags: ['Notification'],
    }),

    markNotificationRead: builder.mutation<MarkReadResponse, number>({
      query: (id) => ({ url: `notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),

    markAllNotificationsRead: builder.mutation<MarkAllReadResponse, MarkAllReadArgs | void>({
      query: (args) => ({
        url: 'notifications/read-all',
        method: 'POST',
        body: { module: args?.module, type: args?.type },
      }),
      invalidatesTags: ['Notification'],
    }),

    dismissNotification: builder.mutation<DismissResponse, number>({
      query: (id) => ({ url: `notifications/${id}/dismiss`, method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationSummaryQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDismissNotificationMutation,
} = notificationsApi;
