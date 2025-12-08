export const SALES_HISTORY_LABELS = {
  PAGE_TITLE: 'Sale history',
  SEARCH_PLACEHOLDER: 'Search by Invoice Number, Customer Name, or Phone Number',
  SHOW_FILTERS: 'Show filters',
  HIDE_FILTERS: 'Hide filters',
  FILTER_DOCTOR_NAME: 'Doctor Name',
  FILTER_USERNAME: 'Username',
  FILTER_DATE_RANGE: 'Date Range',
  FILTER_RESET: 'Reset filters',
  TABLE: {
    INVOICE: 'Invoice',
    INVOICE_DATE: 'Invoice date',
    CUSTOMER_NAME: 'Customer name',
    MOBILE_NUMBER: 'Mobile number',
    DOCTOR: 'Doctor',
    USERNAME: 'Username',
    TOTAL_AMOUNT: 'Total amount (₹)',
  },
  EMPTY_MESSAGE: 'No sales history found',
  MODAL_TITLE: 'Invoice Preview',
  START_NEW_SALE: '+ Start new sale',
  SEARCH_DOCTOR_PLACEHOLDER: 'Search doctor...',
  SEARCH_USERNAME_PLACEHOLDER: 'Search username...'
} as const;

export type SalesHistoryLabels = typeof SALES_HISTORY_LABELS;


