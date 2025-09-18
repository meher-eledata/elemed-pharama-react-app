export const ORDER_RECEIVE_TITLE = "Order Receive";
export const ADD_RECEIVE_BUTTON = "Add Receive";

export const TAB_CURRENT_ORDER = "Current Order";
export const TAB_RECEIVE_HISTORY = "Receive History";

export const CURRENT_ORDER_PLACEHOLDER = "Current Order content here...";
export const RECEIVE_HISTORY_PLACEHOLDER = "Receive History content here...";

export const ORDER_RECEIVE_TABLE_HEADERS = {
  RECEIPT_NUMBER: "Receipt number",
  PO_NUMBER: "PO number",
  SUPPLIER_NAME: "Supplier name",
  RECEIVED_ON: "Received on",
  RECEIVED_STATUS: "Received status",
  CREATED_BY: "Created by",
  TOTAL_AMOUNT: "Total amount",
  ACTIONS: "",
} as const;

export const PURCHASE_ORDER_TABLE_HEADERS = {
  RECEIPT_NUMBER: "Receipt number",
  PO_NUMBER: "PO number",
  ORDERED_DATE: "Ordered date",
  SUPPLIER_NAME: "Supplier name",
  TOTAL_AMOUNT: "Total amount",
  STATUS: "Status",
  CREATED_BY: "Created by",
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

export const ORDER_RECEIVE_MODAL = {
  DETAILS_TITLE: "Details of products",
} as const;