// Copy for the TopBar notification centre (all four notification types).
// `TYPE` / `SEVERITY_COLOR` are open records on purpose: the server registry
// grows without a schema change, so an unrecognised value must fall back rather
// than render `undefined`.
export const NOTIFICATION_LABELS = {
  ARIA_LABEL: 'Notifications',
  TITLE: 'Notifications',
  EMPTY: "You're all caught up",
  EMPTY_HINT: 'Stock and expiry alerts will appear here.',
  ERROR_DEFAULT: 'Could not load notifications.',
  RETRY: 'Retry',
  MARK_ALL_READ: 'Mark all read',
  DISMISS: 'Dismiss',
  ALL_READ: 'All read',
  unread: (count: number): string => `${count} unread`,
  TYPE: {
    NEAR_EXPIRY: 'Near expiry',
    EXPIRED: 'Expired',
    LOW_STOCK: 'Low stock',
    EXCESS_STOCK: 'Excess stock',
  } as Record<string, string>,
  TYPE_FALLBACK: 'Alert',
  // MUI palette paths (theme tokens, not hex) keyed by the SERVER's severity.
  SEVERITY_COLOR: {
    CRITICAL: 'error.main',
    HIGH: 'warning.main',
    MEDIUM: 'info.main',
    LOW: 'text.secondary',
  } as Record<string, string>,
  SEVERITY_COLOR_FALLBACK: 'text.secondary',
} as const;

export const notificationTypeLabel = (type: string): string =>
  NOTIFICATION_LABELS.TYPE[type] ?? NOTIFICATION_LABELS.TYPE_FALLBACK;

export const notificationSeverityColor = (severity: string): string =>
  NOTIFICATION_LABELS.SEVERITY_COLOR[severity] ?? NOTIFICATION_LABELS.SEVERITY_COLOR_FALLBACK;

export type NotificationLabels = typeof NOTIFICATION_LABELS;
