// export const NEW_PRODUCT_MODAL_LABELS = {
//   TITLE: 'New Product',
//   FIELDS: [
//     'SIN',
//     'HSN Category',
//     'MRP (INR)',
//     'Generic Name',
//     'Package Info (Eg 1,10)',
//     'Type',
//     'Product Code',
//     'Barcode',
//     'Min Qty',
//     'Product Location',
//     'Reorder Level'
//   ],
//   BUTTON_CANCEL: 'Cancel',
//   BUTTON_ADD: 'Add'
// } as const;

export const NEW_PRODUCT_MODAL_LABELS = {
  TITLE: 'New Product',
  FIELDS: [
    'Product name',
    'Product code',
    'Type',
    'Brand',
    'HSN code',
    'Package Info',
    'Unit of measure',
    'MRP',
    'Minimum quantity',
    'Maximum quantity'
  ],
  BUTTON_CANCEL: 'Cancel',
  BUTTON_ADD: 'Add'
} as const;