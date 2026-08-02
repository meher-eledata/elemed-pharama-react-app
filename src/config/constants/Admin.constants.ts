export const ADMIN_CONSTANTS = {
  ROUTE_BASE: '/admin',
  CARDS: {
    RADIUS: '12px',
    BORDER: 'none',
    BG: '#FFFFFF',
    PADDING: '24px',
    GAP: '12px',
    ICON_SIZE: 24,
    TITLE_COLOR: '#1A212B',
    DESC_COLOR: '#1A212B',
    SHADOW: '0 2px 8px rgba(0, 0, 0, 0.08)',
    ICON_CIRCLE_SIZE: 48,
    MIN_WIDTH: 280,
    MAX_WIDTH: 400,
    RIGHT_COLUMN_MARGIN_LEFT: '30px',
    },
  ICON_COLORS: {
    DASHBOARD: '#E1F5FE', // Light cyan
    USER_MGMT: '#E3F2FD', // Light blue
    REPORTS: '#E8F5E9', // Light green
    AUDIT: '#FFF3E0', // Light orange/peach
    SETTINGS: '#F3E5F5', // Light purple
    SUPPLIER_CREDIT: '#FFF8E1', // Light amber
    LOCATIONS: '#E8EAF6', // Light indigo
  },
  ACTION_BUTTON: {
    HEIGHT: 40,
    MIN_WIDTH: 180,
    RADIUS: '8px',
    BG: '#5C17E5',
    COLOR: '#FFFFFF',
    HOVER_BG: '#4A14C7',
    FONT_WEIGHT: 500,
    FONT_SIZE: '14px',
  },
} as const;

export type AdminConstants = typeof ADMIN_CONSTANTS;


