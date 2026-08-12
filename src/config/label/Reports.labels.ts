export const REPORTS_LABELS = {
  PAGE_TITLE: 'Reports',
  SUBTITLE: 'Access detailed analytics on system usage, performance metrics, and activity trends.',
  TABS: {
    KPI: 'KPI',
    DETAILED_VIEW: 'Detailed View Reports',
  },
  DAILY_SALES_REPORT: {
    TITLE: 'Sales Report',
    METRICS: {
      TOTAL_BILLS: 'Total Bills',
      TOTAL_SALES: 'Total Sales',
      TOTAL_DISCOUNT: 'Total Discount',
      CASH_IN_HAND: 'Cash in Hand',
    },
    SECTIONS: {
      SALES_BREAKDOWN: 'Sales Breakdown',
      SALES_BY_PAYMENT_TYPE: 'Sales by Payment Type',
      TAX_SUMMARY: 'Tax Summary',
      WEEKLY_SALES_TREND: 'Weekly Sales Trend',
    },
    SALES: {
      CASH_SALES: 'Cash Sales',
      OTHER_SALES: 'Other Sales',
      CARD_SALES: 'Card Sales',
      UPI_SALES: 'UPI Sales',
      INSURANCE_SALES: 'Insurance Sales',
      FROM_BILLS: 'from',
    },
    TAX: {
      CGST: 'CGST',
      SGST: 'SGST',
      IGST: 'IGST',
      TOTAL_TAX_COLLECTED: 'Total Tax Collected',
    },
    LINK: {
      VIEW_DETAILED_SALES_TABLE: 'View Detailed Sales Table',
    },
  },
} as const;

export type ReportsLabels = typeof REPORTS_LABELS;

