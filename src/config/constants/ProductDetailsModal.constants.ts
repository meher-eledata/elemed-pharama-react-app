export const PRODUCT_DETAILS_MODAL_CONSTANTS = {
  LAYOUT: {
    HEADER_GAP: 2,
    GRID_SPACING: 2,
    ROW_MARGIN_TOP: 1,
    PAPER_PADDING: 2,
  },
  TYPOGRAPHY: {
    HEADER_VARIANT: 'body1',
    CELL_VARIANT: 'body2',
    HEADER_WEIGHT: 'bold',
  },
  ICONS: {
    COLOR: '#000000',
    EDIT_SIZE: 20,
  },
  SNACKBAR: {
    AUTOHIDE_MS: 3000,
    ANCHOR: { vertical: 'bottom', horizontal: 'right' as const },
  },
} as const;
