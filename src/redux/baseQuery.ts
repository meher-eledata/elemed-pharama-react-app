import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout } from './slices/authSlice';
import { setCurrentLocation } from './slices/orgSlice';
import type { RootState } from './store';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState)?.auth?.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    // Multi-location scoping: every request carries the working location. The
    // backend requires it for pharmacy writes when the org has >1 active
    // location and defaults to the single active location otherwise.
    const locationId = (getState() as RootState)?.org?.currentLocationId;
    if (locationId != null) {
      headers.set('x-location-id', String(locationId));
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

  // Auth failure: the backend authMiddleWare now returns 401 for an
  // invalid/expired JWT, so 401 is the sole signal that the session is no
  // longer valid. A 403 from requireAdmin is an authorization failure (the
  // token is still valid, the user just lacks permission) and must NOT log the
  // user out.
  if (result.error?.status === 401) {
    // Clear auth state + persisted token, then hard-redirect to the login route
    // so the broken authenticated UI is fully torn down.
    api.dispatch(logout());
    redirect.toLogin();
  } else if (
    result.error?.status === 403 &&
    (result.error.data as { error?: string } | null | undefined)?.error === 'Invalid location'
  ) {
    // Stale persisted location: the backend rejects an unknown/inactive
    // x-location-id with 403 { error: 'Invalid location' }. Clear the
    // selection (the orgSlice reducer also removes the persisted
    // pharma_current_location) so the /me reseed + location picker dialog can
    // repair it. The token is still valid — do NOT log out.
    api.dispatch(setCurrentLocation(null));
  }

  return result;
};

