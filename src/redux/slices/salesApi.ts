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
  batch_number?: string; // Add batch number for stock validation
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
  batch_number?: string;
  mrp: number;
  sp: number;
  discount: number;
  discount_authority?: string; // Doctor name who authorized the discount
}

export interface SubmitSaleRequest {
  quantity: number;
  disc: number;
  payment_method: string;
  payment_amount: number;
  created_by: string;
  customer_id?: number; // Optional - backend may accept name/mobile instead
  customer_name?: string; // Send name if ID not available
  customer_mobile?: string; // Send mobile if ID not available
  invoice_number?: string | null; // Invoice number entered by user
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
  discount_authority?: string;
  updated_at: string;
}

export interface SubmitSaleResponse {
  message: string;
  invoice_number: number | null;
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

    // Get invoices
    getInvoices: builder.query<any[], void>({
      query: () => "sales/get-invoices",
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
      transformResponse: (response: any): Doctor[] => {
        // Handle different response formats
        if (Array.isArray(response)) {
          return response;
        } else if (response && Array.isArray(response.doctors)) {
          return response.doctors;
        }
        return [];
      },
    }),

    // Get doctor names (simple array of strings)
    getDoctorNames: builder.query<string[], void>({
      query: () => "sales/get-doctor-names",
      providesTags: ["Sales"],
      transformResponse: (response: any): string[] => {
        // Handle different response formats
        if (Array.isArray(response)) {
          // If it's an array of strings, return as is
          if (response.length === 0 || typeof response[0] === 'string') {
            return response;
          }
          // If it's an array of objects with {id, name}, extract names
          if (typeof response[0] === 'object' && response[0].name) {
            return response.map((doctor: any) => doctor.name);
          }
        }
        return [];
      },
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

    submitSale: builder.mutation<SubmitSaleResponse, SubmitSaleRequest>({
      query: (body) => ({
        url: "sales/submit-sale",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sales"],
    }),

    addCustomer: builder.mutation<AddCustomerResponse, AddCustomerRequest>({
      query: (body) => ({
        url: "sales/add-customer",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sales"],
    }),

    getAllCustomerNames: builder.query<string[], void>({
      query: () => "sales/get-all-customer-names",
      providesTags: ["Sales"],
    }),

    getCustomers: builder.query<Customer[], void>({
      query: () => "sales/get-customers",
      providesTags: ["Sales"],
    }),

    getCustomerPhones: builder.mutation<GetCustomerPhonesResponse, GetCustomerPhonesRequest>({
      query: (body) => ({
        url: "sales/get-customer-phones/",
        method: "POST",
        body,
      }),
    }),

    getDoctorPhonesAndEmails: builder.mutation<GetDoctorPhonesAndEmailsResponse, GetDoctorPhonesAndEmailsRequest>({
      query: (body) => ({
        url: "sales/get-doctor-phones-and-emails/",
        method: "POST",
        body,
      }),
    }),

    // Get batch numbers by product ID
    getBatchNumbersByProductId: builder.mutation<string[], { product_id: number }>({
      query: (body) => ({
        url: "sales/get-batch-numbers-by-product-id",
        method: "POST",
        body,
      }),
    }),

    // Get invoice details for editing invoices
    // Backend accepts either invoice_id (database id) or invoice_number (string like "INV-1234")
    getInvoiceDetails: builder.mutation<any, { invoice_id?: number; invoice_number?: string }>({
      query: (body) => ({
        url: "sales/get-invoice-details/",
        method: "POST",
        body,
      }),
    }),

    // Submit sales return
    submitSalesReturn: builder.mutation<any, {
      invoice_number: number;
      created_by: string;
      reason: string;
      notes: string;
      lines: Array<{
        invoice_line_id: number;
        batch_number: string;
        quantity: number;
        restock_action: string;
      }>;
    }>({
      query: (body) => ({
        url: "sales/submit-sales-return/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sales"],
    }),
  }),
});

export const {
  useGetProductTypeQuery,
  useLazyGetProductTypeQuery,
  useCreateSalesMutation,
  useGetSalesHistoryQuery,
  useGetInvoicesQuery,
  useLazyGetInvoicesQuery,
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
  useGetCustomersQuery,
  useLazyGetCustomersQuery,
  useGetCustomerPhonesMutation,
  useGetDoctorPhonesAndEmailsMutation,
  useGetBatchNumbersByProductIdMutation,
  useGetInvoiceDetailsMutation,
  useSubmitSalesReturnMutation,
} = salesApi;
