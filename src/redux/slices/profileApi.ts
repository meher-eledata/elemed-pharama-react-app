import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

// The two self-service verification documents (path param on the document routes).
export type ProfileDocumentType = 'id_document' | 'pharmacist_certificate';

// Presence info only — raw storage paths are never returned; `filename` is a
// display name (uuid prefix stripped) and null when `uploaded` is false.
export interface ProfileDocumentInfo {
  uploaded: boolean;
  filename: string | null;
}

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
  documents: {
    id_document: ProfileDocumentInfo;
    pharmacist_certificate: ProfileDocumentInfo;
  };
}

// PUT /api/profile — current user edits THEIR OWN fields. Any subset of the
// whitelist; email (security decision — admin-only change), username, role and
// status are locked and must never be sent.
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
  identity_document?: 0 | 1; // 0 = Aadhaar, 1 = Driver's License
  identity_document_number?: string; // only a NEWLY typed value — never the masked round-trip
}

// GET /api/profile/documents/:type/download-link — `url` non-null = presigned S3
// URL; `url` null = disk driver → fall back to an authenticated blob fetch of
// GET /api/profile/documents/:type.
export interface ProfileDocumentDownloadLink {
  url: string | null;
  file_name: string;
  file_type: string;
  expires_in: number | null;
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
    // POST /api/profile/documents — multipart upload of either/both docs.
    // RTK Query auto-sets the multipart Content-Type with boundary for FormData.
    // Response is the full updated profile; invalidating 'Profile' also refreshes
    // the activity list (upload writes a "Document Upload" activity row).
    uploadProfileDocuments: builder.mutation<
      Profile,
      Partial<Record<ProfileDocumentType, File>>
    >({
      query: (files) => {
        const formData = new FormData();
        if (files.id_document) formData.append('id_document', files.id_document);
        if (files.pharmacist_certificate) {
          formData.append('pharmacist_certificate', files.pharmacist_certificate);
        }
        return {
          url: 'profile/documents',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Profile'],
    }),
    // GET /api/profile/documents/:type/download-link — presigned URL resolver.
    getProfileDocumentDownloadLink: builder.query<
      ProfileDocumentDownloadLink,
      ProfileDocumentType
    >({
      query: (type) => `profile/documents/${type}/download-link`,
    }),
    // GET /api/profile/documents/:type — raw bytes (BINARY, not JSON). Fetched
    // through baseQueryWithReauth so the Bearer header is attached (NEVER a plain
    // <a href> — the route sits behind the auth boundary). This is the mandatory
    // fallback when download-link returns url: null (disk driver).
    getProfileDocumentBlob: builder.query<Blob, ProfileDocumentType>({
      query: (type) => ({
        url: `profile/documents/${type}`,
        responseHandler: async (response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch file');
          }
          return await response.blob();
        },
      }),
    }),
  }),
});

export const {
  useGetProfileQuery,
  useGetProfileActivityQuery,
  useUpdateProfileMutation,
  useUploadProfileDocumentsMutation,
  useLazyGetProfileDocumentDownloadLinkQuery,
  useLazyGetProfileDocumentBlobQuery,
} = profileApi;
