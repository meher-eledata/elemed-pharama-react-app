export const MASTER_DATA_CONSTANTS = {
  CARDS: {
    RADIUS: '12px',
    BORDER: 'none',
    BG: '#FFFFFF',
    PADDING: '24px',
    GAP: '12px',
    ICON_SIZE: 48,
    TITLE_COLOR: '#1A212B',
    DESC_COLOR: '#6B7280',
    SHADOW: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    ICON_CIRCLE_SIZE: 64,
    MIN_WIDTH: 280,
    MAX_WIDTH: 400,
  },
  ICON_COLORS: {
    PRODUCT: '#E0E7FF', // Light blue
    CUSTOMER: '#FCE7F3', // Light pink
    SUPPLIER: '#FEF3C7', // Light yellow
    DOCTOR: '#D1FAE5', // Light green
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
  BADGE: {
    RADIUS: '8px',
    PADDING: '4px 12px',
    BG: '#F3F4F6',
    TEXT_COLOR: '#6B7280',
    FONT_SIZE: '12px',
    FONT_WEIGHT: 500,
  },
} as const;

export type MasterDataConstants = typeof MASTER_DATA_CONSTANTS;

