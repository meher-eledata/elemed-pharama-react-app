// Constants for the shared CustomerHistoryModal (list + single-invoice detail).
export const CUSTOMER_HISTORY_CONSTANTS = {
  // Canonical sales-module date display format (matches SaleHistory).
  DATE_FORMAT: 'DD MMM YYYY',
  MODAL_MAX_WIDTH: '820px',
  DETAIL_MODAL_MAX_WIDTH: '900px',
} as const;

export type CustomerHistoryConstants = typeof CUSTOMER_HISTORY_CONSTANTS;
