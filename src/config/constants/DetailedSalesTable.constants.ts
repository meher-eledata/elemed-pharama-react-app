export const DETAILED_SALES_TABLE_CONSTANTS = {
  TABLE: {
    CONTAINER_BACKGROUND: '#ffffff',
    CONTAINER_BORDER_RADIUS: '12px',
    CONTAINER_BORDER: '1px solid #E0E0E0',
    HEADER_BACKGROUND: '#F5F5F5',
    HEADER_PADDING: '2px 12px',
    HEADER_FONT_FAMILY: "'Lexend', sans-serif",
    HEADER_FONT_WEIGHT: 500,
    HEADER_FONT_SIZE: '16px',
    HEADER_LINE_HEIGHT: '24px',
    HEADER_COLOR: '#1A212B',
    CELL_PADDING: '8px 12px',
    ROW_BACKGROUND_ODD: '#FFFFFF',
    ROW_BACKGROUND_EVEN: '#FAFAFA',
    CELL_BORDER: 'none',
    HEADER_CELL_BORDER_RIGHT: '1px solid #E0E0E0',
    ROW_BORDER: '1px solid #E0E0E0',
    ROW_HOVER_BACKGROUND: 'rgba(92, 23, 229, 0.05)',
  },
  PAGINATION: {
    ROWS_PER_PAGE: 10,
    DEFAULT_SORT_KEY: 'transactionDate',
    DEFAULT_SORT_DIRECTION: 'desc' as const,
  },
  SCROLLBAR: {
    HEIGHT: '8px',
    TRACK_COLOR: '#f1f1f1',
    TRACK_BORDER_RADIUS: '4px',
    THUMB_COLOR: '#c1c1c1',
    THUMB_BORDER_RADIUS: '4px',
    THUMB_HOVER_COLOR: '#a8a8a8',
  },
} as const;

export type DetailedSalesTableConstants = typeof DETAILED_SALES_TABLE_CONSTANTS;

