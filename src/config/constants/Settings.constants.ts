export const SETTINGS_CONSTANTS = {
  TYPOGRAPHY: {
    TITLE_VARIANT: 'h5' as const,
    TITLE_FONT_WEIGHT: 700,
  },
} as const;

export type SettingsConstants = typeof SETTINGS_CONSTANTS;

