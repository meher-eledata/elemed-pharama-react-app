export interface ProductItem {
  productName: string;
  type: string;
  quantity: number;
  hsnCode: string;
  batchNumber: string;
  mrp: number;
  purchasePrice: number;
  lineId?: number;
  transaction_number?: string;
  payment_vendor?: string;
  invoice_date?: string;
}

export interface OrderReceiveRow {
  receiptId: number;
  reNo: string;
  poNo: string;
  po_id: number;
  supplier: string;
  supplierId: number;
  received: string;
  receivedRaw?: string;
  status: string;
  reBy: string;
  amt: number;
  products: ProductItem[];
  transaction_number?: string;
  payment_vendor?: string;
  invoice_date?: string;
  invoice_attachment?: string;
  receipt_file_name?: string; // File name from server upload
  receipt_file_url?: string; // File URL from server upload
  amountPaid?: number; // Amount paid to supplier
  pendingAmount?: number; // Pending amount
  creditAvailable?: number; // Credit available for supplier
  invoice_number?: string; // The SUPPLIER's invoice number
  receipt_number?: string | null; // OUR goods-receipt (GRN) number; reNo stays the internal key
}

export interface PurchaseOrderRow {
  receiptId: number;
  poNo: string;
  orderedDate: string;
  supplier: string;
  totalAmount: string;
  status: string;
  createdBy?: string;
}

// OrderDetails Types
import { Dayjs } from "dayjs";
import { orderLabels } from "../../config/label/OrderDetail.labels";

export interface PharmaTableRow {
  id?: string;
  productId: string;
  product_id?: number;
  type?: string;
  batchNumber?: string;
  batch_id?: number;
  po_line_id?: number;
  qtyReceived: number;
  qtyFree: number;
  batch: Dayjs | null;
  expiryDate: Dayjs | null;
  pp: number;
  sp: number;
  pack?: string;
  mrp: number;
  cgst: number;
  sgst: number;
  igst: number;
  disc: number | string;
  margPercent: number | string;
  salesDiscPercent: number | string;
  amount?: number;
  isEditing?: boolean;
  transaction_number?: string;
  payment_vendor?: string;
  invoice_date?: string;
}

export interface OrderDetailsProps {
  labels: typeof orderLabels;
}

export interface SupplierOption {
  supplier_name: string;
  supplier_id: number;
}

export interface ProductOption {
  name: string;
  id: number;
  currentQuantity?: number;
  // Dosage form / type (e.g. "NASAL SPRAY", "INJ") and brand, surfaced in the
  // Find Product dropdown so same-named products are distinguishable.
  type?: string;
  brand_name?: string | null;
  // Drug schedule (api-contract.md): NULL = not yet attributed (one-time popup on
  // add-to-receipt); 'NONE' = explicitly none (never prompts).
  schedule?: string | null;
}

export interface SupplierTotals {
  amountPaid: number;
  pendingAmount: number;
  creditAvailable: number;
}
