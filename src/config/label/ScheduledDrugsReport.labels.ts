export const SCHEDULED_DRUGS_REPORT_LABELS = {
  PAGE: {
    TITLE: 'Scheduled Drugs Compliance Report',
    SUBTITLE:
      'Statutory register of scheduled (controlled) drugs: dispensing, receipts and stock balances in units for the selected period.',
    DOWNLOAD_CSV: 'Download CSV',
    CSV_FILENAME_PREFIX: 'scheduled_drugs_report',
    DOWNLOAD_LOG_NAME: 'Scheduled Drugs Compliance Report',
  },
  DISCOVERY_CARD: {
    TITLE: 'Scheduled Drugs Compliance Report',
    DESCRIPTION:
      'Dispensing and receipt registers plus opening/closing balances for Schedule G, H, H1, X, C, C1 and K drugs.',
  },
  TABS: {
    DISPENSING: 'Dispensing Register',
    RECEIPTS: 'Receipts',
    BALANCES: 'Balances',
  },
  FILTER: {
    SCHEDULE_LABEL: 'Schedule',
    SCHEDULE_ALL: 'All Schedules',
    PRODUCT_LABEL: 'Product',
    PRODUCT_ALL: 'All Products',
  },
  SUMMARY: {
    TOTAL_DISPENSED: 'Total Dispensed (units)',
    TOTAL_SALES_RETURNED: 'Sales Returned (units)',
    TOTAL_RECEIVED: 'Total Received (units)',
    TOTAL_SUPPLIER_RETURNED: 'Returned to Supplier (units)',
    SCHEDULED_PRODUCTS: 'Scheduled Products',
  },
  /** Rendered with the count substituted for {count}. */
  UNATTRIBUTED_WARNING:
    '{count} product(s) with stock movement in this period have no schedule attributed and are missing from this register. Assign a schedule in Master > Products before treating this register as complete.',
  ENTRY_TYPE: {
    SALE: 'Sale',
    SALES_RETURN: 'Sales Return',
    RECEIPT: 'Receipt',
    SUPPLIER_RETURN: 'Supplier Return',
  },
  RESTOCK_ACTION: {
    RESTOCK: 'Restocked',
    SCRAP: 'Scrapped',
    QUARANTINE: 'Quarantined',
  },
  TABLE: {
    DATE: 'Date',
    TYPE: 'Type',
    DOC_NUMBER: 'Invoice / Doc #',
    RECEIPT_DOC_NUMBER: 'Doc #',
    PATIENT: 'Patient',
    ADDRESS: 'Address',
    DOCTOR: 'Doctor',
    SUPPLIER: 'Supplier',
    DRUG: 'Drug',
    CODE: 'Code',
    SCHEDULE: 'Schedule',
    BATCH: 'Batch #',
    QTY: 'Qty (units)',
    DIRECTION: 'In / Out',
    OPENING: 'Opening',
    IN: 'In',
    OUT: 'Out',
    CLOSING: 'Closing',
  },
  EMPTY: {
    DISPENSING: 'No scheduled-drug dispensing for the selected period.',
    RECEIPTS: 'No scheduled-drug receipts for the selected period.',
    BALANCES: 'No scheduled products match the selected filters.',
  },
} as const;

export type ScheduledDrugsReportLabels = typeof SCHEDULED_DRUGS_REPORT_LABELS;
