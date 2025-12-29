export const DETAILED_SALES_TABLE_LABELS = {
  PAGE_TITLE: 'Detailed sales table',
  SEARCH_PLACEHOLDER: 'Search by customer name, invoice number, or payment type...',
  TABLE: {
    TRANSACTION_DATE: 'Transaction date',
    INVOICE_NUMBER: 'Invoice #',
    CUSTOMER_NAME: 'Customer name',
    PAYMENT_TYPE: 'Payment type',
    SALE_AMOUNT: 'Sale amount (₹)',
    DISCOUNT: 'Discount (₹)',
    CGST: 'CGST (₹)',
    GST: 'GST (₹)',
    IGST: 'IGST (₹)',
    TOTAL_AMOUNT: 'Total amount (₹)',
    PATIENT_TYPE: 'Patient type',
  },
} as const;

export type DetailedSalesTableLabels = typeof DETAILED_SALES_TABLE_LABELS;

