export const AUDIT_LOG_LABELS = {
  PAGE_TITLE: 'Activity Log',
  SUBTITLE: 'Track critical events across all access levels.',
  SEARCH_PLACEHOLDER: 'Search by User Name',
  BACK_BUTTON: 'Back',
  FILTERS: {
    USERNAME: 'Username',
    ACCESS_LEVEL: 'Role',
    MODULE: 'Module',
    EVENT_TYPE: 'Event Type',
    DATE_RANGE: 'Date Range',
    ALL: 'All',
    RESET: 'Reset filters',
  },
  TABLE: {
    TIME: 'Time (IST)',
    MODULE: 'Module',
    EVENT_TYPE: 'Event Type',
    RELATED_ID: 'Related ID',
    QUANTITY_CHANGED: 'Quantity Change',
    DETAILS: 'Details',
    USERNAME: 'Username',
    ROLE: 'Role',
    IP_ADDRESS: 'IP Address',
  },
  MESSAGES: {
    LOADING: 'Loading activity log...',
    ERROR: 'Failed to load activity log. Please try again.',
  },
  DIALOG: {
    EVENT_DETAILS_TITLE: 'Event Details',
    CLOSE_BUTTON: 'Close',
  },
} as const;

export type AuditLogLabels = typeof AUDIT_LOG_LABELS;

