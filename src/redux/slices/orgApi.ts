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
  org_role?: 'owner' | 'admin' | 'staff' | string;
}

export interface MeOrganization {
  id: number;
  name: string;
  slug: string;
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

export const orgApi = createApi({
  reducerPath: 'orgApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Me'] as const,
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
  }),
});

export const { useGetMeQuery, useToggleModuleMutation } = orgApi;
