export const SUPPLIER_REPORTS_CONSTANTS = {
  PAGE: {
    PADDING: 3,
    PADDING_BOTTOM: '24px',
    FONT_FAMILY: "'Lexend', sans-serif",
  },
  ROUTES: {
    OVERVIEW: '/admin/reports/suppliers',
    DETAIL_BASE: '/admin/reports/suppliers', // append `/${supplierId}`
  },
  DEFAULTS: {
    // Date range default = last 30 days (inclusive of today).
    RANGE_DAYS: 30,
    ROWS_PER_PAGE: 10,
    PRODUCT_LIMIT: 100,
    OVERDUE_DAYS: 30,
  },
  HEADER: {
    TITLE_VARIANT: 'h5' as const,
    TITLE_FONT_WEIGHT: 700,
    TITLE_COLOR: '#1A212B',
    SUBTITLE_COLOR: '#728197',
    SUBTITLE_FONT_SIZE: '14px',
  },
  CARD: {
    BORDER_RADIUS: '16px',
    BOX_SHADOW: '0 1px 3px rgba(0,0,0,0.1)',
    BORDER: '1px solid #E5E7EB',
    BACKGROUND: '#F9FAFB',
    PADDING: 2.5,
    TITLE: {
      FONT_SIZE: '14px',
      FONT_WEIGHT: 500,
      COLOR: '#728197',
    },
    VALUE: {
      FONT_SIZE: '24px',
      FONT_WEIGHT: 700,
      COLOR: '#1A212B',
    },
    SUBTEXT: {
      FONT_SIZE: '12px',
      COLOR: '#728197',
    },
  },
  SECTION_TITLE: {
    FONT_SIZE: '18px',
    FONT_WEIGHT: 600,
    COLOR: '#1A212B',
  },
  TAX_SUMMARY: {
    LABEL_FONT_SIZE: '14px',
    LABEL_COLOR: '#728197',
    VALUE_FONT_SIZE: '16px',
    VALUE_FONT_WEIGHT: 600,
    VALUE_COLOR: '#1A212B',
    BORDER_BOTTOM: '1px solid #E5E7EB',
    BORDER_BOTTOM_LIGHT: '1px solid #F3F4F6',
    MAX_WIDTH: '480px',
    MIN_HEIGHT: '180px',
  },
  CHART: {
    COLOR: '#5C17E5',
    HEIGHT: 320,
    CONTAINER_HEIGHT: '350px',
    TICK_LABEL_FONT_SIZE: 12,
    TICK_LABEL_COLOR: '#728197',
    AXIS_STROKE: '#6B7280',
    GRID_STROKE: '#E5E7EB',
    MARGIN: { top: 20, bottom: 60, left: 70, right: 10 },
  },
  TABLE: {
    HEADER_FONT_FAMILY: "'Lexend', sans-serif",
    CELL_FONT_SIZE: '14px',
    CELL_COLOR: '#1A212B',
    LINK_COLOR: '#5C17E5',
    DEFAULT_SORT_DIRECTION: 'desc' as const,
  },
  SUPPLIER_HEADER: {
    NAME_FONT_SIZE: '22px',
    NAME_FONT_WEIGHT: 700,
    NAME_COLOR: '#1A212B',
    META_LABEL_COLOR: '#728197',
    META_VALUE_COLOR: '#1A212B',
    META_FONT_SIZE: '14px',
  },
  COLORS: {
    PURPLE: '#5C17E5',
    PURPLE_HOVER: '#4C14C7',
    POSITIVE: '#10B981',
    NEGATIVE: '#DC2626',
    NEUTRAL: '#1A212B',
    MUTED: '#728197',
  },
  CURRENCY: {
    LOCALE: 'en-IN',
    SYMBOL: '₹',
    FRACTION_DIGITS: 2,
  },
  PDF: {
    MARGIN: 10,
    IMAGE: { type: 'jpeg' as const, quality: 0.98 },
    HTML2CANVAS: { scale: 2, useCORS: true, logging: false },
    JSPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
  },
} as const;

// Filter dropdown options. Values are sent verbatim to the backend; empty string = no filter.
export const SUPPLIER_PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Payments' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partially Paid' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'overdue', label: 'Overdue' },
] as const;

export const SUPPLIER_PO_STATUS_OPTIONS = [
  { value: '', label: 'All POs' },
  { value: 'pending', label: 'Pending' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export type SupplierReportsConstants = typeof SUPPLIER_REPORTS_CONSTANTS;
