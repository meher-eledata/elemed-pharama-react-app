export const PRODUCT_SALES_REPORT_LABELS = {
  PAGE: {
    TITLE: 'Product Sales Report',
    SUBTITLE:
      'Gross product-level sales (one row per sale line) across the selected period. Returns are not subtracted.',
    DOWNLOAD_CSV: 'Download CSV',
    CSV_FILENAME_PREFIX: 'product_sales_report',
  },
  DISCOVERY_CARD: {
    TITLE: 'Product Sales Report',
    DESCRIPTION:
      'Line-level gross sales per product with quantity, discount, GST and line totals.',
    ACTION: 'View Report',
  },
  FILTER: {
    PRODUCT_LABEL: 'Product',
    PRODUCT_ALL: 'All Products',
    PATIENT_TYPE_LABEL: 'Patient Type',
    PATIENT_TYPE_ALL: 'All Patient Types',
    PATIENT_TYPE_INPATIENT: 'In Patient',
    PATIENT_TYPE_OUTPATIENT: 'Out Patient',
  },
  SUMMARY: {
    LINES: 'Lines',
    TOTAL_QTY: 'Total Qty',
    TOTAL_SALES: 'Total Sales',
    TOTAL_CGST: 'Total CGST',
    TOTAL_SGST: 'Total SGST',
    TOTAL_IGST: 'Total IGST',
    TOTAL_TAX: 'Total Tax',
    PRODUCTS: 'Products',
    INVOICES: 'Invoices',
  },
  TABLE: {
    INVOICE_NUMBER: 'Invoice #',
    SALE_DATE: 'Sale Date',
    PRODUCT: 'Product',
    PRODUCT_CODE: 'Product Code',
    HSN: 'HSN',
    BATCH_NUMBER: 'Batch #',
    PATIENT_TYPE: 'Patient Type',
    CUSTOMER: 'Customer',
    QTY: 'Qty',
    MRP: 'Unit MRP',
    SP: 'SP',
    TOTAL: 'Total',
    DISCOUNT_PCT: 'Discount %',
    DISCOUNT_AMT: 'Discount ₹',
    CGST_AMT: 'CGST ₹',
    SGST_AMT: 'SGST ₹',
    IGST_AMT: 'IGST ₹',
    TOTAL_TAX: 'Total Tax ₹',
    LINE_TOTAL: 'Line Total',
  },
  EMPTY_TABLE: 'No product sales for the selected period.',
} as const;

export type ProductSalesReportLabels = typeof PRODUCT_SALES_REPORT_LABELS;
