import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../baseQuery';
import { salesApi } from './salesApi';

// Request interfaces
export interface AddSupplierRequest {
  supplier_name: string;
  supplier_code: string;
  contact_name: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  country: string;
  phone_number: string;
  gst_number: string;
  cst_number: string;
  notes: string;
}

export interface AddDoctorRequest {
  doctor_name: string;
  contact_name: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  country: string;
  phone_number: string;
  gst_number: string;
  cst_number: string;
  notes: string;
  email?: string;
}

// Response interfaces
export interface Supplier {
  created_at: string;
  updated_at: string;
  id: number;
  supplier_name: string;
  supplier_code: string;
  contact_name: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  country: string;
  phone_number: string;
  gst_number: string;
  cst_number: string;
  notes: string;
  email_id: string | null;
}

export interface AddSupplierResponse {
  supplier: Supplier;
}

export interface Doctor {
  created_at: string;
  updated_at: string;
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  country: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  pancard_num: string | null;
  drug_license: string | null;
  gender: string | null;
}

export interface AddDoctorResponse {
  doctor: Doctor;
}

export interface MasterCountsResponse {
  suppliers: number;
  doctors: number;
  customers: number;
  products: number;
}

export const masterApi = createApi({
  reducerPath: 'masterApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Master'] as const,
  endpoints: (builder) => ({
    addSupplier: builder.mutation<AddSupplierResponse, AddSupplierRequest>({
      query: (body) => ({
        url: 'master/add-supplier',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Master'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(salesApi.util.invalidateTags(['Sales']));
        } catch (error) { }
      },
    }),
    addDoctor: builder.mutation<AddDoctorResponse, AddDoctorRequest>({
      query: (body) => ({
        url: 'master/add-doctor',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Master'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(salesApi.util.invalidateTags(['Sales']));
        } catch (error) { }
      },
    }),
    getMasterCounts: builder.query<MasterCountsResponse, void>({
      query: () => ({
        url: 'master/get-master-counts',
        method: 'GET',
      }),
      providesTags: ['Master'],
    }),
  }),
});

export const {
  useAddSupplierMutation,
  useAddDoctorMutation,
  useGetMasterCountsQuery,
} = masterApi;

