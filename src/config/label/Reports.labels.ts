export const REPORTS_LABELS = {
  PAGE_TITLE: 'Reports',
  SUBTITLE: 'Access detailed analytics on system usage, performance metrics, and activity trends.',
  TABS: {
    KPI: 'KPI',
    DETAILED_VIEW: 'Detailed View Reports',
  },
} as const;

export type ReportsLabels = typeof REPORTS_LABELS;

