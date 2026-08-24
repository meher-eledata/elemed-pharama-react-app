/**
 * Shared styling + behavioural constants for the five admin reports
 * (Supplier Receipt, Supplier Payment, Product Sales, Sales Tax, Supplier Tax).
 *
 * Mirrors the Daily Sales Report visual language (Reports.tsx /
 * DetailedSalesTable.tsx): #5C17E5 purple, Lexend font, 16px card radius, soft
 * shadows, the metric-card / section-header look, the tab switcher, ReusableTable.
 *
 * Per-report label files live in src/config/label/*.labels.ts and reference
 * these constants for any shared style values — no magic numbers inline.
 */
export const ADMIN_REPORTS_CONSTANTS = {
  FONT_FAMILY: "'Lexend', sans-serif",

  COLORS: {
    PURPLE: '#5C17E5',
    PURPLE_HOVER: '#4C14C7',
    PURPLE_SOFT_BG: '#F3E8FF',
    TEXT_PRIMARY: '#1A212B',
    TEXT_SECONDARY: '#374151',
    TEXT_MUTED: '#728197',
    POSITIVE: '#10B981',
    NEGATIVE: '#DC2626',
    BLUE: '#3B82F6',
    AMBER: '#F59E0B',
    INDIGO: '#6366F1',
    PINK: '#EC4899',
    GRAY: '#6B7280',
    BORDER: '#E5E7EB',
    CARD_BG: '#F9FAFB',
    WHITE: '#FFFFFF',
  },

  // Chart palette reused for bar/pie series (matches Daily Sales palette).
  CHART_PALETTE: [
    '#5C17E5',
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EC4899',
    '#6366F1',
    '#EF4444',
    '#8B5CF6',
    '#94A3B8',
  ],

  PAGE: {
    PADDING: 3,
    PADDING_BOTTOM: '24px',
  },

  DEFAULTS: {
    // Date range default = last 30 days (inclusive of today).
    RANGE_DAYS: 30,
    ROWS_PER_PAGE: 10,
  },

  HEADER: {
    TITLE_VARIANT: 'h5' as const,
    TITLE_FONT_WEIGHT: 700,
    TITLE_COLOR: '#1A212B',
    SUBTITLE_COLOR: '#728197',
    SUBTITLE_FONT_SIZE: '14px',
  },

  // Metric card look (matches Daily Sales Report cards).
  CARD: {
    PADDING: 2.5,
    BORDER_RADIUS: '16px',
    BOX_SHADOW: '0 1px 3px rgba(0, 0, 0, 0.1)',
    BORDER: '1px solid #E5E7EB',
    BACKGROUND: '#F9FAFB',
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

  // Discovery card look (matches Reports.tsx report-card grid).
  DISCOVERY_CARD: {
    PADDING: 3,
    BORDER_RADIUS: '16px',
    BOX_SHADOW: '0 1px 3px rgba(0, 0, 0, 0.12)',
    BOX_SHADOW_HOVER: '0 4px 6px rgba(0, 0, 0, 0.1)',
    BORDER: '1px solid #E5E7EB',
    TITLE_FONT_SIZE: '18px',
    TITLE_FONT_WEIGHT: 700,
    TITLE_COLOR: '#1A212B',
    DESC_FONT_SIZE: '14px',
    DESC_COLOR: '#728197',
  },

  SECTION_TITLE: {
    FONT_SIZE: '18px',
    FONT_WEIGHT: 600,
    COLOR: '#1A212B',
  },

  // Tab / toggle switcher (matches Reports.tsx tab buttons).
  TAB: {
    ACTIVE_BG: '#5C17E5',
    ACTIVE_BG_HOVER: '#4C14C7',
    ACTIVE_COLOR: '#FFFFFF',
    INACTIVE_COLOR: '#1A212B',
    INACTIVE_BORDER: '1px solid #D1D5DB',
    BORDER_RADIUS: '0.5rem',
    FONT_SIZE: '14px',
    FONT_WEIGHT: 600,
    PADDING: '8px 16px',
    MIN_WIDTH: '120px',
  },

  CHART: {
    HEIGHT: 320,
    CONTAINER_HEIGHT: '350px',
    BAR_COLOR: '#5C17E5',
    TICK_LABEL_FONT_SIZE: 12,
    TICK_LABEL_COLOR: '#728197',
    AXIS_STROKE: '#6B7280',
    GRID_STROKE: '#E5E7EB',
    // x-charts v8: tick-label space is allocated by the AXIS config, not by
    // `margin` — margin is only outer padding around the plot + axes.
    MARGIN: { top: 20, bottom: 5, left: 5, right: 10 },
    X_AXIS_HEIGHT: 30,
    // Rotated (-35°) date/category labels need real vertical room or the
    // library ellipsizes them down to EMPTY strings (blank axis).
    X_AXIS_HEIGHT_ANGLED: 80,
    Y_AXIS_WIDTH: 55,
    // Cap on rendered x-axis tick labels — wide date ranges skip intermediate
    // ticks instead of overlapping into an unreadable smear.
    MAX_X_TICK_LABELS: 12,
    // "Top N" bar-chart truncation — matches the backend LIMIT on the Supplier
    // Receipt overview's top-suppliers/top-products chart queries.
    TOP_N: 10,
  },

  TABLE: {
    HEADER_FONT_FAMILY: "'Lexend', sans-serif",
    CELL_FONT_SIZE: '14px',
    CELL_COLOR: '#1A212B',
    DEFAULT_SORT_DIRECTION: 'desc' as const,
  },

  // Summary / totals bar (matches DetailedSalesTable grand-totals bar).

  CURRENCY: {
    LOCALE: 'en-IN',
    SYMBOL: '₹',
    FRACTION_DIGITS: 2,
  },

  STATES: {
    LOADING: 'Loading report…',
    ERROR: 'Failed to load report data. Please try again later.',
    RETRY: 'Retry',
    EMPTY: 'No data for the selected period.',
  },

  ROUTES: {
    REPORTS: '/admin/reports',
    SUPPLIER_RECEIPT: '/admin/reports/supplier-receipt',
    SUPPLIER_PAYMENTS: '/admin/reports/supplier-payments',
    PRODUCT_SALES: '/admin/reports/product-sales',
    SALES_TAX: '/admin/reports/sales-tax',
    SUPPLIER_TAX: '/admin/reports/supplier-tax',
  },
} as const;

export type AdminReportsConstants = typeof ADMIN_REPORTS_CONSTANTS;
