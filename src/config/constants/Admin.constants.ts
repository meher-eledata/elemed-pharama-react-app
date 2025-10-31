export const ADMIN_CONSTANTS = {
  ROUTE_BASE: '/admin',
  CARDS: {
    RADIUS: '12px',
    BORDER: '1px solid #E6ECF5',
    BG: '#FFFFFF',
    PADDING: '20px',
    GAP: '8px',
    ICON_SIZE: 28,
    TITLE_COLOR: '#1A212B',
    DESC_COLOR: '#6B7280',
    SHADOW: 'none',
  },
  ACTION_BUTTON: {
    HEIGHT: 40,
    MIN_WIDTH: 180,
    RADIUS: '10px',
    BG: '#5C17E5',
    COLOR: '#FFFFFF',
    HOVER_BG: '#4A14C7',
    FONT_WEIGHT: 700,
    FONT_SIZE: '14px',
  },
} as const;

export type AdminConstants = typeof ADMIN_CONSTANTS;


