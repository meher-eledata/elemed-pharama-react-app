import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

// GET /api/profile — view-only current-user profile (identified from the JWT).
// Shapes match .claude/memory/api-contract.md → "User Profile endpoints".
export interface Profile {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string; // mapped: "admin" | "pharmacist"
  status: string; // mapped: "invited" | "active" | "inactive"
  last_login: string | null; // ISO date
  created_at: string; // ISO date ("member since")
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  mobile: string | null;
  identity_document_type: string | null; // mapped label
  identity_document_number_masked: string | null; // last 4 only; raw never returned
}

// PUT /api/profile — current user edits THEIR OWN contact fields. Any subset of the
// whitelist; email/role/status/identity are silently ignored server-side.
export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  mobile?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

// GET /api/profile/activity — recent activity rows (newest first, limit 20).
export interface ProfileActivity {
  module: string;
  event_type: string;
  event_time: string; // ISO date
  event_details: string | null;
}

export const profileApi = createApi({
  reducerPath: 'profileApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Profile'] as const,
  endpoints: (builder) => ({
    getProfile: builder.query<Profile, void>({
      query: () => 'profile',
      providesTags: ['Profile'],
    }),
    getProfileActivity: builder.query<{ activity: ProfileActivity[] }, void>({
      query: () => 'profile/activity',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<Profile, UpdateProfileRequest>({
      query: (body) => ({
        url: 'profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useGetProfileActivityQuery,
  useUpdateProfileMutation,
} = profileApi;
