import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';
import type { Location } from './orgApi';

// ---------------------------------------------------------------------------
// Admin location CRUD (admin JWT; routes under /api/admin/locations).
// There is no DELETE — deactivate = PUT with status 0. The backend rejects
// deactivating the last active location with a 400.
// ---------------------------------------------------------------------------

export interface LocationsResponse {
  locations: Location[];
}

export interface LocationResponse {
  location: Location;
}

// POST /admin/locations
export interface CreateLocationRequest {
  name: string;
  code?: string;
  type?: string;
  gstin?: string;
  drug_license_1?: string;
  drug_license_2?: string;
  address?: string;
  phone?: string;
}

// PUT /admin/locations/:id — create fields plus status (1 active / 0 inactive).
export interface UpdateLocationRequest extends CreateLocationRequest {
  id: number;
  status?: number;
}

export const locationsApi = createApi({
  reducerPath: 'locationsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Locations'] as const,
  endpoints: (builder) => ({
    getLocations: builder.query<LocationsResponse, void>({
      query: () => ({
        url: 'admin/locations',
        method: 'GET',
      }),
      providesTags: ['Locations'],
    }),
    createLocation: builder.mutation<LocationResponse, CreateLocationRequest>({
      query: (body) => ({
        url: 'admin/locations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Locations'],
    }),
    updateLocation: builder.mutation<LocationResponse, UpdateLocationRequest>({
      query: ({ id, ...body }) => ({
        url: `admin/locations/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Locations'],
    }),
  }),
});

export const {
  useGetLocationsQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
} = locationsApi;
