import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout } from './slices/authSlice';
import type { RootState } from './store';

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

// Hard-redirect to the login route. Wrapped in an exported object so it can be
// spied on in tests (jsdom locks down window.location). The login route is the
// app's index route `/` (see src/pages/index.tsx → AuthLayout renders LogInLeft).
export const redirect = {
  toLogin: () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },
};

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  // Auth failure: 401, or 403 specifically caused by an invalid/expired JWT
  // (backend authMiddleWare returns 403 {"message":"Invalid token"}). A 403
  // from requireAdmin ({"message":"Forbidden"}) is NOT an auth failure and must
  // not log the user out — hence the message-specific gate.
  const err = result.error;
  const isAuthFailure =
    !!err &&
    (err.status === 401 ||
      (err.status === 403 &&
        typeof err.data === 'object' &&
        err.data !== null &&
        (err.data as { message?: unknown }).message === 'Invalid token'));

  if (isAuthFailure) {
    // Clear auth state + persisted token, then hard-redirect to the login route
    // so the broken authenticated UI is fully torn down.
    api.dispatch(logout());
    redirect.toLogin();
  }

  return result;
};

