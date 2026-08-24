export const SUPPLIER_TAX_REPORT_LABELS = {
  PAGE: {
    TITLE: 'Supplier Tax Report',
    SUBTITLE:
      'GST on goods received from suppliers, viewable per receipt or aggregated per supplier.',
    DOWNLOAD_CSV: 'Download CSV',
    CSV_FILENAME_PREFIX: 'supplier_tax_report',
  },
  DISCOVERY_CARD: {
    TITLE: 'Supplier Tax Report',
    DESCRIPTION:
      'Input GST on receipts, toggle between receipt-level and supplier-level aggregation.',
    ACTION: 'View Report',
  },
  TABS: {
    OVERVIEW: 'Overview',
    RECEIPT: 'Receipt-wise',
    SUPPLIER: 'Supplier-wise',
  },
  FILTER: {
    SUPPLIER_LABEL: 'Supplier',
    SUPPLIER_ALL: 'All Suppliers',
  },
  SUMMARY: {
    RECEIPTS: 'Receipts',
    SUPPLIERS: 'Suppliers',
    TOTAL_TAXABLE: 'Total Taxable',
    TOTAL_DISCOUNT: 'Total Discount',
    TOTAL_CGST: 'Total CGST',
    TOTAL_SGST: 'Total SGST',
    TOTAL_IGST: 'Total IGST',
    TOTAL_TAX: 'Total Tax',
    TOTAL_WITH_TAX: 'Total (incl tax)',
  },
  TABLE_RECEIPT: {
    RECEIPT_NUMBER: 'Receipt #',
    RECEIPT_DATE: 'Receipt Date',
    INVOICE_NUMBER: 'Invoice #',
    SUPPLIER: 'Supplier',
    GST: 'GST',
    TAXABLE_VALUE: 'Taxable Value',
    DISCOUNT: 'Discount',
    CGST: 'CGST',
    SGST: 'SGST',
    IGST: 'IGST',
    TOTAL_TAX: 'Total Tax',
    GST_PERCENT: 'GST %',
    RECEIPT_TOTAL: 'Receipt Total',
  },
  TABLE_SUPPLIER: {
    SUPPLIER: 'Supplier',
    GST: 'GST',
    RECEIPTS: 'Receipts',
    TAXABLE_VALUE: 'Taxable Value',
    DISCOUNT: 'Discount',
    CGST: 'CGST',
    SGST: 'SGST',
    IGST: 'IGST',
    TOTAL_TAX: 'Total Tax',
    GST_PERCENT: 'GST %',
    TOTAL_WITH_TAX: 'Total (incl tax)',
  },
  EMPTY_TABLE: 'No supplier tax data for the selected period.',
} as const;

export type SupplierTaxReportLabels = typeof SUPPLIER_TAX_REPORT_LABELS;
