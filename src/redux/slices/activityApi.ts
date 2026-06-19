import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';

// Request interface
export interface LogDownloadRequest {
  category: 'report' | 'master' | 'inventory';
  name: string;
  format?: 'csv' | 'xlsx';
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
  }),
});

export const { useLogDownloadMutation } = activityApi;
