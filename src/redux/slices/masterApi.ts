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
  notes?: string | null;
  // Supplier model column is `email_id` (matches UpdateSupplierRequest); the ADD path must
  // send the entered email under this key so it actually persists.
  email_id?: string | null;
}

export interface AddDoctorRequest {
  name: string;
  email?: string;
  phone?: string;
  branch?: string;
  address?: string;
  city?: string;
  state?: string;
  pin?: string;
  country?: string;
  gstin?: string;
  pancard_num?: string;
  drug_license?: string;
  gender?: number | null;
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
  branch?: string | null;
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
  // Backend model defines gender as INTEGER. CANONICAL: 1 = Male, 2 = Female, 3 = Other.
  // Reconciled drift: previously typed `string`. Send/render as an integer code.
  gender: number | null;
}

export interface AddDoctorResponse {
  doctor: Doctor;
}

// Customer master row (GET /api/master/get-customers).
export interface Customer {
  created_at: string;
  updated_at: string;
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  // gender is an INTEGER code in the backend model. CANONICAL: 1 = Male, 2 = Female, 3 = Other.
  gender: number | null;
  billing_address: string | null;
  shipping_address: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  gstin: string | null;
  pancard_num: string | null;
  drug_license: string | null;
}

// Product master row (GET /api/master/get-products).
export interface Product {
  created_at: string;
  updated_at: string;
  product_id: number;
  product_code: string | null;
  name: string;
  brand_name: string | null;
  brand_id: number | null;
  hsn_id: number | null;
  type: string | null;
  description: string | null;
  package_info: string | null;
  unit_of_measure: string | null;
  dosage: string | null;
  min_qty: number | null;
  max_qty: number | null;
  current_qty: number | null;
  mrp: number | string | null;
  selling_price: number | string | null;
  discount: number | string | null;
  expiry: string | null;
}

// ---- Update (edit) request interfaces: PK + whitelisted editable fields only ----

export interface UpdateCustomerRequest {
  id: number;
  phone?: string;
  billing_address?: string | null;
  shipping_address?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  gender?: number | null;
}

export interface UpdateSupplierRequest {
  id: number;
  contact_name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pin?: string | null;
  country?: string | null;
  phone_number?: string | null;
  email_id?: string | null;
  notes?: string | null;
}

export interface UpdateProductRequest {
  product_id: number;
  type?: string | null;
  description?: string | null;
  unit_of_measure?: string | null;
  min_qty?: number | null;
  max_qty?: number | null;
  hsn_id?: string | null;
}

export interface UpdateDoctorRequest {
  id: string;
  branch?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pin?: string | null;
  country?: string | null;
  gender?: number | null;
}

export interface UpdateMasterResponse {
  message: string;
  id?: number | string;
  product_id?: number | string;
}

export interface MasterCountsResponse {
  suppliers: number;
  doctors: number;
  customers: number;
  products: number;
}

// Dropdown options for the Add/Edit Product Type + Unit of Measure fields
// (GET /api/master/get-product-field-options). Both arrays are distinct, trimmed,
// non-empty values, de-duplicated and sorted ascending case-insensitively.
export interface ProductFieldOptionsResponse {
  types: string[];
  units: string[];
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
    getProductFieldOptions: builder.query<ProductFieldOptionsResponse, void>({
      query: () => ({
        url: 'master/get-product-field-options',
        method: 'GET',
      }),
      providesTags: ['Master'],
    }),

    // ---- VIEW (list) queries: each returns a raw JSON array of full rows ----
    getCustomers: builder.query<Customer[], void>({
      query: () => ({
        url: 'master/get-customers',
        method: 'GET',
      }),
      providesTags: ['Master'],
    }),
    getSuppliers: builder.query<Supplier[], void>({
      query: () => ({
        url: 'master/get-suppliers',
        method: 'GET',
      }),
      providesTags: ['Master'],
    }),
    getProducts: builder.query<Product[], void>({
      query: () => ({
        url: 'master/get-products',
        method: 'GET',
      }),
      providesTags: ['Master'],
    }),
    getDoctors: builder.query<Doctor[], void>({
      query: () => ({
        url: 'master/get-doctors',
        method: 'GET',
      }),
      providesTags: ['Master'],
    }),

    // ---- EDIT (update) mutations: body is PK + whitelisted editable fields only ----
    updateCustomer: builder.mutation<UpdateMasterResponse, UpdateCustomerRequest>({
      query: (body) => ({
        url: 'master/update-customer',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Master'],
    }),
    updateSupplier: builder.mutation<UpdateMasterResponse, UpdateSupplierRequest>({
      query: (body) => ({
        url: 'master/update-supplier',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Master'],
    }),
    updateProduct: builder.mutation<UpdateMasterResponse, UpdateProductRequest>({
      query: (body) => ({
        url: 'master/update-product',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Master'],
    }),
    updateDoctor: builder.mutation<UpdateMasterResponse, UpdateDoctorRequest>({
      query: (body) => ({
        url: 'master/update-doctor',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Master'],
    }),
  }),
});

export const {
  useAddSupplierMutation,
  useAddDoctorMutation,
  useGetMasterCountsQuery,
  useGetProductFieldOptionsQuery,
  useGetCustomersQuery,
  useGetSuppliersQuery,
  useGetProductsQuery,
  useGetDoctorsQuery,
  useUpdateCustomerMutation,
  useUpdateSupplierMutation,
  useUpdateProductMutation,
  useUpdateDoctorMutation,
} = masterApi;

