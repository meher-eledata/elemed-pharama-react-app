export const REPORTS_CONSTANTS = {
  TABS: {
    GAP: '8px',
    BUTTON: {
      HEIGHT: '40px',
      MIN_WIDTH: '160px',
      BORDER_RADIUS: '8px',
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
  DAILY_SALES_REPORT: {
    CARD: {
      BORDER_RADIUS: '12px',
      BOX_SHADOW: '0 1px 3px rgba(0,0,0,0.1)',
      BORDER: '1px solid #E5E7EB',
      PADDING: 2.5,
      METRIC_LABEL: {
        FONT_SIZE: '14px',
        COLOR: '#728197',
        FONT_WEIGHT: 400,
      },
      METRIC_VALUE: {
        FONT_SIZE: '24px',
        FONT_WEIGHT: 700,
        COLOR: '#1A212B',
      },
      SALES_CARD: {
        PADDING: 2,
        TITLE_FONT_SIZE: '16px',
        TITLE_FONT_WEIGHT: 500,
        AMOUNT_FONT_SIZE: '20px',
        AMOUNT_FONT_WEIGHT: 700,
        SUBTEXT_FONT_SIZE: '14px',
        SUBTEXT_COLOR: '#728197',
      },
    },
    SECTION_TITLE: {
      FONT_SIZE: '18px',
      FONT_WEIGHT: 600,
      COLOR: '#1A212B',
      MARGIN_BOTTOM: '-21px',
    },
    TAX_SUMMARY: {
      CARD_WIDTH: '518px',
      CARD_HEIGHT: '201px',
      LABEL_FONT_SIZE: '14px',
      LABEL_COLOR: '#728197',
      VALUE_FONT_SIZE: '16px',
      VALUE_FONT_WEIGHT: 600,
      VALUE_COLOR: '#1A212B',
      BORDER_BOTTOM: '1px solid #E5E7EB',
      BORDER_BOTTOM_LIGHT: '1px solid #F3F4F6',
    },
    WEEKLY_TREND: {
      CARD_WIDTH: '515px',
      CARD_HEIGHT: '201px',
      CHART_COLOR: '#7C3AED',
      TICK_LABEL_FONT_SIZE: 12,
      TICK_LABEL_COLOR: '#728197',
    },
  },
} as const;

export type ReportsConstants = typeof REPORTS_CONSTANTS;

