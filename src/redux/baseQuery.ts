import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout } from './slices/authSlice';
import type { RootState } from './store';

// Base query with authentication headers
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState)?.auth?.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

/**
 * Enhanced base query with automatic logout on 401 Unauthorized
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  // Handle 401 Unauthorized - token expired or invalid
  if (result.error && result.error.status === 401) {
    console.warn('Token expired or invalid. Logging out...');
    
    // Logout user
    api.dispatch(logout());
    
    // Redirect to login page
    window.location.href = '/';
  }

  return result;
};

