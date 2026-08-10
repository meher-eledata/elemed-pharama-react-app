export const SALES_RECEIPT_LABELS = {
  // Page Title
  PAGE_TITLE: "Sale details",

  // Section Titles
  CUSTOMER_DETAILS_TITLE: "Customer details",
  DOCTOR_DETAILS_TITLE: "Doctor details",
  PAYMENT_DETAILS_TITLE: "Payment details",
  INVOICE_DETAILS_TITLE: "Invoice details",

  // Customer Details
  CUSTOMER_NAME_LABEL: "customer name",
  CUSTOMER_NAME_PLACEHOLDER: "Search by name",
  MOBILE_NUMBER_LABEL: "mobile number",
  MOBILE_NUMBER_PLACEHOLDER: "mobile number",
  CITY_LABEL: "City",
  CITY_PLACEHOLDER: "City",
  CUSTOMER_DETAILS_FIELD_LABEL: "Details",
  CUSTOMER_DETAILS_FIELD_PLACEHOLDER: "Details",
  ADD_NEW_CUSTOMER_BUTTON: "Add new customer",

  // Doctor Details
  DOCTOR_NAME_LABEL: "Doctor name",
  DOCTOR_NAME_PLACEHOLDER: "Select doctor",
  EMAIL_LABEL: "email id",
  EMAIL_PLACEHOLDER: "email id",

  // Payment Details
  PAYMENT_MODE_PLACEHOLDER: "Cash",
  INSURANCE_COMPANY_LABEL: "Insurance company",
  INSURANCE_COMPANY_PLACEHOLDER: "Insurance company",
  DETAILS_LABEL: "Details",
  DETAILS_PLACEHOLDER: "Enter comments (optional)",
  INVOICE_NUMBER_LABEL: "Invoice number",
  INVOICE_DATE_LABEL: "Invoice date",

  // Table Headers
  TABLE_HEADER_PRODUCT: "Product",
  TABLE_HEADER_QUANTITY: "Units",
  TABLE_HEADER_TYPE: "Unit",
  TABLE_HEADER_DOSAGE_TYPE: "Type",
  TABLE_HEADER_BATCH: "Batch",
  TABLE_HEADER_SCHEDULE: "Schedule",
  TABLE_HEADER_UNIT_PRICE: "Unit price",
  TABLE_HEADER_DISC: "Disc (%)",
  TABLE_HEADER_CGST: "CGST",
  TABLE_HEADER_SGST: "SGST",
  TABLE_HEADER_IGST: "IGST",
  TABLE_HEADER_AMOUNT: "Amount (₹)",
  TABLE_HEADER_ACTIONS: "Actions",

  // Empty State
  NO_SALES_ITEMS: "No sales items found",

  // Actions
  EDIT_CART_BUTTON: "Add product to cart",
  APPLY_GST_TO_ALL_LABEL: "Apply same % to all products",
  APPLY_GST_TO_ALL_TOOLTIP: "Check this to instantly copy the first row's GST percentages to all products. Any further changes will also apply to all.",

  // Financial Summary
  TOTAL_VALUE_LABEL: "Total value (Rs)",
  TOTAL_DISCOUNT_LABEL: "Total Discount (Rs)",
  TAX_AMOUNT_LABEL: "Tax amount (Rs)",
  TOTAL_PAYABLE_LABEL: "Total payable amount (Rs)",

  // Action Buttons
  SAVE_BUTTON: "Save",
  SAVE_DRAFT_BUTTON: "Save draft",
  CANCEL_BUTTON: "Cancel",
  PRINT_BUTTON: "Save and Print",
  PRINT_ONLY_BUTTON: "Print",

  // Print Options
  // Printed org header line prefixes
  ORG_DL_PREFIX: "DL No: ",
  ORG_GSTIN_PREFIX: "GSTIN No: ",
  ORG_PHONE_PREFIX: "(M): ",

  ORIENTATION_LABEL: "Orientation:",
  ORIENTATION_LANDSCAPE: "Landscape",
  ORIENTATION_PORTRAIT: "Portrait",
  PRINT_DIALOG_PAPER_HINT: "In the browser print dialog, set Paper size to {size}. Orientation is applied automatically.",

  // Print Preview
  PRINT_PREVIEW_TITLE: "Print Preview - Sales Receipt",
  CUSTOMER_RECEIPT_TITLE: "Customer receipt",
  ITEMS_SECTION_TITLE: "Items",
  GENERATED_ON: "Generated on: {date}",

  // Print Preview Details
  CUSTOMER_NAME_PRINT: "Customer name : {name}",
  MOBILE_NUMBER_PRINT: "Mobile number : {mobile}",
  CITY_PRINT: "City : {city}",
  DOCTOR_NAME_PRINT: "Doctor name : {name}",
  EMAIL_PRINT: "Email id : {email}",
  PAYMENT_MODE_PRINT: "Payment mode : {mode}",
  INSURANCE_PRINT: "Insurance company : {company}",
  DETAILS_PRINT: "Details : {details}",
  INVOICE_NUMBER_PRINT: "Invoice number : {number}",
  INVOICE_DATE_PRINT: "Invoice date : {date}",

  // Confirmation Dialog
  CONFIRM_SALE_TITLE: "Confirm sale & update inventory",
  CONFIRM_SALE_MESSAGE_1: "You are about to confirm this sale.",
  CONFIRM_SALE_MESSAGE_2: "Once confirmed, sale will be locked & Inventory will be updated",
  IRREVERSIBLE_WARNING: "*This action cannot be undone",
  CONFIRM_PRINT_TITLE: "Save and Print Receipt",
  CONFIRM_PRINT_MESSAGE: "This will save the sale and open the print preview. Would you like to proceed?",
  CONFIRM_BUTTON: "Confirm",
  CANCEL_CONFIRM_BUTTON: "Cancel",
  PROCESSING_TEXT: "Processing...",

  // Delete Confirmation
  DELETE_ITEMS_TITLE: "Delete Items",
  DELETE_ITEMS_MESSAGE: "Are you sure you want to delete {count} item(s)?",

  // Submit-sale 409 (duplicate invoice number) — fallback when the backend omits `message`
  DUPLICATE_INVOICE_NUMBER_ERROR: "This invoice number is already used in this pharmacy. Please use a different invoice number.",
};

