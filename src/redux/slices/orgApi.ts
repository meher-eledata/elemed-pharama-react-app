import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

// GET /api/me — the authenticated user's identity, org context and active modules.
export interface MeUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: number | string;
  // Explicit null for legacy users with no org membership.
  org_role?: 'owner' | 'admin' | 'staff' | string | null;
}

export interface MeOrganization {
  id: number;
  name: string;
  slug: string;
  // Base64 data URL of the org's logo, or null when unset.
  logo_url: string | null;
  // Branding fields used on printed invoices/receipts; null when unset.
  legal_name: string | null;
  address: string | null;
  dl_numbers: string | null;
  gstin: string | null;
  phone: string | null;
  // Per-org custom invoice-numbering scheme (see api-contract CUSTOM INVOICE NUMBERING).
  invoice_number_enabled: boolean;
  invoice_number_template: string | null;
  invoice_number_reset: 'none' | 'yearly';
  invoice_seq_start: number | null;
}

export interface MeResponse {
  user: MeUser;
  // null for legacy/no-org users.
  organization: MeOrganization | null;
  // Subset of ["pharmacy","inpatient"]; legacy/no-org users get ["pharmacy"].
  activeModules: string[];
}

// PUT /api/admin/modules — owner/admin only. Toggles a module for the org.
export interface ToggleModuleRequest {
  module_key: string;
  enabled: boolean;
}

export interface ToggleModuleResponse {
  activeModules: string[];
}

// GET /api/org — the viewer's organization profile.
export interface OrgProfile {
  id: number;
  name: string;
  slug: string;
  status: string;
  country: string | null;
  timezone: string | null;
  currency: string | null;
  created_at: string;
  logo_url: string | null;
  legal_name: string | null;
  address: string | null;
  dl_numbers: string | null;
  gstin: string | null;
  phone: string | null;
  // Per-org custom invoice-numbering scheme (see api-contract CUSTOM INVOICE NUMBERING).
  invoice_number_enabled: boolean;
  invoice_number_template: string | null;
  invoice_number_reset: 'none' | 'yearly';
  invoice_seq_start: number | null;
}

export interface GetOrgResponse {
  organization: OrgProfile;
}

// PUT /api/org — owner/admin only. Partial update; branding fields are nullable.
export interface UpdateOrgRequest {
  name?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  legal_name?: string | null;
  address?: string | null;
  dl_numbers?: string | null;
  gstin?: string | null;
  phone?: string | null;
  // Per-org custom invoice-numbering scheme; partial-update, owner/admin gated.
  invoice_number_enabled?: boolean;
  invoice_number_template?: string | null;
  invoice_number_reset?: 'none' | 'yearly';
  invoice_seq_start?: number | null;
}

export const orgApi = createApi({
  reducerPath: 'orgApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Me', 'Org'] as const,
  endpoints: (builder) => ({
    getMe: builder.query<MeResponse, void>({
      query: () => ({
        url: 'me',
        method: 'GET',
      }),
      providesTags: ['Me'],
    }),
    toggleModule: builder.mutation<ToggleModuleResponse, ToggleModuleRequest>({
      query: (body) => ({
        url: 'admin/modules',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Me'],
    }),
    getOrg: builder.query<GetOrgResponse, void>({
      query: () => ({
        url: 'org',
        method: 'GET',
      }),
      providesTags: ['Org'],
    }),
    updateOrg: builder.mutation<GetOrgResponse, UpdateOrgRequest>({
      query: (body) => ({
        url: 'org',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Org', 'Me'],
    }),
    // PUT /api/org/logo — owner/admin only. `image` is a base64 data URL.
    updateOrgLogo: builder.mutation<{ logo_url: string }, { image: string }>({
      query: (body) => ({
        url: 'org/logo',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Org', 'Me'],
    }),
    // DELETE /api/org/logo — owner/admin only. Clears the org logo.
    deleteOrgLogo: builder.mutation<{ logo_url: null }, void>({
      query: () => ({
        url: 'org/logo',
        method: 'DELETE',
      }),
      invalidatesTags: ['Org', 'Me'],
    }),
  }),
});

export const {
  useGetMeQuery,
  useToggleModuleMutation,
  useGetOrgQuery,
  useUpdateOrgMutation,
  useUpdateOrgLogoMutation,
  useDeleteOrgLogoMutation,
} = orgApi;
