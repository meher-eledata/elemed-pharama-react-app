// Mandatory receive-line fields, named after the line-items table's column headers.
const MANDATORY_LINE_FIELDS = 'Batch, Expiry, Package Info, Received Packs, Purchase Price, MRP';
const forProduct = (productName: string) => (productName ? ` for "${productName}"` : '');

export const orderLabels = {
  // Main title
  orderDetails: 'Order Details',

  // Form field labels
  supplierName: 'Supplier Name',
  poNumber: 'PO Number (Optional)',
  invoiceDate: 'Invoice Date',
  receiptDate: 'Receipt Date',
  invoiceAttachment: 'Invoice Attachment',
  paymentMethod: 'Payment method',
  paymentVendor: 'Payment vendor',
  transactionNumber: 'Transaction Number',
  findProduct: 'Find product',

  // Placeholders
  enterSupplierName: 'Enter supplier name ',
  enterPoNumber: 'Enter PO number (Optional)',
  enterBatchNumber: 'Enter batch number',
  searchByProductName: 'Search by product name',
  dateFormat: 'DD/MM/YYYY',
  selectBankVendor: 'Select bank / vendor',
  search: 'Search',

  // Table headers
  productName: 'Product name',
  type: 'Type',
  batchNumber: 'Batch Number',
  receivedQty: 'Received Packs',
  freeQty: 'Free Packs',
  expiryDate: 'Expiry date',
  purchasePrice: 'Purchase Price',
  cgst: 'CGST',
  sgst: 'SGST',
  igst: 'IGST',
  discount: 'Discount',
  mrp: 'MRP',
  sellingPrice: 'Selling Price',
  packageQty: 'Package Info',
  actions: 'Actions',

  // Buttons
  cancelButton: 'Cancel',
  cancel: 'Cancel',
  saveButton: 'Save',
  saveReceipt: 'Save Receipt',
  updateReceipt: 'Update Receipt',
  deleteReceipt: 'Delete Receipt',
  proceedToPayment: 'Proceed to Payment',

  // Table data
  noDataAvailable: 'No data available',

  // Add product option
  addProducts: 'Add Products...',
  addNewSupplier: 'Add New Supplier',

  // Submit feedback — the goods-receipt (GRN) number the server issued is named as soon as
  // it comes back, so the user can quote it without opening the receipt again.
  receiptSubmitted: 'Receipt submitted successfully!',
  receiptSubmittedWithNumber: (receiptNumber: string) =>
    `Receipt ${receiptNumber} submitted successfully!`,

  // Line validation (row save and receipt save).
  mandatoryFieldsForItem: `Please fill all mandatory fields (${MANDATORY_LINE_FIELDS}) before saving the item.`,
  mandatoryFieldsForReceipt: (productName: string) =>
    `Please complete all mandatory fields${forProduct(productName) || ' for all products'} (${MANDATORY_LINE_FIELDS})`,
  sellingPriceAboveMrp: (productName: string) =>
    `Selling Price cannot be more than MRP${forProduct(productName)}`,
  sellingPriceNegative: (productName: string) =>
    `Selling Price cannot be negative${forProduct(productName)}`,
};