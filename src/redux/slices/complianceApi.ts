import { createApi } from '@reduxjs/toolkit/query/react';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { baseQueryWithReauth } from '../baseQuery';
import { notificationsApi } from './notificationsApi';

// Compliance module (licences, renewals, version history, expiry calendar).
// Shapes match .claude/memory/api-contract.md → "Compliance module endpoints".
// Every route sits behind the JWT boundary AND `requireModule('compliance')`, so an
// org without the module gets 403 { message: 'Module not enabled...' } — the pages
// are gated by <ModuleGuard module="compliance" /> so that should never be hit.
// Controller errors use the key `error`, middleware errors use `message`;
// `extractErrorMessage` already reads both.

export type ComplianceStatus = 'ACTIVE' | 'ARCHIVED';
// List endpoints default to ACTIVE only — pass 'all' explicitly to include archived.
export type ComplianceStatusFilter = ComplianceStatus | 'all';

export interface ComplianceDocumentType {
  id: number;
  key: string; // immutable after create; /^[a-z0-9_]{2,64}$/
  name: string;
  description: string | null;
  category: string | null;
  is_required: boolean;
  default_validity_months: number | null; // 1..600, null = no fixed renewal cycle
  status: ComplianceStatus;
  created_at: string;
  updated_at: string;
}

// The subset embedded on a Document (no description, no timestamps).
export type ComplianceDocumentTypeRef = Pick<
  ComplianceDocumentType,
  'id' | 'key' | 'name' | 'category' | 'is_required' | 'default_validity_months' | 'status'
>;

export interface ComplianceVersion {
  id: number;
  document_id: number;
  version_no: number; // server-assigned (max+1) — never sent by the client
  file_name: string;
  file_type: string; // 'application/pdf' | 'image/jpeg' | 'image/png'
  size_bytes: number;
  valid_from: string | null; // 'YYYY-MM-DD'
  valid_to: string | null; // 'YYYY-MM-DD'; NULL = DOES NOT EXPIRE
  issued_by: string | null;
  notes: string | null;
  uploaded_by: number | null; // users.id — the API never expands a name
  uploaded_at: string; // ISO
  // Computed server-side against the parent's current_version_id. NEVER re-derive
  // "current" from max(version_no) / max(valid_to) on the client.
  is_current: boolean;
}

export interface ComplianceDocument {
  id: number;
  title: string;
  reference_number: string | null;
  status: ComplianceStatus;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  document_type: ComplianceDocumentTypeRef;
  current_version_id: number | null;
  current_version: ComplianceVersion | null; // null before any upload
  version_count: number;
}

// Paged-response metadata, shared by both paged endpoints (one server-side helper
// builds it, so the two can never drift). `has_more` is derived server-side —
// never re-derive it from the row count.
export interface CompliancePage {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// GET /compliance/documents — an ENVELOPE, not a bare array: a full page carries no
// signal on its own, so `total`/`has_more` come with it. `total` is the unpaged
// count for the SAME status/type_id filters as the page.
export interface ComplianceDocumentsResponse extends CompliancePage {
  documents: ComplianceDocument[];
}

// GET /compliance/documents/:id — the list shape plus a PAGE of the history
// (version_no DESC) and that page's metadata. `versions_page.total` equals
// `version_count`, the true unpaged history length.
export interface ComplianceDocumentDetail extends ComplianceDocument {
  versions: ComplianceVersion[];
  versions_page: CompliancePage;
}

export interface CreateComplianceDocumentTypeRequest {
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  is_required?: boolean;
  default_validity_months?: number | null;
}

// `key` is immutable and is ignored by the server if sent. At least one field required.
export interface UpdateComplianceDocumentTypeRequest {
  id: number;
  name?: string;
  description?: string | null;
  category?: string | null;
  is_required?: boolean;
  default_validity_months?: number | null;
  status?: ComplianceStatus; // also how an ARCHIVED type is restored
}

// Paging (both paged endpoints share one parser server-side): `limit` defaults to
// 50 and is CLAMPED to 200 rather than rejected; `offset` defaults to 0.
// A non-integer/`< 1` limit or a negative offset is a 400.
export const COMPLIANCE_PAGE_SIZE = 50;
export const COMPLIANCE_PAGE_SIZE_MAX = 200;

export interface CompliancePagingArgs {
  limit?: number;
  offset?: number;
}

export interface GetComplianceDocumentsArgs extends CompliancePagingArgs {
  status?: ComplianceStatusFilter;
  type_id?: number;
}

export interface GetComplianceDocumentArgs extends CompliancePagingArgs {
  id: number;
}

export interface CreateComplianceDocumentRequest {
  document_type_id: number;
  title: string;
  reference_number?: string | null;
  notes?: string | null;
}

// `document_type_id` is NOT updatable; dates live on the version, not here.
export interface UpdateComplianceDocumentRequest {
  id: number;
  title?: string;
  reference_number?: string | null;
  notes?: string | null;
  status?: ComplianceStatus;
}

// Multipart upload. `valid_from` is REQUIRED, `valid_to` is OPTIONAL —
// omitting it means "does not expire". Cross-field rule: valid_to >= valid_from.
export interface UploadComplianceVersionRequest {
  documentId: number;
  file: File;
  valid_from: string; // 'YYYY-MM-DD' exactly — a full ISO timestamp is rejected
  valid_to?: string | null;
  issued_by?: string | null;
  notes?: string | null;
}

// Metadata-only edit of ANY version (current or historical); the file is immutable.
// Editing a non-current version does NOT move the current pointer.
export interface UpdateComplianceVersionRequest {
  documentId: number;
  versionId: number;
  // NOT nullable: the server rejects `valid_from: null` with
  // 400 { error: 'valid_from cannot be cleared' }. `valid_to` IS clearable.
  valid_from?: string;
  valid_to?: string | null;
  issued_by?: string | null;
  notes?: string | null;
}

// `url` is NULL on the disk storage driver (local dev, no S3_BUCKET) — callers MUST
// fall back to the authenticated blob fetch of `.../file`.
export interface ComplianceDownloadLink {
  id: number;
  url: string | null;
  file_name: string;
  file_type: string;
  expires_in: number | null;
}

// ---------------------------------------------------------------------------
// CALENDAR TYPES — FINAL shape (backend commit c05824ee). ONE CalendarItem across
// all three lists: the same key set everywhere, with `null` (never an absent key)
// where a value cannot apply, so no consumer has to branch on key presence.
// ---------------------------------------------------------------------------
export type ComplianceCalendarState =
  | 'EXPIRED'
  | 'EXPIRING'
  | 'VALID'
  | 'NO_VERSION'
  | 'MISSING'
  | 'NO_EXPIRY';

export interface ComplianceCalendarItem {
  // null on a type-only MISSING row (nothing filed for a required type at all).
  document_id: number | null;
  title: string | null;
  reference_number: string | null;
  document_type_id: number;
  type_key: string;
  type_name: string;
  category: string | null;
  is_required: boolean;
  version_id: number | null;
  version_no: number | null;
  valid_from: string | null; // 'YYYY-MM-DD'
  valid_to: string | null; // 'YYYY-MM-DD'; null on MISSING / NO_VERSION / NO_EXPIRY
  issued_by: string | null;
  daysUntilExpiry: number | null; // 0 = expires TODAY; null on EXPIRED and undated rows
  daysPastExpiry: number | null; // EXPIRED only
  lead_days: number[]; // effective lead days, largest-first
  innermost_lead_day: number; // = lead_days[lead_days.length - 1]
  state: ComplianceCalendarState;
}

export interface ComplianceCalendarResponse {
  // The RESOLVED window (defaults to today .. today + 90 days server-side).
  from: string;
  to: string;
  // Rows whose valid_to falls inside [from, to] PLUS every still-unresolved EXPIRED
  // row regardless of `from`, so a lapsed licence is never hidden by a forward
  // window. Already sorted expired-first / most overdue first / then by valid_to —
  // render in the order received.
  items: ComplianceCalendarItem[];
  // Required types with nothing filed. Deep-equals the notification bell's missing
  // set — never filter it client-side or the two surfaces would disagree.
  missing: ComplianceCalendarItem[];
  // Filed documents with no expiry date. Part of the compliance picture, but NOT
  // calendar events — never given a synthesised date.
  no_expiry: ComplianceCalendarItem[];
}

export interface ComplianceCalendarArgs {
  from?: string;
  to?: string;
}
// --------------------------- end calendar block ----------------------------

export interface ComplianceLeadDayOverride {
  document_type_id: number;
  type_key: string | null;
  type_name: string | null;
  lead_days: number[];
}

// Lead days are ORG-LEVEL (not per-user) and always stored largest-first.
export interface ComplianceNotificationSettings {
  lead_days: number[];
  is_default: boolean; // true = no saved preference; showing the shipped [60, 30, 7]
  overrides: ComplianceLeadDayOverride[];
}

// Partial update: omitting a key leaves it untouched, and an `overrides` entry with
// `lead_days: null` REMOVES that override. Top-level `lead_days` may not be null.
export interface UpdateComplianceNotificationSettingsRequest {
  lead_days?: number[];
  overrides?: Array<{ document_type_id: number; lead_days: number[] | null }>;
}

// RTK Query tag invalidation is PER-SLICE, so a compliance write does NOT touch the
// bell's cache (gotchas.md: "cross-slice invalidation is manual"). Every compliance
// mutation can change what the bell says — filing a document RESOLVES its
// COMPLIANCE_MISSING row, a new expiry window changes EXPIRING/EXPIRED, re-pointing
// the current version moves the dates the alerts are computed from, archiving stops
// alerts, and new lead days re-evaluate all of them. Without this the bell keeps
// reading "Document missing" straight after the user filed it, which reads as "the
// upload failed" — so it is attached to EVERY mutation in this slice, not a
// hand-picked subset that the next endpoint would silently fall out of.
type BellRefreshApi = {
  dispatch: ThunkDispatch<unknown, unknown, UnknownAction>;
  queryFulfilled: PromiseLike<unknown>;
};

const refreshNotificationBell = async (
  _arg: unknown,
  { dispatch, queryFulfilled }: BellRefreshApi,
): Promise<void> => {
  try {
    await queryFulfilled;
  } catch {
    // A failed write changed nothing — leave the bell's cache alone.
    return;
  }
  dispatch(notificationsApi.util.invalidateTags(['Notification']));
};

export const complianceApi = createApi({
  reducerPath: 'complianceApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['ComplianceType', 'ComplianceDocument', 'ComplianceCalendar', 'ComplianceSettings'] as const,
  endpoints: (builder) => ({
    getComplianceDocumentTypes: builder.query<
      ComplianceDocumentType[],
      { status?: ComplianceStatusFilter } | void
    >({
      query: (args) => ({
        url: 'compliance/document-types',
        params: args?.status ? { status: args.status } : undefined,
      }),
      providesTags: ['ComplianceType'],
    }),
    createComplianceDocumentType: builder.mutation<
      ComplianceDocumentType,
      CreateComplianceDocumentTypeRequest
    >({
      // 409 on a duplicate key — including against an ARCHIVED type, which must be
      // restored (PUT status: 'ACTIVE') rather than re-created. Surface, never retry.
      query: (body) => ({ url: 'compliance/document-types', method: 'POST', body }),
      onQueryStarted: refreshNotificationBell,
      invalidatesTags: ['ComplianceType', 'ComplianceCalendar'],
    }),
    updateComplianceDocumentType: builder.mutation<
      ComplianceDocumentType,
      UpdateComplianceDocumentTypeRequest
    >({
      query: ({ id, ...body }) => ({
        url: `compliance/document-types/${id}`,
        method: 'PUT',
        body,
      }),
      onQueryStarted: refreshNotificationBell,
      invalidatesTags: ['ComplianceType', 'ComplianceDocument', 'ComplianceCalendar'],
    }),
    // SOFT delete — the row survives as ARCHIVED and filed documents keep resolving.
    archiveComplianceDocumentType: builder.mutation<ComplianceDocumentType, number>({
      query: (id) => ({ url: `compliance/document-types/${id}`, method: 'DELETE' }),
      onQueryStarted: refreshNotificationBell,
      invalidatesTags: ['ComplianceType', 'ComplianceDocument', 'ComplianceCalendar'],
    }),

    // PAGED (server default 50, hard cap 200). `limit`/`offset` are always sent
    // explicitly so the page never silently inherits a server default it does not
    // know about — a truncated compliance list must be visibly truncated.
    getComplianceDocuments: builder.query<
      ComplianceDocumentsResponse,
      GetComplianceDocumentsArgs | void
    >({
      query: (args) => ({
        url: 'compliance/documents',
        params: {
          ...(args?.status ? { status: args.status } : {}),
          ...(args?.type_id ? { type_id: args.type_id } : {}),
          limit: args?.limit ?? COMPLIANCE_PAGE_SIZE,
          offset: args?.offset ?? 0,
        },
      }),
      providesTags: (result) => [
        { type: 'ComplianceDocument' as const, id: 'LIST' },
        ...(result?.documents ?? []).map((d) => ({ type: 'ComplianceDocument' as const, id: d.id })),
      ],
    }),
    createComplianceDocument: builder.mutation<
      ComplianceDocument,
      CreateComplianceDocumentRequest
    >({
      query: (body) => ({ url: 'compliance/documents', method: 'POST', body }),
      onQueryStarted: refreshNotificationBell,
      invalidatesTags: [{ type: 'ComplianceDocument', id: 'LIST' }, 'ComplianceCalendar'],
    }),
    // The `versions` array is paged by the SAME limit/offset params (newest first).
    getComplianceDocument: builder.query<ComplianceDocumentDetail, GetComplianceDocumentArgs>({
      query: ({ id, limit, offset }) => ({
        url: `compliance/documents/${id}`,
        params: { limit: limit ?? COMPLIANCE_PAGE_SIZE, offset: offset ?? 0 },
      }),
      providesTags: (_r, _e, { id }) => [{ type: 'ComplianceDocument', id }],
    }),
    updateComplianceDocument: builder.mutation<
      ComplianceDocument,
      UpdateComplianceDocumentRequest
    >({
      query: ({ id, ...body }) => ({
        url: `compliance/documents/${id}`,
        method: 'PUT',
        body,
      }),
      onQueryStarted: refreshNotificationBell,
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'ComplianceDocument', id },
        { type: 'ComplianceDocument', id: 'LIST' },
        'ComplianceCalendar',
      ],
    }),

    // MULTIPART. Send a raw FormData and never set Content-Type — the browser must
    // generate the boundary (same as profileApi's document upload). The uploaded
    // version becomes current in the same transaction; the 201 body is the VERSION
    // only, so the document tags are invalidated to refresh current_version.
    uploadComplianceVersion: builder.mutation<
      ComplianceVersion,
      UploadComplianceVersionRequest
    >({
      query: ({ documentId, file, valid_from, valid_to, issued_by, notes }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('valid_from', valid_from);
        // Omitted / '' means "does not expire" — never default it to a date.
        if (valid_to) formData.append('valid_to', valid_to);
        if (issued_by) formData.append('issued_by', issued_by);
        if (notes) formData.append('notes', notes);
        return {
          url: `compliance/documents/${documentId}/versions`,
          method: 'POST',
          body: formData,
        };
      },
      onQueryStarted: refreshNotificationBell,
      invalidatesTags: (_r, _e, { documentId }) => [
        { type: 'ComplianceDocument', id: documentId },
        { type: 'ComplianceDocument', id: 'LIST' },
        'ComplianceCalendar',
      ],
    }),
    updateComplianceVersion: builder.mutation<
      ComplianceVersion,
      UpdateComplianceVersionRequest
    >({
      query: ({ documentId, versionId, ...body }) => ({
        url: `compliance/documents/${documentId}/versions/${versionId}`,
        method: 'PUT',
        body,
      }),
      onQueryStarted: refreshNotificationBell,
      invalidatesTags: (_r, _e, { documentId }) => [
        { type: 'ComplianceDocument', id: documentId },
        { type: 'ComplianceDocument', id: 'LIST' },
        'ComplianceCalendar',
      ],
    }),
    // MEMBER-level (deliberately NOT owner/admin, and must not be tightened back):
    // deciding which version is in force is the same class of act as uploading it.
    // Corrective re-pointing of current_version_id.
    makeComplianceVersionCurrent: builder.mutation<
      ComplianceDocument,
      { documentId: number; versionId: number }
    >({
      query: ({ documentId, versionId }) => ({
        url: `compliance/documents/${documentId}/versions/${versionId}/make-current`,
        method: 'POST',
      }),
      onQueryStarted: refreshNotificationBell,
      invalidatesTags: (_r, _e, { documentId }) => [
        { type: 'ComplianceDocument', id: documentId },
        { type: 'ComplianceDocument', id: 'LIST' },
        'ComplianceCalendar',
      ],
    }),
    // Writes a 'Download Version' activity row — never call it speculatively.
    getComplianceVersionDownloadLink: builder.query<
      ComplianceDownloadLink,
      { documentId: number; versionId: number }
    >({
      query: ({ documentId, versionId }) =>
        `compliance/documents/${documentId}/versions/${versionId}/download-link`,
    }),
    // Raw bytes (BINARY, not JSON) fetched with the Bearer header — the mandatory
    // fallback when download-link returns url: null (disk driver).
    getComplianceVersionBlob: builder.query<Blob, { documentId: number; versionId: number }>({
      query: ({ documentId, versionId }) => ({
        url: `compliance/documents/${documentId}/versions/${versionId}/file`,
        responseHandler: async (response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch file');
          }
          return await response.blob();
        },
      }),
    }),

    getComplianceCalendar: builder.query<
      ComplianceCalendarResponse,
      ComplianceCalendarArgs | void
    >({
      query: (args) => ({
        url: 'compliance/calendar',
        params: {
          ...(args?.from ? { from: args.from } : {}),
          ...(args?.to ? { to: args.to } : {}),
        },
      }),
      providesTags: ['ComplianceCalendar'],
    }),

    getComplianceNotificationSettings: builder.query<ComplianceNotificationSettings, void>({
      query: () => 'compliance/notification-settings',
      providesTags: ['ComplianceSettings'],
    }),
    // owner/admin only (the GET is open to any member — render read-only for staff).
    // Re-render from the response: the server de-duplicates and re-sorts DESC.
    updateComplianceNotificationSettings: builder.mutation<
      ComplianceNotificationSettings,
      UpdateComplianceNotificationSettingsRequest
    >({
      query: (body) => ({
        url: 'compliance/notification-settings',
        method: 'PUT',
        body,
      }),
      onQueryStarted: refreshNotificationBell,
      invalidatesTags: ['ComplianceSettings', 'ComplianceCalendar'],
    }),
  }),
});

export const {
  useGetComplianceDocumentTypesQuery,
  useCreateComplianceDocumentTypeMutation,
  useUpdateComplianceDocumentTypeMutation,
  useArchiveComplianceDocumentTypeMutation,
  useGetComplianceDocumentsQuery,
  useCreateComplianceDocumentMutation,
  useGetComplianceDocumentQuery,
  useUpdateComplianceDocumentMutation,
  useUploadComplianceVersionMutation,
  useUpdateComplianceVersionMutation,
  useMakeComplianceVersionCurrentMutation,
  useLazyGetComplianceVersionDownloadLinkQuery,
  useLazyGetComplianceVersionBlobQuery,
  useGetComplianceCalendarQuery,
  useGetComplianceNotificationSettingsQuery,
  useUpdateComplianceNotificationSettingsMutation,
} = complianceApi;
