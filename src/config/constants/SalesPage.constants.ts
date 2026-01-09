export const SALES_PAGE_CONSTANTS = {
  // Default Values
  DEFAULT_QUANTITY: 0,
  DEFAULT_DISCOUNT: 0,
  MIN_QUANTITY: 0,
  MIN_DISCOUNT: 0,
  MAX_DISCOUNT: 100,
  
  // Price Types
  PRICE_TYPE_SP: 'SP',
  PRICE_TYPE_MRP: 'MRP',
  
  // Product Types
  PRODUCT_TYPES: ["CAPSULE", "TABLET", "SYRUP"],
  
  // Brands (if needed)
  BRANDS: ["Brand A", "Brand B", "Brand C"],
  
  // Table Pagination
  DEFAULT_ROWS_PER_PAGE: 5,
  DEFAULT_CURRENT_PAGE: 1,
  
  // Sort Configuration
  DEFAULT_SORT_KEY: 'name',
  SORT_DIRECTION_ASC: 'asc' as const,
  SORT_DIRECTION_DESC: 'desc' as const,
  
  // Routes
  ROUTE_SALES_RECEIPT: '/sales/receipt',
  
  // Field Widths
  AUTOCOMPLETE_WIDTH: 300,
  QUANTITY_FIELD_WIDTH: 60,
  DISCOUNT_FIELD_WIDTH: 100,
  TYPE_DROPDOWN_MIN_WIDTH: 180,
  
  // Styling
  PRIMARY_COLOR: '#5C17E5',
  PRIMARY_HOVER_COLOR: '#4A12C7',
  GRAY_TEXT_COLOR: '#728197',
  BORDER_RADIUS: '0.5rem', // 8px = 0.5rem
  
  // Default Product Structure
  DEFAULT_PRODUCT_STRUCTURE: {
    id: '',
    name: '',
    batch: '',
    avlQty: '',
    mrp: 100,
    sp: 80,
    expiry: '2 Jun, 2025',
    quantity: 0,
    type: 'UNKNOWN',
    discount: 0,
  },
};

