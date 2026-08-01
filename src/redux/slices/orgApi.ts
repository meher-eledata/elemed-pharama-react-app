import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

// GET /api/me — the authenticated user's identity, org context and active modules.
export type OrgRole = 'superadmin' | 'admin' | 'member';

export interface MeUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: number | string;
  // Per-module RBAC (PHASE A): org-level role + per-module roles + manage-roles capability.
  org_role?: OrgRole;
  module_roles?: Record<string, string>;
  can_manage_roles?: boolean;
}

export interface MeOrganization {
  id: number;
  name: string;
  slug: string;
  // Base64 data URL of the org's logo, or null when unset.
  logo_url?: string | null;
}

export interface MeResponse {
  user: MeUser;
  // null for legacy/no-org users.
  organization: MeOrganization | null;
  // Subset of ["pharmacy","inpatient"]; legacy/no-org users get ["pharmacy"].
  // NEVER contains a coming-soon module (e.g. "outpatient").
  activeModules: string[];
  // Modules that exist but cannot be enabled yet (contains "outpatient").
  comingSoonModules: string[];
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
  // Base64 data URL of the org's logo, or null when unset.
  logo_url?: string | null;
}

// PUT /api/org — superadmin only. Updates editable org profile fields.
export interface UpdateOrgRequest {
  name?: string;
  country?: string;
  timezone?: string;
  currency?: string;
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
    getOrg: builder.query<OrgProfile, void>({
      query: () => ({
        url: 'org',
        method: 'GET',
      }),
      providesTags: ['Org'],
    }),
    updateOrg: builder.mutation<OrgProfile, UpdateOrgRequest>({
      query: (body) => ({
        url: 'org',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Org', 'Me'],
    }),
    // PUT /api/org/logo — superadmin only. `image` is a data URL.
    updateOrgLogo: builder.mutation<OrgProfile, { image: string }>({
      query: (body) => ({
        url: 'org/logo',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Org', 'Me'],
    }),
    // DELETE /api/org/logo — superadmin only. Clears the org logo.
    deleteOrgLogo: builder.mutation<OrgProfile, void>({
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
