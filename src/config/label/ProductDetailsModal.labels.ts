export const PRODUCT_DETAILS_MODAL_LABELS = {
  RECEIPT_PREFIX: 'Receipt number',
  SUPPLIER_PREFIX: 'Supplier name',
  TABLE_HEADERS: {
    PRODUCT_NAME: 'Product name',
    TYPE: 'Type',
    QUANTITY: 'Quantity',
    HSN_CODE: 'HSN code',
    AMOUNT: 'Unit Price',
  },
  DIALOG: {
    TITLE: 'Confirm Deletion',
    MESSAGE: 'Are you sure you want to delete this product? This action cannot be undone.',
  },
  TOAST: {
    UPDATE_SUCCESS: 'Quantity updated successfully',
    UPDATE_FAILED: 'Update failed',
    DELETE_SUCCESS: 'Product deleted successfully',
    DELETE_FAILED: 'Delete failed',
    NO_DATA: 'No product data available.',
  },
} as const;
