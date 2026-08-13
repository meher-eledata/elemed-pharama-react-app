export const SALES_HISTORY_CONSTANTS = {
  TABLE: {
    ROWS_PER_PAGE: 6,
  },
  ICONS: {
    VIEW_SIZE: 18,
    VIEW_COLOR: '#666',
  },
  // Which tab is open, kept in the URL (`/sales?tab=returns`). Absent = Invoices.
  TAB_PARAM: 'tab',
  TAB_RETURNS: 'returns',
} as const;

export type SalesHistoryConstants = typeof SALES_HISTORY_CONSTANTS;


