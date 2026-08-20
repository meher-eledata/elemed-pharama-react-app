export const ORDER_RECEIVE_TITLE = "Stock Receipt History";
export const ADD_RECEIVE_BUTTON = "Receive Stock";
export const PURCHASE_RETURN_BUTTON = "Purchase Return";

export const TAB_CURRENT_ORDER = "New Receipt";
export const TAB_RECEIVE_HISTORY = "Receive History";

export const CURRENT_ORDER_PLACEHOLDER = "Current Order content here...";
export const RECEIVE_HISTORY_PLACEHOLDER = "Receive History content here...";

export const ORDER_RECEIVE_TABLE_HEADERS = {
  RECEIPT_NUMBER: "Receipt number",
  // The supplier's own invoice number — deliberately distinct from RECEIPT_NUMBER above.
  SUPPLIER_INVOICE_NUMBER: "Supplier invoice no.",
  PO_NUMBER: "PO number",
  SUPPLIER_NAME: "Supplier name",
  RECEIVED_ON: "Received on",
  RECEIVED_STATUS: "Received status",
  CREATED_BY: "Received By",
  TOTAL_AMOUNT: "Total amount (₹)",
  AMOUNT_PAID: "Amount paid (₹)",
  PENDING_AMOUNT: "Pending amount (₹)",
  CREDIT_AVAILABLE_FOR_SUPPLIER: "Credit available for the supplier (₹)",
  INVOICE_ATTACHMENT: "Invoice Attachment",
  ACTIONS: "",
} as const;

export const PURCHASE_ORDER_TABLE_HEADERS = {
  RECEIPT_NUMBER: "Receipt number",
  PO_NUMBER: "PO number",
  ORDERED_DATE: "Ordered date",
  SUPPLIER_NAME: "Supplier name",
  TOTAL_AMOUNT: "Total amount (₹)",
  STATUS: "Status",
  CREATED_BY: "Received By",
} as const;

export const ORDER_RECEIVE_MESSAGES = {
  LOADING_RECEIPTS: "Loading receipts...",
  LOADING_ORDERS: "Loading purchase orders...",
  LOAD_RECEIPTS_FAILED: "Failed to load receipts.",
  LOAD_ORDERS_FAILED: "Failed to load purchase orders.",
  EMPTY_RECEIPTS: "No receipts yet",
  EMPTY_ORDERS: "No current orders",
  UPDATE_SUCCESS: "Updated successfully",
  UPDATE_FAILED: "Update failed",
  DELETE_SUCCESS: "Deleted successfully",
  DELETE_FAILED: "Delete failed",
} as const;

export const ORDER_RECEIVE_DIALOG = {
  DELETE_TITLE: "Confirm Deletion",
  DELETE_MESSAGE: "Are you sure you want to delete this record? This action cannot be undone.",
} as const;

// Consequence sentence for the shared DeleteDocumentDialog. Deliberately avoids
// "cannot be undone": the backend soft-deletes — the receipt, its lines and its stock
// history all survive, the receipt is just retired. Names the two real consequences
// (stock reversed, payments voided) instead.
export const ORDER_RECEIVE_DELETE_DIALOG = {
  DOCUMENT_LABEL: "receipt",
  CONSEQUENCE:
    "The received stock will be taken back out of inventory and any supplier payments on this receipt will be voided. The receipt stays in your history, marked as deleted.",
} as const;

// Status filter options, mirroring Sale History's control. Receipts have no return
// concept in this list, so the pair is All/Deleted rather than All/Return/Deleted.
export const ORDER_RECEIVE_STATUS_FILTER = {
  LABEL: "Status",
  OPTIONS: ['All', 'Deleted'] as const,
} as const;

// Action tooltips for a retired receipt. The badge itself (and its who/when/why tooltip)
// is the shared DeletedRecordBadge, so sales and receive cannot drift apart on it.
export const ORDER_RECEIVE_DELETED_BADGE = {
  EDIT_BLOCKED: "This receipt has been deleted and can no longer be edited.",
  PAYMENT_BLOCKED: "This receipt has been deleted and can no longer take payments.",
} as const;

export const ORDER_RECEIVE_MODAL = {
  DETAILS_TITLE: "Details of products",
} as const;