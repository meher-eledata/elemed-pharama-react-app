export const SUPPLIER_PAYMENT_REPORT_LABELS = {
  PAGE: {
    TITLE: 'Supplier Payment Report',
    SUBTITLE:
      'Payments made to suppliers across the selected period, with outstanding dues as of today.',
    DOWNLOAD_CSV: 'Download CSV',
    CSV_FILENAME_PREFIX: 'supplier_payment_report',
  },
  DISCOVERY_CARD: {
    TITLE: 'Supplier Payment Report',
    DESCRIPTION:
      'Payments log with paid-by-date and paid-by-method breakdowns, plus pending dues per supplier.',
    ACTION: 'View Report',
  },
  TABS: {
    OVERVIEW: 'Overview',
    DETAILED: 'Detailed Table',
  },
  FILTER: {
    SUPPLIER_LABEL: 'Supplier',
    SUPPLIER_ALL: 'All Suppliers',
  },
  KPIS: {
    TOTAL_PAID: 'Total Paid',
    TOTAL_PENDING: 'Total Pending Due',
    PAYMENTS: 'Payments',
    SUPPLIERS: 'Suppliers',
  },
  SECTIONS: {
    PAID_BY_DATE: 'Payments by Date',
    PAID_BY_METHOD: 'Payments by Method',
  },
  CHART_SERIES: {
    PAID: 'Paid (₹)',
  },
  AXIS: {
    DATE: 'Date',
    PAID: 'Amount Paid (₹)',
  },
  TABLE: {
    RECEIPT_NUMBER: 'Receipt #',
    INVOICE_DATE: 'Invoice Date',
    SUPPLIER: 'Supplier',
    TOTAL_BILL: 'Total Bill Amount',
    CGST: 'CGST ₹',
    SGST: 'SGST ₹',
    IGST: 'IGST ₹',
    TOTAL_TAX: 'Total Tax ₹',
    DISCOUNT: 'Discount',
    PAYMENT_DONE: 'Payment Done',
    TRANSACTION_DATE: 'Transaction Date',
    PAYMENT_METHOD: 'Payment Method',
    PENDING_DUE: 'Pending Due',
  },
  EMPTY_TABLE: 'No payments for the selected period.',
  EMPTY_CHART: 'No data for the selected period.',
} as const;

export type SupplierPaymentReportLabels = typeof SUPPLIER_PAYMENT_REPORT_LABELS;
