export const ADD_BUTTON_COLOR = "#7B2CBF";

export const ADD_BUTTON_HOVER_COLOR = "#5A189A";

export const TAB_INDICATOR_STYLE = { backgroundColor: "#000", display: "none" };

export const ORDER_RECEIVE_CONSTANTS = {
  TABS: {
    CONTAINER_BG: '#eef4ff',
    BORDER_RADIUS: '16px',
    PADDING: '6px',
    GAP: '1px',
    BUTTON_WIDTH: '8.5rem',
    BUTTON_HEIGHT: '2.35rem',
    ACTIVE_BG: '#ffffff',
    INACTIVE_BG: 'transparent',
    HOVER_PRIMARY: '#1976d2',
    ACTIVE_RADIUS: '0.5rem',
  },
  ICONS: {
    DEFAULT_COLOR:'#2d2a2aff',
    MUTED_COLOR: '#666',
    RECEIPT_VIEW_SIZE: 18,
  },
  TABLE: {
    ROWS_PER_PAGE: 4,
    ACTION_GAP: 1.5,
     ICONS_GAP: 5,
  },
  SNACKBAR: {
    AUTOHIDE_MS: 3000,
    ANCHOR: { vertical: 'bottom', horizontal: 'right' as const },
  },
} as const;

// Auto-fill of the receive form from an uploaded supplier invoice
// (POST /api/receive/extract-invoice). Fields at/above DEFAULT_THRESHOLD are
// pre-filled; below-threshold / unmatched fields are left blank and surfaced for
// manual review. Human labels drive the "needs review" banner.
export const INVOICE_EXTRACTION = {
  DEFAULT_THRESHOLD: 0.85,
  EXTRACTING: 'Reading invoice…',
  FALLBACK_TOAST: "Couldn't auto-read the invoice — please enter the details manually.",
  REVIEW_SUBTITLE:
    "We left the fields below blank because the invoice wasn't clear enough. Please check and fill them in.",
  SUPPLIER_PICK: 'Closest supplier matches:',
  PRODUCT_PICK: 'Closest product matches:',
  ADD_NEW_PRODUCT: 'Add new product…',
  reviewTitle: (n: number) => `${n} ${n === 1 ? 'field needs' : 'fields need'} your review`,
  lineLabel: (n: number) => `Line ${n}`,
  FIELD_LABELS: {
    'header.supplier': 'Supplier',
    'header.invoice_number': 'Invoice number',
    'header.invoice_date': 'Invoice date',
    'header.po_number': 'PO number',
    product: 'Product',
    batch_number: 'Batch number',
    expiry_date: 'Expiry date',
    received_qty: 'Received packs',
    free_qty: 'Free packs',
    purchase_price: 'Purchase price',
    cgst: 'CGST',
    sgst: 'SGST',
    igst: 'IGST',
    discount: 'Discount',
    mrp: 'MRP',
  } as Record<string, string>,
} as const;