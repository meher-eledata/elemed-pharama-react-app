export const SALES_RETURNS_LOG_CONSTANTS = {
  ROWS_PER_PAGE: 10,
  LOG_FETCH_LIMIT: 200, // list-sales-returns caps limit at 200
  SEARCH_DEBOUNCE_MS: 400,
  REQUEST_DATE_FORMAT: 'YYYY-MM-DD', // start_date / end_date request format
  DISPLAY_DATE_FORMAT: 'DD MMM YYYY', // sales-module display format
  RECEIPT_ROUTE: '/sales/receipt',
} as const;
