export const NOTIFICATION_LABELS = {
  ARIA_LABEL: 'Notifications',
  TITLE: 'Near-expiry alerts',
  EMPTY: 'No alerts',
  // Builds "Expires in {n} day(s)" (or "Expires today" when n === 0).
  expiresIn: (days: number): string =>
    days <= 0 ? 'Expires today' : `Expires in ${days} day${days === 1 ? '' : 's'}`,
  SEVERITY_COLOR: {
    '1month': '#DC2626', // red — <= 30 days
    '3month': '#D97706', // amber — 31-90 days
  },
} as const;

export type NotificationLabels = typeof NOTIFICATION_LABELS;
