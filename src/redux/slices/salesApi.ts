import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../baseQuery";
import { dashboardApi } from "./dashboardApi";
import { inventoryApi } from "./inventoryApi";
import { reportsApi } from "./reportsApi";
import { receiveApi } from "./receiveApi";

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
  patient_type?: number;
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

// GET /api/sales/get-customer-options — Sales-page customer autocomplete.
// `id` is a STRING (pg BIGINT serialization); `phone` is RAW/unmasked and may be null.
export interface CustomerOption {
  id: string;
  name: string;
  phone: string | null;
}

export interface GetCustomerOptionsResponse {
  customers: CustomerOption[];
}

export interface GetCustomerPhonesRequest {
  name: string;
}

export interface GetCustomerPhonesResponse {
  name: string;
  phones: string[];
  id?: number;
  ids?: number[];
}

// Doctor phone and email interfaces
export interface GetDoctorPhonesAndEmailsRequest {
  name: string;
}

export interface DoctorPhoneEmailInfo {
  phone: string;
  email: string;
}

export interface BatchInfo {
  batch_number: string;
  quantity: number;
  expiry_date?: string;
  mrp?: number;
  pack_qty?: number;
}

export interface GetBatchNumbersResponse {
  product?: {
    product_id: number;
    product_name: string;
    total_quantity: number;
  };
  batches: BatchInfo[];
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

// One line item the backend could not fully fulfil (POST /api/sales/submit-sale, HTTP 409).
export interface InsufficientStockItem {
  product_id: number;
  product_name: string | null;
  batch_number: string;
  requested: number;
  available: number;
}

// Error body for POST /api/sales/submit-sale when stock is short (HTTP 409).
// RTK Query surfaces HTTP errors as `error.data`, so this types `error.data`.
export interface SubmitSaleError {
  message?: string;
  insufficient_stock?: InsufficientStockItem[];
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
  cgst?: number; // Tax percentage (e.g., 1 for 1%)
  sgst?: number; // Tax percentage (e.g., 1 for 1%)
  igst?: number; // Tax percentage (e.g., 2 for 2%)
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
  customer_city?: string; // Send city if ID not available
  customer_phone?: string; // Snapshotted onto the invoice (with customer_id)
  customer_details?: string; // Free-text "Details" (≤150 chars trimmed; blank stored as NULL)
  doctor_id?: number; // ID of the doctor
  doctor_name?: string; // Name of the doctor
  doctor_mobile?: string; // Mobile of the doctor
  doctor_email?: string; // Email of the doctor
  // invoice_number REMOVED (2026-08-11, server-side numbering): the backend now assigns
  // the number at submit and IGNORES any client value; the assigned number is returned
  // in the 201 response (see SubmitSaleResponse). Do not send it.
  invoice_date?: string | null; // Invoice date (for return flow - invoice already stored in DB)
  patient_type?: number; // 1 for "In Patient", 0 for "Out Patient"
  lines: SubmitSaleLine[];
  // OPTIONAL (≤64 chars): a duplicate submit with the same key replays the stored
  // outcome of the first attempt (same status + body, e.g. 201) (see useIdempotencyKey).
  idempotency_key?: string;
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
  invoice_id: number; // Database id of the created invoice
  // Server-ASSIGNED at submit (2026-08-11): the authoritative invoice number as a plain
  // numeric string (e.g. "947"). The "INV" prefix is a display-layer concern only.
  invoice_number: string;
  patient_type: number;
  totals: {
    lines_total: number;
    header_discount: number;
    invoice_total: number;
  };
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
  // Optional billing-location fields (backend accepts these as optional strings).
  city?: string;
  state?: string;
  postal_code?: string;
}

export interface AddCustomerResponse {
  message: string;
  id: string;
  name: string;
}

export interface EditSaleLine extends SubmitSaleLine {
  invoice_line_id?: number;
}

export interface EditSaleRequest {
  invoice_id: number;
  invoice_number: string;
  quantity: number;
  disc: number;
  payment_method: string;
  payment_amount: number;
  created_by: string;
  customer_id: number;
  customer_name?: string;
  customer_mobile?: string;
  customer_city?: string;
  customer_phone?: string; // Snapshotted onto the invoice (with customer_id)
  customer_details?: string; // Free-text "Details"; re-saved on every edit (≤150 chars trimmed; blank → NULL)
  doctor_id?: number;
  doctor_name?: string;
  doctor_mobile?: string;
  doctor_email?: string;
  patient_type?: number;
  Deleted?: number[];
  Added?: SubmitSaleLine[];
  Edited?: EditSaleLine[];
  // OPTIONAL (≤64 chars): a duplicate submit with the same key replays the stored
  // outcome of the first attempt (same status + body, e.g. 201) (see useIdempotencyKey).
  idempotency_key?: string;
}

export interface EditSaleResponse {
  message: string;
  invoice_id: number;
  invoice_number: string;
  total_amount: number;
}

// GET sales/get-invoices row (raw SQL row — legacy loose shape; only explicitly
// contracted fields are typed). customer_details is always present on read
// (null when never set / blank).
export interface Invoice {
  customer_details: string | null;
  [key: string]: any;
}

// POST sales/get-invoice-details/ response (legacy loose shape). The invoice
// object carries the stored free-text detail as customer_details: string | null.
export interface InvoiceDetailsResponse {
  invoice: { customer_details: string | null; [key: string]: any };
  // Each line carries the product master's drug schedule, joined read-time
  // (NULL = not yet attributed, 'NONE' = explicitly none — both display blank).
  lines?: Array<{ schedule: "G" | "H" | "H1" | "X" | "C" | "C1" | "K" | "NONE" | null; [key: string]: any }>;
  [key: string]: any;
}


export const salesApi = createApi({
  reducerPath: "salesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Sales", "ProductType", "Inventory", "Dashboard"] as const,
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
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));
          dispatch(inventoryApi.util.invalidateTags(["Inventory"]));
          dispatch(reportsApi.util.invalidateTags(["Reports"]));
          dispatch(receiveApi.util.invalidateTags(["Inventory"]));
        } catch (error) { }
      },
    }),

    // Get sales history
    getSalesHistory: builder.query<any[], void>({
      query: () => "sales/history",
      providesTags: ["Sales"],
    }),

    // Get invoices
    getInvoices: builder.query<Invoice[], void>({
      query: () => "sales/get-invoices",
      providesTags: ["Sales"],
    }),

    // Get sales by ID
    getSalesById: builder.query<any, { id: number }>({
      query: ({ id }) => `sales/${id}`,
      providesTags: ["Sales"],
    }),

    // Update sales transaction (Legacy or boilerplace - recommend using editSale below)
    updateSales: builder.mutation<any, { id: number; data: Partial<CreateSalesRequest> }>({
      query: ({ id, data }) => ({
        url: `sales/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Sales"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));
          dispatch(inventoryApi.util.invalidateTags(["Inventory"]));
          dispatch(reportsApi.util.invalidateTags(["Reports"]));
          dispatch(receiveApi.util.invalidateTags(["Inventory"]));
        } catch (error) { }
      },
    }),

    editSale: builder.mutation<EditSaleResponse, EditSaleRequest>({
      query: (body) => ({
        url: "sales/edit-sale",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sales", "Inventory"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));
          dispatch(inventoryApi.util.invalidateTags(["Inventory"]));
          dispatch(reportsApi.util.invalidateTags(["Reports"]));
          dispatch(receiveApi.util.invalidateTags(["Inventory"]));
        } catch (error) { }
      },
    }),

    // Delete sales transaction
    deleteSales: builder.mutation<{ message: string }, { id: number }>({
      query: ({ id }) => ({
        url: `sales/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Sales"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));
          dispatch(inventoryApi.util.invalidateTags(["Inventory"]));
          dispatch(reportsApi.util.invalidateTags(["Reports"]));
          dispatch(receiveApi.util.invalidateTags(["Inventory"]));
        } catch (error) { }
      },
    }),



    // Get all doctors
    getDoctors: builder.query<Doctor[], void>({
      query: () => "sales/get-doctors",
      providesTags: ["Sales"],
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

    // Get doctor names - returns array of objects with {id, name}
    getDoctorNames: builder.query<Array<{ id: string; name: string }>, void>({
      query: () => "sales/get-doctor-names",
      providesTags: ["Sales"],
      transformResponse: (response: any): Array<{ id: string; name: string }> => {
        // Handle different response formats
        if (Array.isArray(response)) {
          // If it's an array of objects with {id, name}, return as is
          if (response.length > 0 && typeof response[0] === 'object' && response[0].name) {
            return response.map((doctor: any) => ({
              id: String(doctor.id), // Ensure id is a string
              name: doctor.name
            }));
          }
          // If it's an array of strings (legacy format), convert to objects
          if (response.length > 0 && typeof response[0] === 'string') {
            return response.map((name: string, index: number) => ({
              id: String(index + 1),
              name: name
            }));
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
    getSalesProducts: builder.query<{ name: string, id: number, currentQuantity?: number }[], void>({
      query: () => "sales/get-products",
      transformResponse: (response: any[]) => {
        // Handle different response formats
        if (Array.isArray(response) && response.length > 0) {
          return response.map((item: any) => {
            if (Array.isArray(item)) {
              return { name: item[0], id: item[1], currentQuantity: 0 };
            }
            return {
              name: item.name,
              id: item.product_id || item.id,
              currentQuantity: item.currentQuantity ? Number(item.currentQuantity) : 0
            };
          });
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
      invalidatesTags: ["Sales", "Inventory"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));
          dispatch(inventoryApi.util.invalidateTags(["Inventory"]));
          dispatch(reportsApi.util.invalidateTags(["Reports"]));
          dispatch(receiveApi.util.invalidateTags(["Inventory"]));
        } catch (error) { }
      },
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

    // Customer options (id + name + raw phone) for the Sales-page autocomplete —
    // supports search by name OR mobile number with auto-fill.
    getCustomerOptions: builder.query<CustomerOption[], void>({
      query: () => "sales/get-customer-options",
      providesTags: ["Sales"],
      transformResponse: (response: GetCustomerOptionsResponse): CustomerOption[] =>
        response?.customers ?? [],
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
    getBatchNumbersByProductId: builder.mutation<GetBatchNumbersResponse | BatchInfo[], { product_id: number }>({
      query: (body) => ({
        url: "sales/get-batch-numbers-by-product-id",
        method: "POST",
        body,
      }),
    }),

    // Get invoice details for editing invoices
    // Backend accepts either invoice_id (database id) or invoice_number (string like "INV-1234")
    getInvoiceDetails: builder.mutation<InvoiceDetailsResponse, { invoice_id?: number; invoice_number?: string }>({
      query: (body) => ({
        url: "sales/get-invoice-details/",
        method: "POST",
        body,
      }),
    }),

    // Submit sales return
    // invoice_number is required - backend accepts string or number
    // Backend will look up by invoice_number, and if not found, will fallback to id
    submitSalesReturn: builder.mutation<any, {
      invoice_number?: number | string; // Textual number (column lookup) - OPTIONAL NOW
      invoice_id?: number;            // Unique database ID (primary key)
      created_by: string;
      return_date?: string; // Return date in YYYY-MM-DD format
      reason: string;
      notes: string;
      payment_method?: string; // FIXED: was missing — backend was receiving nothing and defaulting to Cash
      lines: Array<{
        invoice_line_id: number;
        batch_number: string;
        quantity: number;
        restock_action: string;
      }>;
      // OPTIONAL (≤64 chars): a duplicate submit with the same key replays the stored
      // outcome of the first attempt (same status + body, e.g. 201) (see useIdempotencyKey).
      idempotency_key?: string;
    }>({
      query: (body) => ({
        url: "sales/submit-sales-return/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sales", "Inventory"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));
          dispatch(inventoryApi.util.invalidateTags(["Inventory"]));
          dispatch(reportsApi.util.invalidateTags(["Reports"]));
          dispatch(receiveApi.util.invalidateTags(["Inventory"]));
        } catch (error) { }
      },
    }),

    // Upsert invoice payments
    upsertInvoicePayments: builder.mutation<any, {
      invoice_id: number;
      created_by: string;
      payments: Array<{
        payment_method: string;
        payment_amount: number;
        payment_id?: number; // Optional, based on user example
      }>;
    }>({
      query: (body) => ({
        url: "sales/upsert-invoice-payments/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sales"],
    }),

    // Permanently delete an invoice with a reason. Backend restores stock
    // and recalculates totals; we invalidate Sales + Inventory so the table
    // and stock counts refresh automatically.
    deleteInvoice: builder.mutation<{ message: string } & Record<string, any>, {
      invoice_id: number;
      deleted_by: string;
      deletion_reason: string;
    }>({
      query: (body) => ({
        url: "sales/delete-invoice",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sales", "Inventory"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(dashboardApi.util.invalidateTags(["Dashboard"]));
          dispatch(inventoryApi.util.invalidateTags(["Inventory"]));
          dispatch(reportsApi.util.invalidateTags(["Reports"]));
          dispatch(receiveApi.util.invalidateTags(["Inventory"]));
        } catch (error) { }
      },
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
  useGetCustomerOptionsQuery,
  useGetCustomersQuery,
  useLazyGetCustomersQuery,
  useGetCustomerPhonesMutation,
  useGetDoctorPhonesAndEmailsMutation,
  useGetBatchNumbersByProductIdMutation,
  useGetInvoiceDetailsMutation,
  useSubmitSalesReturnMutation,
  useEditSaleMutation,
  useUpsertInvoicePaymentsMutation,
  useDeleteInvoiceMutation,

} = salesApi;
