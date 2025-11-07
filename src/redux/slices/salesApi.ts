import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQuery";

// Debounced validation endpoint - prevents excessive API calls
export const createDebouncedValidateSale = () => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastParams: ValidateSaleRequest | null = null;
  
  return (params: ValidateSaleRequest, apiCall: (params: ValidateSaleRequest) => Promise<ValidateSaleResponse>) => {
    return new Promise<ValidateSaleResponse>((resolve, reject) => {
      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Store the latest parameters
      lastParams = params;
      
      // Set new timeout
      timeoutId = setTimeout(async () => {
        try {
          // Only make the API call if these are still the latest parameters
          if (lastParams === params) {
            const result = await apiCall(params);
            resolve(result);
          }
        } catch (error) {
          reject(error);
        } finally {
          timeoutId = null;
        }
      }, 500); // 500ms debounce delay
    });
  };
};

// Types for Sales API
export interface ProductTypeResponse {
  type: string;
}

export interface GetProductTypeRequest {
  productID: number;
}

// The API can return multiple types for a single product
export type ProductTypesResponse = ProductTypeResponse[];

export interface Product {
  id: string;
  name: string;
  batch: string;
  avlQty: string;
  mrp: number;
  sp: number;
  expiry: string;
  quantity: number;
  type: string;
  discount: number;
}

export interface SalesReceiptItem {
  id: string;
  productName: string;
  manufacturer: string;
  batch: string;
  expiryDate: string;
  quantity: string;
  unitPrice: string;
  mrp: string;
  discount: string;
  discountPercent: string;
  cgst: string;
  cgstPercent: string;
  sgst: string;
  sgstPercent: string;
  igst: string;
  igstPercent: string;
  amount: string;
}

export interface CreateSalesRequest {
  customerName: string;
  customerMobile: string;
  customerCity: string;
  doctorName: string;
  doctorMobile: string;
  doctorEmail: string;
  paymentMode: string;
  insuranceCompany: string;
  invoiceNumber: string;
  invoiceDate: string;
  items: SalesReceiptItem[];
  totalValue: string;
  totalDiscount: string;
  taxAmount: string;
  totalPayableAmount: string;
}

export interface CreateSalesResponse {
  id: number;
  message: string;
  invoiceNumber: string;
}

// Customer interfaces
export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  city?: string;
  address?: string;
}

export interface SearchCustomerRequest {
  searchTerm: string; // Can be name or mobile number
}

export interface GetCustomerPhonesRequest {
  name: string;
}

export interface GetCustomerPhonesResponse {
  name: string;
  phones: string[];
}

// Doctor phone and email interfaces
export interface GetDoctorPhonesAndEmailsRequest {
  name: string;
}

export interface DoctorPhoneEmailInfo {
  phone: string;
  email: string;
}

export interface GetDoctorPhonesAndEmailsResponse {
  name: string;
  info: DoctorPhoneEmailInfo[];
}

// Doctor interfaces
export interface Doctor {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  hospitalId?: string;
  specialization?: string;
}

export interface GetDoctorsResponse {
  doctors: Doctor[];
}

// Validate Sale interfaces
export interface ValidateSaleRequest {
  product_name: string;
  product_id: string;
  quantity: number;
  type: string;
  disc: number;
}

export interface ValidateSaleResponse {
  product_name?: string;
  product_id?: string;
  mrp?: number;
  selling_price?: number;
  quantity?: number;
  type?: string;
  disc?: number;
  message?: string; // Error message when validation fails
}

export interface ValidateSaleError {
  error: string;
  message: string;
  availableQuantity?: number;
}

// Submit Sale interfaces
export interface SubmitSaleLine {
  product_id: number;
  quantity: number;
  mrp: number;
  sp: number;
  discount: number;
}

export interface SubmitSaleRequest {
  quantity: number;
  disc: number;
  payment_method: string;
  payment_amount: number;
  created_by: string;
  customer_id: number;
  lines: SubmitSaleLine[];
}

export interface SubmitSaleLineResponse {
  invoice_line_id: number;
  invoice_id: number;
  product_id: number;
  quantity: string;
  rate: string;
  mrp: string;
  discount: string;
  selling_price: string;
  created_at: string;
  updated_at: string;
}

export interface SubmitSaleResponse {
  message: string;
  invoice_id: number;
  lines: SubmitSaleLineResponse[];
}

export interface AddCustomerRequest {
  name: string;
  email: string | null;
  phone: string;
  billing_address: string;
  shipping_address: string | null;
  gstin: string | null;
  pancard_num: string | null;
  drug_license: string | null;
  gender: number | null;
}

export interface AddCustomerResponse {
  message: string;
  id: string;
  name: string;
}




export const salesApi = createApi({
  reducerPath: "salesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Sales", "ProductType"] as const,
  endpoints: (builder) => ({
    // Get product types by product ID (can return multiple types)
    getProductType: builder.query<ProductTypesResponse, GetProductTypeRequest>({
      query: (body) => ({
        url: "sales/get-product-type",
        method: "POST",
        body,
      }),
      providesTags: ["ProductType"],
    }),


    // Create a new sales transaction
    createSales: builder.mutation<CreateSalesResponse, CreateSalesRequest>({
      query: (body) => ({
        url: "sales/create-sales",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sales"],
    }),

    // Get sales history
    getSalesHistory: builder.query<any[], void>({
      query: () => "sales/history",
      providesTags: ["Sales"],
    }),

    // Get sales by ID
    getSalesById: builder.query<any, { id: number }>({
      query: ({ id }) => `sales/${id}`,
      providesTags: ["Sales"],
    }),

    // Update sales transaction
    updateSales: builder.mutation<any, { id: number; data: Partial<CreateSalesRequest> }>({
      query: ({ id, data }) => ({
        url: `sales/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Sales"],
    }),

    // Delete sales transaction
    deleteSales: builder.mutation<{ message: string }, { id: number }>({
      query: ({ id }) => ({
        url: `sales/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Sales"],
    }),

    // Search customers by name or mobile number
    searchCustomers: builder.mutation<Customer[], SearchCustomerRequest>({
      query: (body) => ({
        url: "sales/search-customers",
        method: "POST",
        body,
      }),
    }),

    // Get all doctors
    getDoctors: builder.query<Doctor[], void>({
      query: () => "sales/get-doctors",
    }),

    // Get doctor names (simple array of strings)
    getDoctorNames: builder.query<string[], void>({
      query: () => "sales/get-doctor-names",
      providesTags: ["Sales"],
    }),

    // Get doctor by ID
    getDoctorById: builder.query<Doctor, { id: number }>({
      query: ({ id }) => `sales/doctors/${id}`,
    }),

    // Validate sale - check if quantity is available and get pricing
    validateSale: builder.mutation<ValidateSaleResponse, ValidateSaleRequest>({
      query: (body) => ({
        url: "sales/validate-sale",
        method: "POST",
        body,
      }),
    }),

    // Get all products for sales - alternative endpoint
    getSalesProducts: builder.query<{name: string, id: number}[], void>({
      query: () => "sales/get-products",
      transformResponse: (response: any[]) => {
        // Handle different response formats
        if (Array.isArray(response) && response.length > 0) {
          if (Array.isArray(response[0])) {
            // Format: [[name, id], [name, id], ...]
            return response.map(item => ({ name: item[0], id: item[1] }));
          } else if (typeof response[0] === 'object') {
            // Format: [{name, id}, {name, id}, ...]
            return response;
          }
        }
        return [];
      },
    }),

    // Submit sale - final submission endpoint
    submitSale: builder.mutation<SubmitSaleResponse, SubmitSaleRequest>({
      query: (body) => ({
        url: "sales/submit-sale",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sales"],
    }),

    // Add new customer
    addCustomer: builder.mutation<AddCustomerResponse, AddCustomerRequest>({
      query: (body) => ({
        url: "sales/add-customer",
        method: "POST",
        body,
      }),
      // Invalidate customer cache so dropdown refreshes
      invalidatesTags: ["Sales"],
    }),

    // Get all customer names
    getAllCustomerNames: builder.query<string[], void>({
      query: () => "sales/get-all-customer-names",
      providesTags: ["Sales"],
    }),

    // Get customer phones by name
    getCustomerPhones: builder.mutation<GetCustomerPhonesResponse, GetCustomerPhonesRequest>({
      query: (body) => ({
        url: "sales/get-customer-phones/",
        method: "POST",
        body,
      }),
    }),

    // Get doctor phones and emails by name
    getDoctorPhonesAndEmails: builder.mutation<GetDoctorPhonesAndEmailsResponse, GetDoctorPhonesAndEmailsRequest>({
      query: (body) => ({
        url: "sales/get-doctor-phones-and-emails/",
        method: "POST",
        body,
      }),
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetProductTypeQuery,
  useLazyGetProductTypeQuery,
  useCreateSalesMutation,
  useGetSalesHistoryQuery,
  useGetSalesByIdQuery,
  useUpdateSalesMutation,
  useDeleteSalesMutation,
  useSearchCustomersMutation,
  useGetDoctorsQuery,
  useLazyGetDoctorsQuery,
  useGetDoctorNamesQuery,
  useLazyGetDoctorNamesQuery,
  useGetDoctorByIdQuery,
  useLazyGetDoctorByIdQuery,
  useValidateSaleMutation,
  useGetSalesProductsQuery,
  useSubmitSaleMutation,
  useAddCustomerMutation,
  useGetAllCustomerNamesQuery,
  useLazyGetAllCustomerNamesQuery,
  useGetCustomerPhonesMutation,
  useGetDoctorPhonesAndEmailsMutation,
} = salesApi;
