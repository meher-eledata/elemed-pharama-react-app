import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

// Request interface
export interface LogDownloadRequest {
  category: 'report' | 'master' | 'inventory' | 'sales';
  name: string;
  format?: 'csv' | 'xlsx' | 'pdf';
  count?: number;
}

export const activityApi = createApi({
  reducerPath: 'activityApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    logDownload: builder.mutation<{ ok: boolean }, LogDownloadRequest>({
      query: (body) => ({
        url: 'activity/log-download',
        method: 'POST',
        body,
      }),
    }),
    // POST /api/logout — authenticated (Bearer token injected by baseQueryWithReauth),
    // no body. Called while the token is still valid so the server logs the Logout event.
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: 'logout',
        method: 'POST',
      }),
    }),
  }),
});

export const { useLogDownloadMutation, useLogoutMutation } = activityApi;
