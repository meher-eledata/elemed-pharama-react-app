// Per-page constants for the Compliance module (see Compliance.labels.ts for copy).

export const COMPLIANCE_CONSTANTS = {
  ROUTE_BASE: '/compliance',
  // The same pages under the admin portal (role decides capability, not route).
  ADMIN_ROUTE_BASE: '/admin/compliance',
  FONT: "'Lexend', sans-serif",
  ACCENT: '#5C17E5',
  // Client-side pre-checks mirroring POST /compliance/documents/:id/versions
  // (the server stays authoritative and checks BOTH mime type and extension).
  UPLOAD: {
    MAX_BYTES: 20 * 1024 * 1024,
    ACCEPT: '.pdf,.jpg,.jpeg,.png',
    EXTENSIONS: ['pdf', 'jpg', 'jpeg', 'png'],
    MIME_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  // Wire format for every compliance date field (DATEONLY columns).
  API_DATE_FORMAT: 'YYYY-MM-DD',
  // Display format for this module (the app's non-sales convention).
  DISPLAY_DATE_FORMAT: 'DD/MM/YYYY',
  DISPLAY_DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
  // Fallback when the org has saved no reminder preference (mirrors the backend's
  // DEFAULT_LEAD_DAYS). Only used to colour the "expiring" window on this page —
  // notification severity itself is always taken from the server.
  DEFAULT_LEAD_DAYS: [60, 30, 7],
} as const;

// The lifecycle state of a document, derived from its CURRENT version only.
export type ComplianceDocumentState =
  | 'NO_VERSION'
  | 'NO_EXPIRY'
  | 'EXPIRED'
  | 'EXPIRING_INNER'
  | 'EXPIRING'
  | 'VALID';

// Chip palette reused verbatim from the inventory stock tags so the two modules
// read identically (src/pages/Inventory/InventoryModule.tsx).
export const COMPLIANCE_STATE_CHIP: Record<
  ComplianceDocumentState,
  { background: string; color: string }
> = {
  EXPIRED: { background: '#FEE2E2', color: '#B91C1C' },
  EXPIRING_INNER: { background: '#FEF3C7', color: '#B45309' },
  EXPIRING: { background: '#EDE9FE', color: '#6D28D9' },
  VALID: { background: '#DCFCE7', color: '#15803D' },
  NO_EXPIRY: { background: '#F3F4F6', color: '#4B5563' },
  NO_VERSION: { background: '#FEF3C7', color: '#B45309' },
};

export const COMPLIANCE_CHIP_BASE_SX = {
  height: '20px',
  fontSize: '0.6875rem',
  fontWeight: 600,
  borderRadius: '0.375rem',
  '& .MuiChip-label': { px: '0.5rem' },
} as const;

export const COMPLIANCE_CARD_SX = {
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  backgroundColor: '#FFFFFF',
} as const;

export const COMPLIANCE_FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    fontFamily: COMPLIANCE_CONSTANTS.FONT,
  },
  '& .MuiInputBase-input': { fontSize: '14px', color: '#1A212B' },
  '& .MuiInputLabel-root': { fontFamily: COMPLIANCE_CONSTANTS.FONT, fontSize: '14px' },
  '& .MuiFormHelperText-root': {
    fontFamily: COMPLIANCE_CONSTANTS.FONT,
    fontSize: '12px',
    marginLeft: 0,
  },
} as const;
