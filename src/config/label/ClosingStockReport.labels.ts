const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const CLOSING_STOCK_REPORT_LABELS = {
  PAGE: {
    TITLE: 'Closing Stock Report',
    SUBTITLE:
      'Stock on hand at the end of the selected date, by product or by batch, valued at purchase cost and MRP.',
    DOWNLOAD_CSV: 'Download CSV',
    CSV_FILENAME_PREFIX: 'closing_stock_report',
    CSV_FILENAME_BATCH_PREFIX: 'closing_stock_report_batchwise',
    MRP_NOTE: "MRP values use each batch's current MRP; past MRP changes are not reflected.",
  },
  DISCOVERY_CARD: {
    TITLE: 'Closing Stock Report',
    DESCRIPTION:
      'Closing stock by product or batch as of any date, valued at cost (excl. and incl. GST) and MRP.',
    ACTION: 'View Report',
  },
  VIEW: {
    ARIA: 'Table view',
    PRODUCT: 'Product-wise',
    BATCH: 'Batch-wise',
  },
  DOWNLOAD_MENU: {
    PRODUCT: 'Product-wise CSV',
    PRODUCT_HINT: 'One row per product',
    BATCH: 'Batch-wise CSV',
    BATCH_HINT: 'One row per batch',
  },
  LOG_NAME: {
    PRODUCT: 'Closing Stock Report',
    BATCH: 'Closing Stock Report (Batch-wise)',
  },
  FILTER: {
    AS_OF_DATE_LABEL: 'As of Date',
    BRAND_LABEL: 'Brand',
    BRAND_ALL: 'All Brands',
    SEARCH_LABEL: 'Search',
    SEARCH_PLACEHOLDER: 'Product name or code',
    ZERO_STOCK_LABEL: 'Zero Stock',
    ZERO_STOCK_SWITCH: 'Include',
    ZERO_STOCK_ARIA: 'Include zero stock products',
  },
  SUMMARY: {
    PRODUCTS: 'Products',
    BATCHES: 'Batches',
    TOTAL_QTY: 'Total Qty (units)',
    VALUE_COST_EX_GST: 'Value @ Cost excl. GST',
    VALUE_COST_INC_GST: 'Value @ Cost incl. GST',
    VALUE_MRP: 'Value @ MRP',
  },
  TABLE: {
    BRAND: 'Brand',
    PRODUCT: 'Product',
    PRODUCT_CODE: 'Product Code',
    BATCH: 'Batch',
    EXPIRY: 'Expiry',
    EXPIRED: 'Expired',
    QTY: 'Qty (units)',
    UNIT_COST_EX_GST: 'Unit Cost excl. GST',
    UNIT_COST_INC_GST: 'Unit Cost incl. GST',
    UNIT_COST_HEADER: 'Unit Cost',
    MRP_PER_UNIT: 'MRP per Unit',
    COST_BASIS: 'Cost Basis',
    YES: 'Yes',
    NO: 'No',
    VALUE_COST_EX_GST: 'Value @ Cost excl. GST',
    VALUE_COST_INC_GST: 'Value @ Cost incl. GST',
    VALUE_MRP: 'Value @ MRP',
    CSV_CURRENCY_SUFFIX: ' (₹)',
    TOTAL: 'Total',
    EMPTY_VALUE: '—',
    ESTIMATED_MARKER: 'est.',
    PARTIAL_MARKER: 'partial',
    VALUE_COST_HEADER: 'Value @ Cost',
    EX_GST_HEADER: 'excl. GST',
    INC_GST_HEADER: 'incl. GST',
  },
  TOOLTIP: {
    COST_MISSING: 'No purchase cost on record',
    COST_ESTIMATED: "Estimated from this product's average purchase cost",
    MRP_MISSING: 'No MRP on record',
    MRP_PARTIAL: 'Partial: some batches of this product have no MRP',
    NEGATIVE_QTY: 'Negative stock: more units went out than were recorded coming in by this date',
    NEGATIVE_BATCHES: 'One or more batches of this product are negative as of this date',
    EXPIRY_MISSING: 'No expiry on record',
    EXPIRED: 'Expired before the selected date',
  },
  WARNINGS: {
    TITLE: 'Data quality notes for this date',
    UNCOSTED: (n: number, qty: string) =>
      `${plural(n, 'product has', 'products have')} no purchase cost on record (${qty} units); excluded from cost totals.`,
    UNPRICED_MRP: (n: number) =>
      `${plural(n, 'product has', 'products have')} no MRP on record; excluded from the MRP total.`,
    NEGATIVE_BATCHES: (n: number) =>
      `${plural(n, 'batch has', 'batches have')} negative stock as of this date.`,
    AMBIGUOUS: (n: number) =>
      `${plural(n, 'later stock movement was', 'later stock movements were')} matched to a product by a batch number shared by several products.`,
    UNATTRIBUTED: (n: number) =>
      `${plural(n, 'later stock movement', 'later stock movements')} could not be matched to any product and ${n === 1 ? 'was' : 'were'} left out.`,
    RECEIPT_LINE_DELETIONS: (n: number) =>
      `${plural(n, 'receipt line was', 'receipt lines were')} deleted after this date. ${n === 1 ? 'Its' : 'Their'} stock is counted only if the line already existed by this date (partly inferred), so affected quantities may be approximate.`,
    UNKNOWN_TYPE: (n: number) =>
      `${plural(n, 'later stock movement', 'later stock movements')} of an unrecognised type ${n === 1 ? 'was' : 'were'} ignored.`,
  },
  DATE_ERRORS: {
    INVALID: 'Enter a valid date (DD/MM/YYYY) from 01/01/2000 onwards.',
    FUTURE: 'The date cannot be later than today.',
  },
  SCROLL_HINT: 'Scroll sideways to see all columns',
  EMPTY_TABLE: 'No stock found for the selected date and filters.',
  EMPTY_BATCHES: 'The matching products have never been stocked, so there are no batches to show.',
} as const;

export type ClosingStockReportLabels = typeof CLOSING_STOCK_REPORT_LABELS;
