import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQuery";

// Shared shape returned by the upload response AND each list row.
// `file_type` is the SERVER-canonicalized MIME derived from the file extension
// (not the client-supplied Content-Type). See api-contract.md
// "Admin historical-files endpoints (recorded as-built 2026-06-17)".
export interface HistoricalFile {
  id: number;
  file_name: string;
  file_type: string;
  size_bytes: number;
  uploaded_at: string; // ISO
  uploaded_by: number | null;
}

// GET /:id/download-link response. `url` non-null = presigned S3 GET URL (dev);
// `url` null = local-disk driver (prod) → fall back to an authenticated blob
// fetch of GET /:id/file.
export interface HistoricalFileDownloadLink {
  id: number;
  url: string | null;
  file_name: string;
  file_type: string;
  expires_in: number | null;
}

const BASE = "admin/historical-files";

export const historicalFilesApi = createApi({
  reducerPath: "historicalFilesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["HistoricalFiles"] as const,
  endpoints: (builder) => ({
    // POST /api/admin/historical-files/upload — multipart/form-data, field `file`.
    // RTK Query auto-sets the multipart Content-Type with boundary for FormData.
    uploadHistoricalFile: builder.mutation<HistoricalFile, { file: File }>({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `${BASE}/upload`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["HistoricalFiles"],
    }),

    // GET /api/admin/historical-files — list, newest-first (ordered server-side).
    getHistoricalFiles: builder.query<HistoricalFile[], void>({
      query: () => BASE,
      providesTags: ["HistoricalFiles"],
    }),

    // GET /api/admin/historical-files/:id/download-link — presigned URL resolver.
    getHistoricalFileDownloadLink: builder.query<HistoricalFileDownloadLink, number>({
      query: (id) => `${BASE}/${id}/download-link`,
    }),

    // GET /api/admin/historical-files/:id/file — raw bytes (BINARY, not JSON).
    // Fetched through baseQueryWithReauth so the Bearer header is attached
    // (NEVER a plain <a href> — see the 2026-06-17 "Token missing" download bug).
    getHistoricalFileBlob: builder.query<Blob, number>({
      query: (id) => ({
        url: `${BASE}/${id}/file`,
        responseHandler: async (response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch file");
          }
          return await response.blob();
        },
      }),
    }),
  }),
});

export const {
  useUploadHistoricalFileMutation,
  useGetHistoricalFilesQuery,
  useLazyGetHistoricalFileDownloadLinkQuery,
  useLazyGetHistoricalFileBlobQuery,
} = historicalFilesApi;

// Direct URL builder for the authenticated blob-fetch fallback (mirrors
// receiveApi.getReceiptFileUrl). NOT for use in <a href>/<img src> — only as the
// target of a fetch() carrying the Bearer header.
export const getHistoricalFileUrl = (id: number): string => {
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/";
  return `${baseUrl}${BASE}/${id}/file`;
};
