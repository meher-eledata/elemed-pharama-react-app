export const SALES_HISTORY_CONSTANTS = {
  TABLE: {
    ROWS_PER_PAGE: 6,
  },
  ICONS: {
    VIEW_SIZE: 18,
    VIEW_COLOR: '#666',
  },
} as const;

export type SalesHistoryConstants = typeof SALES_HISTORY_CONSTANTS;


