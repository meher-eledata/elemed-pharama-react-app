import type {
  GstTreatment,
  ValueBasis,
  SettlementMode,
  ReturnStatus,
  ExpiryStatus,
} from '../../redux/slices/supplierReturnsApi';

export const PURCHASE_RETURN_ROUTES = {
  LANDING: '/receive/purchase-return',
  DETAILS: '/receive/purchase-return/details',
  LOG: '/receive/purchase-return/log',
} as const;

export const GST_TREATMENT_OPTIONS: Array<{ value: GstTreatment; label: string }> = [
  { value: 'WITH_GST', label: 'With GST' },
  { value: 'WITHOUT_GST', label: 'Without GST' },
];

export const VALUE_BASIS_OPTIONS: Array<{ value: ValueBasis; label: string }> = [
  { value: 'PURCHASE_PRICE', label: 'Purchase Price' },
  { value: 'MRP', label: 'MRP' },
];

export const SETTLEMENT_MODE_OPTIONS: Array<{ value: SettlementMode; label: string }> = [
  { value: 'CREDIT_NOTE', label: 'Credit note' },
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
];

export const SETTLEMENT_MODE_TEXT: Record<SettlementMode, string> = {
  CREDIT_NOTE: 'Credit note',
  CASH: 'Cash',
  UPI: 'UPI',
};

// Expiry status filter — 'ATTENTION' (Expired & Near Expiry) is the default,
// matching the workflow's purpose of clearing bad stock.
export type ExpiryFilterValue = 'ATTENTION' | 'ALL' | ExpiryStatus;
export const EXPIRY_FILTER_OPTIONS: Array<{ value: ExpiryFilterValue; label: string }> = [
  { value: 'ATTENTION', label: 'Expired & Near Expiry' },
  { value: 'ALL', label: 'All' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'NEAR_EXPIRY', label: 'Near Expiry' },
  { value: 'OK', label: 'OK' },
];
export const DEFAULT_EXPIRY_FILTER: ExpiryFilterValue = 'ATTENTION';

export const EXPIRY_STATUS_META: Record<ExpiryStatus, { label: string; bg: string; color: string }> = {
  EXPIRED: { label: 'Expired', bg: '#FDECEC', color: '#C5221F' },
  NEAR_EXPIRY: { label: 'Near Expiry', bg: '#FEF3C7', color: '#92400E' },
  OK: { label: 'OK', bg: '#EEF2F7', color: '#525E6F' },
};

export const RETURN_STATUS_META: Record<ReturnStatus, { label: string; bg: string; color: string }> = {
  AWAITING_CREDIT: { label: 'Awaiting credit', bg: '#FEF3C7', color: '#92400E' },
  CREDIT_RECEIVED: { label: 'Credit received', bg: '#E7F6EC', color: '#137333' },
  SETTLED: { label: 'Settled', bg: '#E7F6EC', color: '#137333' },
};

export const RETURN_STATUS_FILTER_OPTIONS: ReturnStatus[] = [
  'AWAITING_CREDIT',
  'CREDIT_RECEIVED',
  'SETTLED',
];

export const PURCHASE_RETURN_CONSTANTS = {
  ROWS_PER_PAGE: 10,
  CREDIT_NOTE_FILE: {
    MAX_MB: 15,
    ACCEPT: 'image/*,.pdf',
    ALLOWED_TYPES: ['image/png', 'image/jpeg', 'application/pdf'],
  },
  LOG_FETCH_LIMIT: 200, // list-returns caps limit at 200
  REQUEST_DATE_FORMAT: 'YYYY-MM-DD', // start_date / end_date request format
  REASON_MAX_LENGTH: 255,
  SEARCH_DEBOUNCE_MS: 400,
  SNACKBAR: {
    AUTOHIDE_MS: 4000,
    ANCHOR: { vertical: 'bottom', horizontal: 'center' } as const,
  },
} as const;
