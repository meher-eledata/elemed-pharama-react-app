export const REPORTS_LABELS = {
  PAGE_TITLE: 'Reports',
  SUBTITLE: 'Access detailed analytics on system usage, performance metrics, and activity trends.',
  TABS: {
    KPIS: "KPI's",
    DETAILED_REPORTS: 'Detailed Reports',
  },
  CARD_ACTION: 'View Report',
  DAILY_SALES_REPORT: {
    TITLE: 'Sales Report',
    SUBTITLE: 'Sales, payment methods, taxes and trends for the selected period.',
    DOWNLOAD_CSV: 'Download CSV',
    DISCOVERY_CARD: {
      TITLE: 'Sales Report',
      DESCRIPTION: 'View detailed sales information including payment methods, taxes, and trends.',
    },
    TABS: {
      OVERVIEW: 'Overview',
      INVOICE: 'Invoice-wise',
    },
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
      SALES_BY_DATE: 'Sales by Date',
    },
    CHART: {
      SERIES_SALES: 'Sales (₹)',
      AXIS_DATE: 'Date',
      EMPTY: 'No data for the selected period.',
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
  },
} as const;

export type ReportsLabels = typeof REPORTS_LABELS;

