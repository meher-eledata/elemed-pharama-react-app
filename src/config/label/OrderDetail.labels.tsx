export const orderLabels = {
  // Main title
  orderDetails: 'Order Details',

  // Form field labels
  supplierName: 'Supplier Name',
  poNumber: 'PO Number (Optional)',
  invoiceDate: 'Invoice Date',
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
};