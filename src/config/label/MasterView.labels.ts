export const MASTER_VIEW_LABELS = {
  // Per-card "View" action label
  VIEW_ACTION: 'View / Edit',
  // Table view dialog titles per category
  VIEW_TITLES: {
    customer: 'Customers',
    supplier: 'Suppliers',
    product: 'Products',
    doctor: 'Doctors',
  },
  // Edit form dialog titles per category
  EDIT_TITLES: {
    customer: 'Edit Customer',
    supplier: 'Edit Supplier',
    product: 'Edit Product',
    doctor: 'Edit Doctor',
  },
  ACTIONS_HEADER: 'Actions',
  // Placeholder shown when a value is empty/missing (null, undefined, blank,
  // whitespace-only, NaN, or the string "nan"/"NaN").
  EMPTY_PLACEHOLDER: '-',
  EDIT_BUTTON: 'Edit',
  DOWNLOAD_BUTTON: 'Download',
  SAVE_BUTTON: 'Save',
  CANCEL_BUTTON: 'Cancel',
  CLOSE_BUTTON: 'Close',
  // Exported .xlsx file name per category
  DOWNLOAD_FILENAMES: {
    customer: 'customers.xlsx',
    supplier: 'suppliers.xlsx',
    product: 'products.xlsx',
    doctor: 'doctors.xlsx',
  },
  LOADING: 'Loading...',
  EMPTY: 'No records found.',
  // Placeholder for the VIEW modal's client-side search-by-name field
  SEARCH_PLACEHOLDER: 'Search by name',
  // Empty-state shown when a search query matches no rows
  NO_MATCHES: 'No records match your search.',
  LOAD_ERROR: 'Failed to load records. Please try again.',
  LOCKED_HINT: 'Read-only',
  SUCCESS: {
    customer: 'Customer updated successfully!',
    supplier: 'Supplier updated successfully!',
    product: 'Product updated successfully!',
    doctor: 'Doctor updated successfully!',
  },
  UPDATE_ERROR: 'Failed to update record. Please try again.',
} as const;

export type MasterViewLabels = typeof MASTER_VIEW_LABELS;
