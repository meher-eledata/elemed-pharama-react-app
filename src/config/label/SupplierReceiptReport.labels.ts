export const SUPPLIER_RECEIPT_REPORT_LABELS = {
  PAGE: {
    TITLE: 'Supplier Receipt Report',
    SUBTITLE:
      'Products received from suppliers across the selected period, with spend and quantity trends.',
    DOWNLOAD_CSV: 'Download CSV',
    CSV_FILENAME_PREFIX: 'supplier_receipt_report',
  },
  DISCOVERY_CARD: {
    TITLE: 'Supplier Receipt Report',
    DESCRIPTION:
      'Products received per receipt-line, with spend / quantity trends and top products by value.',
    ACTION: 'View Report',
  },
  TABS: {
    OVERVIEW: 'Overview',
    BY_RECEIPT: 'By Receipt',
    DETAILED: 'Detailed Table',
  },
  FILTER: {
    SUPPLIER_LABEL: 'Supplier',
    SUPPLIER_ALL: 'All Suppliers',
  },
  KPIS: {
    TOTAL_SPEND: 'Total Spend',
    TOTAL_QTY: 'Total Qty Received',
    RECEIPTS: 'Receipts',
    PRODUCTS: 'Products',
    SUPPLIERS: 'Suppliers',
  },
  SECTIONS: {
    SPEND_BY_DATE: 'Spend by Date',
    QTY_BY_DATE: 'Qty Received by Date',
    TOP_SUPPLIERS: 'Top Supplier by Value',
    TOP_PRODUCTS: 'Top Product by Value',
  },
  CHART_SERIES: {
    SPEND: 'Spend (₹)',
    QTY: 'Qty',
    VALUE: 'Value (₹)',
  },
  AXIS: {
    DATE: 'Date',
    SPEND: 'Spend (₹)',
    QTY: 'Qty',
    SUPPLIER: 'Supplier',
    PRODUCT: 'Product',
    VALUE: 'Value (₹)',
  },
  TABLE: {
    RECEIPT_NUMBER: 'Receipt #',
    RECEIPT_DATE: 'Receipt Date',
    INVOICE_NUMBER: 'Invoice #',
    PO_NUMBER: 'PO Number',
    SUPPLIER: 'Supplier',
    GSTIN: 'GSTIN',
    PRODUCT: 'Product',
    PRODUCT_CODE: 'Product Code',
    HSN: 'HSN',
    MRP: 'MRP',
    PURCHASE_PRICE: 'Purchase Price',
    RECEIVED_QTY: 'Received Qty',
    CGST: 'CGST ₹',
    SGST: 'SGST ₹',
    IGST: 'IGST ₹',
    TOTAL_TAX: 'Total Tax ₹',
    // Per-line PERCENT (pol.discount) — distinct from TABLE_BY_RECEIPT.DISCOUNT_AMOUNT (rupees).
    DISCOUNT: 'Discount (%)',
    TOTAL_VALUE: 'Total Value',
  },
  TABLE_BY_RECEIPT: {
    RECEIPT_NUMBER: 'Receipt #',
    RECEIPT_DATE: 'Receipt Date',
    INVOICE_NUMBER: 'Invoice #',
    PO_NUMBER: 'PO Number',
    SUPPLIER: 'Supplier',
    GSTIN: 'GSTIN',
    LINES: 'Lines',
    PRODUCTS: 'Products',
    QTY: 'Qty',
    CGST: 'CGST ₹',
    SGST: 'SGST ₹',
    IGST: 'IGST ₹',
    TOTAL_TAX: 'Total Tax ₹',
    // Rupee AMOUNT — never a percent (contrast TABLE.DISCOUNT).
    DISCOUNT_AMOUNT: 'Discount (₹)',
    TOTAL_VALUE: 'Total Value',
  },
  EMPTY_TABLE: 'No receipts for the selected period.',
  EMPTY_CHART: 'No data for the selected period.',
} as const;

export type SupplierReceiptReportLabels = typeof SUPPLIER_RECEIPT_REPORT_LABELS;
