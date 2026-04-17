// Sales Receipt Types and Interfaces

export interface SalesReceiptItem {
  id: string;
  productName: string;
  product_id?: number; // Product ID from cart item - important for batch validation
  manufacturer?: string;
  batch: string;
  expiryDate?: string;
  quantity: string;
  type: string;
  unitPrice: string;
  mrp?: string;
  hsn?: string;
  pack?: string;
  pack_qty?: number;
  discount: string;
  discountPercent: string;
  discountAuthorizedBy?: string; // Doctor name who authorized the discount
  discountAuthorizedById?: number; // Doctor ID who authorized the discount (for API/database)
  cgst: string;
  cgstPercent: string;
  sgst: string;
  sgstPercent: string;
  igst: string;
  igstPercent: string;
  amount: string;
  // Return information (for return details view)
  returned_quantity?: number;
  original_quantity?: number;
}

export interface FormData {
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
}

export interface FinancialSummary {
  totalValue: string;
  totalDiscount: string;
  taxAmount: string;
  totalPayableAmount: string;
}

export interface SalesReceiptState {
  salesItems: SalesReceiptItem[];
  formData: FormData;
  financialSummary: FinancialSummary;
  editingRowId: string | null;
  selectedRows: number[];
  applyGstToAll: boolean;
}

