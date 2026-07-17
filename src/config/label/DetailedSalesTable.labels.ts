export const DETAILED_SALES_TABLE_LABELS = {
  PAGE_TITLE: 'Detailed sales table',
  SEARCH_PLACEHOLDER: 'Search by customer, invoice #, payment, patient, or transaction type',
  TABLE: {
    TRANSACTION_DATE: 'Transaction date',
    TRANSACTION_TYPE: 'Transaction type',
    INVOICE_NUMBER: 'Invoice #',
    CUSTOMER_NAME: 'Customer name',
    CUSTOMER_DETAILS: 'Customer Details',
    PAYMENT_TYPE: 'Payment type',
    SALE_AMOUNT: 'Amount (₹)',
    DISCOUNT: 'Discount (₹)',
    CGST: 'CGST (₹)',
    SGST: 'SGST (₹)',
    IGST: 'IGST (₹)',
    TOTAL_AMOUNT: 'Total amount (₹)',
    PATIENT_TYPE: 'Patient type',
  },
} as const;

export type DetailedSalesTableLabels = typeof DETAILED_SALES_TABLE_LABELS;

