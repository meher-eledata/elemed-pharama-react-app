export const SETTINGS_CONSTANTS = {
  TYPOGRAPHY: {
    TITLE_VARIANT: 'h5' as const,
    TITLE_FONT_WEIGHT: 700,
  },
  ACCORDION: {
    RADIUS: '12px',
    SHADOW: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    BG: '#FFFFFF',
    PADDING: '24px',
    GAP: '16px',
  },
  EMAIL_INPUT: {
    HEIGHT: '40px',
    RADIUS: '8px',
    BORDER: '1px solid #D7DFEA',
  },
  DELETE_ICON: {
    COLOR: '#EF4444',
    SIZE: 20,
  },
  SAVE_BUTTON: {
    HEIGHT: '48px',
    MIN_WIDTH: '160px',
    RADIUS: '12px',
    BG: '#5C17E5',
    COLOR: '#FFFFFF',
  },
} as const;

export type SettingsConstants = typeof SETTINGS_CONSTANTS;

