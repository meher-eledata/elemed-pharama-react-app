export const REPORTS_CONSTANTS = {
  TABS: {
    GAP: '8px',
    BUTTON: {
      HEIGHT: '40px',
      MIN_WIDTH: '160px',
      BORDER_RADIUS: '0.5rem',
      FONT_SIZE: '14px',
      FONT_WEIGHT: 600,
      ACTIVE_BG: '#5C17E5',
      ACTIVE_COLOR: '#FFFFFF',
      INACTIVE_BG: 'transparent',
      INACTIVE_COLOR: '#1A212B',
      INACTIVE_BORDER: '1px solid #D1D5DB',
    },
  },
  PAGE: {
    PADDING_BOTTOM: '24px',
  },
} as const;

export type ReportsConstants = typeof REPORTS_CONSTANTS;

