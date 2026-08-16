export const CUSTOMER_HISTORY_LABELS = {
  // Main modal
  TITLE: 'Customer purchase history',
  LAST_PURCHASE: 'Last purchase',
  LOADING: 'Loading history...',
  LOAD_ERROR: 'Failed to load customer history. Please try again.',
  EMPTY: 'This customer has no sales yet.',
  NO_LAST_PURCHASE: 'No purchases yet',
  RETRY: 'Retry',
  NO_RETURN: 'No return',
  // Detail (single-invoice preview) modal
  DETAIL_TITLE: 'Sale Preview',
  PRINT_BUTTON: 'Print',
  // Entry-point triggers
  HISTORY_ACTION: 'History',
  VIEW_HISTORY_BUTTON: 'View history',
  TABLE: {
    INVOICE: 'Invoice',
    INVOICE_DATE: 'Invoice date',
    TOTAL_AMOUNT: 'Total amount (₹)',
    RETURN_STATUS: 'Return status',
  },
} as const;

export type CustomerHistoryLabels = typeof CUSTOMER_HISTORY_LABELS;
