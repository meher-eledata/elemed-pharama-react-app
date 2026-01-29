export const DETAILED_SALES_TABLE_CONSTANTS = {
  TABLE: {
    CONTAINER_BACKGROUND: '#ffffff',
    CONTAINER_BORDER_RADIUS: '0.75rem', // 12px = 0.75rem
    CONTAINER_BORDER: '0.0625rem solid #E0E0E0', // 1px = 0.0625rem
    HEADER_BACKGROUND: '#F5F5F5',
    HEADER_PADDING: '0.125rem 0.75rem', // 2px = 0.125rem, 12px = 0.75rem
    HEADER_FONT_FAMILY: "'Lexend', sans-serif",
    HEADER_FONT_WEIGHT: 500,
    HEADER_FONT_SIZE: '1rem', // 16px = 1rem
    HEADER_LINE_HEIGHT: '1.5rem', // 24px = 1.5rem
    HEADER_COLOR: '#1A212B',
    CELL_PADDING: '0.5rem 0.75rem', // 8px = 0.5rem, 12px = 0.75rem
    ROW_BACKGROUND_ODD: '#FFFFFF',
    ROW_BACKGROUND_EVEN: '#FAFAFA',
    CELL_BORDER: 'none',
    HEADER_CELL_BORDER_RIGHT: '0.0625rem solid #E0E0E0', // 1px = 0.0625rem
    ROW_BORDER: '0.0625rem solid #E0E0E0', // 1px = 0.0625rem
    ROW_HOVER_BACKGROUND: 'rgba(92, 23, 229, 0.05)',
  },
  PAGINATION: {
    ROWS_PER_PAGE: 6,
    DEFAULT_SORT_KEY: 'transactionDate',
    DEFAULT_SORT_DIRECTION: 'desc' as const,
  },
  SCROLLBAR: {
    HEIGHT: '0.5rem', // 8px = 0.5rem
    TRACK_COLOR: '#f1f1f1',
    TRACK_BORDER_RADIUS: '0.25rem', // 4px = 0.25rem
    THUMB_COLOR: '#c1c1c1',
    THUMB_BORDER_RADIUS: '0.25rem', // 4px = 0.25rem
    THUMB_HOVER_COLOR: '#a8a8a8',
  },
} as const;

export type DetailedSalesTableConstants = typeof DETAILED_SALES_TABLE_CONSTANTS;

