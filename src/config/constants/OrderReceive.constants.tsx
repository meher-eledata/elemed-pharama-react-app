export const ADD_BUTTON_COLOR = "#7B2CBF";

export const ADD_BUTTON_HOVER_COLOR = "#5A189A";

export const TAB_INDICATOR_STYLE = { backgroundColor: "#000", display: "none" };

export const ORDER_RECEIVE_CONSTANTS = {
  TABS: {
    CONTAINER_BG: '#eef4ff',
    BORDER_RADIUS: '16px',
    PADDING: '6px',
    GAP: '1px',
    BUTTON_WIDTH: '8.5rem',
    BUTTON_HEIGHT: '2.35rem',
    ACTIVE_BG: '#ffffff',
    INACTIVE_BG: 'transparent',
    HOVER_PRIMARY: '#1976d2',
    ACTIVE_RADIUS: '0.5rem',
  },
  ICONS: {
    DEFAULT_COLOR:'#2d2a2aff',
    MUTED_COLOR: '#666',
    RECEIPT_VIEW_SIZE: 18,
  },
  TABLE: {
    ROWS_PER_PAGE: 4,
    ACTION_GAP: 1.5,
     ICONS_GAP: 5,
  },
  SNACKBAR: {
    AUTOHIDE_MS: 3000,
    ANCHOR: { vertical: 'bottom', horizontal: 'right' as const },
  },
} as const;