export const MASTER_DATA_CONSTANTS = {
  CARDS: {
    RADIUS: '0.75rem', // 12px = 0.75rem
    BORDER: 'none',
    BG: '#FFFFFF',
    PADDING: '1.5rem', // 24px = 1.5rem
    GAP: '0.75rem', // 12px = 0.75rem
    ICON_SIZE: 48,
    TITLE_COLOR: '#1A212B',
    DESC_COLOR: '#6B7280',
    SHADOW: '0 0.125rem 0.5rem rgba(0, 0, 0, 0.08)', // 2px = 0.125rem, 8px = 0.5rem
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
    RADIUS: '0.5rem', // 8px = 0.5rem
    BG: '#5C17E5',
    COLOR: '#FFFFFF',
    HOVER_BG: '#4A14C7',
    FONT_WEIGHT: 500,
    FONT_SIZE: '0.875rem', // 14px = 0.875rem
  },
  BADGE: {
    RADIUS: '0.5rem', // 8px = 0.5rem
    PADDING: '0.25rem 0.75rem', // 4px = 0.25rem, 12px = 0.75rem
    BG: '#F3F4F6',
    TEXT_COLOR: '#6B7280',
    FONT_SIZE: '0.75rem', // 12px = 0.75rem
    FONT_WEIGHT: 500,
  },
} as const;

export type MasterDataConstants = typeof MASTER_DATA_CONSTANTS;

