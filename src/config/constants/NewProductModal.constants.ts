export const NEW_PRODUCT_MODAL_CONSTANTS = {
  MODAL: {
    WIDTH: '92%',
    MAX_WIDTH: 520,
    BORDER_RADIUS: '0.5rem', // 8px = 0.5rem
    PADDING: 3,
    GAP: '1rem', // 16px = 1rem
    MAX_HEIGHT: '80vh'
  },
  HEADER: {
    TITLE_FONT_FAMILY: 'Lexend, sans-serif',
    TITLE_WEIGHT: 700,
    TITLE_SIZE: '1.125rem', // 18px = 1.125rem
    TITLE_COLOR: '#333'
  },
  TEXTFIELD: {
    HEIGHT: '2.5rem', // 40px = 2.5rem
    BORDER_RADIUS: '0.75rem', // 12px = 0.75rem
    BG: '#FFFFFF',
    BORDER_COLOR: '#9AABBC',
    INPUT_PADDING: '0.75rem 1rem', // 12px = 0.75rem, 16px = 1rem
    INPUT_COLOR: '#728197'
  },
  BUTTONS: {
    OUTLINED: {
      COLOR: '#6B7280',
      BORDER_COLOR: '#D1D5DB',
      BORDER_RADIUS: '0.5rem', // 8px = 0.5rem
      PADDING: '0.5rem 1.5rem' // 8px = 0.5rem, 24px = 1.5rem
    },
    CONTAINED: {
      BG: '#4F46E5',
      HOVER_BG: '#4338CA',
      COLOR: '#FFFFFF',
      BORDER_RADIUS: '0.5rem', // 8px = 0.5rem
      PADDING: '0.5rem 1.5rem' // 8px = 0.5rem, 24px = 1.5rem
    }
  }
} as const;

