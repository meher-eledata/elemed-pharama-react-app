export const SUPPLIER_REPORTS_LABELS = {
  OVERVIEW: {
    TITLE: 'Supplier Reports',
    SUBTITLE:
      'Track supplier spend, outstanding payments, delivery performance and sourcing across the selected period.',
    DOWNLOAD_CSV: 'Download CSV',
    KPIS: {
      TOTAL_SPEND: 'Total Spend',
      TOTAL_OUTSTANDING: 'Total Outstanding',
      PURCHASE_ORDERS: 'Purchase Orders',
      ACTIVE_SUPPLIERS: 'Active Suppliers',
      AVG_LEAD_TIME: 'Avg Lead Time',
    },
    FILTERS: {
      PAYMENT_STATUS: 'Payment Status',
      PO_STATUS: 'PO Status',
      ALL: 'All',
    },
    SECTIONS: {
      SPEND_TREND: 'Spend Trend',
      RANKED_SUPPLIERS: 'Suppliers by Spend',
    },
    TABLE: {
      SUPPLIER_NAME: 'Supplier',
      SPEND: 'Spend (₹)',
      ORDER_COUNT: 'Orders',
      AMOUNT_DUE: 'Amount Due (₹)',
      AVG_LEAD_TIME: 'Avg Lead Time (days)',
      LAST_ORDER_DATE: 'Last Order',
    },
    EMPTY_SUPPLIERS: 'No supplier activity for the selected period.',
    EMPTY_TREND: 'No spend data for the selected period.',
  },
  DETAIL: {
    BACK: 'Back to Supplier Reports',
    DOWNLOAD_PDF: 'Download PDF',
    DOWNLOAD_CSV: 'Download CSV',
    SUPPLIER_CODE: 'Code',
    CONTACT: 'Contact',
    GST: 'GSTIN',
    SECTIONS: {
      SPEND_PAYMENTS: 'Spend & Payments',
      DELIVERY: 'Delivery Performance',
      TAX_SUMMARY: 'GST / Tax Summary',
      PRODUCT_SOURCING: 'Product Sourcing',
      PO_HISTORY: 'Purchase Order History',
    },
    SPEND_PAYMENTS: {
      TOTAL_SPEND: 'Total Spend',
      PAID: 'Paid',
      OUTSTANDING: 'Outstanding',
      OVERDUE: 'Overdue',
      CREDIT_BALANCE: 'Credit Balance',
    },
    DELIVERY: {
      AVG_LEAD_TIME: 'Avg Lead Time',
      MIN_LEAD_TIME: 'Min Lead Time',
      MAX_LEAD_TIME: 'Max Lead Time',
      PENDING_POS: 'Pending POs',
      OVERDUE_POS: 'Overdue POs',
      DAYS_SUFFIX: 'days',
    },
    TAX: {
      CGST: 'CGST',
      SGST: 'SGST',
      IGST: 'IGST',
      TOTAL_TAX: 'Total Tax',
    },
    PRODUCT_TABLE: {
      PRODUCT_NAME: 'Product',
      TOTAL_QTY: 'Total Qty',
      TOTAL_VALUE: 'Total Value (₹)',
    },
    PO_TABLE: {
      PO_NUMBER: 'PO Number',
      ORDERED_DATE: 'Ordered Date',
      STATUS: 'Status',
      TOTAL_AMOUNT: 'Total (₹)',
      AMOUNT_PAID: 'Paid (₹)',
      AMOUNT_DUE: 'Due (₹)',
      PAYMENT_STATUS: 'Payment',
      LEAD_TIME_DAYS: 'Lead Time (days)',
    },
    EMPTY_PRODUCTS: 'No product sourcing data for the selected period.',
    EMPTY_PO_HISTORY: 'No purchase orders for the selected period.',
    NOT_AVAILABLE: 'N/A',
  },
  DISCOVERY_CARD: {
    TITLE: 'Supplier Reports',
    DESCRIPTION:
      'Analyse supplier spend, outstanding dues, lead times and sourcing, with a doctor-shareable PDF per supplier',
    ACTION: 'View Report',
  },
  STATES: {
    LOADING: 'Loading supplier report…',
    ERROR: 'Failed to load supplier report data. Please try again later.',
    RETRY: 'Retry',
  },
} as const;

export type SupplierReportsLabels = typeof SUPPLIER_REPORTS_LABELS;
