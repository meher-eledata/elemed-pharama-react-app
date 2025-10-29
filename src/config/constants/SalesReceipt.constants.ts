export const SALES_RECEIPT_CONSTANTS = {
  // Default Values
  DEFAULT_INVOICE_NUMBER: "982349827364",
  
  // Payment Methods
  PAYMENT_METHOD_CASH: 'cash' as const,
  PAYMENT_METHOD_CREDIT: 'credit' as const,
  
  // Table Pagination
  DEFAULT_ROWS_PER_PAGE: 10,
  DEFAULT_CURRENT_PAGE: 1,
  
  // Sort Configuration
  DEFAULT_SORT_KEY: '',
  SORT_DIRECTION_ASC: 'asc' as const,
  SORT_DIRECTION_DESC: 'desc' as const,
  
  // Routes
  ROUTE_SALES: '/sales',
  
  // Field Dimensions
  CUSTOMER_NAME_WIDTH: 350,
  PHONE_FIELD_WIDTH: 165,
  CITY_FIELD_WIDTH: 165,
  DOCTOR_NAME_WIDTH: 350,
  HOSPITAL_ID_WIDTH: 165,
  PAYMENT_FIELD_WIDTH: 275,
  INSURANCE_FIELD_WIDTH: 275,
  
  // Financial Summary Field Dimensions
  SUMMARY_LABEL_TOTAL_VALUE_WIDTH: '110px',
  SUMMARY_LABEL_DISCOUNT_WIDTH: '140px',
  SUMMARY_LABEL_TAX_WIDTH: '120px',
  SUMMARY_LABEL_PAYABLE_WIDTH: '180px',
  SUMMARY_INPUT_WIDTH: '80px',
  SUMMARY_INPUT_LARGE_WIDTH: '120px',
  SUMMARY_INPUT_HEIGHT: '36px',
  SUMMARY_FIELDS_GAP: '48px',
  SUMMARY_FIELD_GAP: '4px',
  
  // Section Spacing
  SECTION_GAP: '60px',
  MIN_COLUMN_WIDTH: '380px',
  SECTION_ROW_GAP: '20px',
  DIVIDER_POSITION: '50%',
  
  // Colors
  PRIMARY_COLOR: '#5C17E5',
  PRIMARY_HOVER_COLOR: '#4C14C7',
  TEXT_PRIMARY: '#1A212B',
  TEXT_SECONDARY: '#728197',
  BORDER_COLOR: '#E5E7EB',
  BACKGROUND_LIGHT: '#F9FAFB',
  SUMMARY_BACKGROUND: '#E0EDFF',
  PRINT_HEADER_BG: '#C7D2FE',
  PRINT_TABLE_BORDER: '#A5B4FC',
  
  // Border Radius
  BORDER_RADIUS_SMALL: '8px',
  BORDER_RADIUS_MEDIUM: '12px',
  
  // Font Sizes
  FONT_SIZE_TITLE: '36px',
  FONT_SIZE_SECTION: '16px',
  FONT_SIZE_LABEL: '12px',
  FONT_SIZE_TEXT: '14px',
  FONT_SIZE_INPUT: '16px',
  
  // Mock Customers (for demo - remove when API is ready)
  MOCK_CUSTOMERS: [
    { id: 1, name: 'John Doe', mobile: '9876543210', email: 'john@example.com', city: 'Mumbai', address: '123 Main St' },
    { id: 2, name: 'Jane Smith', mobile: '9876543211', email: 'jane@example.com', city: 'Delhi', address: '456 Park Ave' },
    { id: 3, name: 'Robert Johnson', mobile: '9876543212', email: 'robert@example.com', city: 'Bangalore', address: '789 Oak Rd' },
  ],
  
  // Mock Doctors (for demo - remove when API is ready)
  MOCK_DOCTORS: [
    { id: 1, name: 'Dr. Amit Sharma', mobile: '9123456789', email: 'amit.sharma@hospital.com', hospitalId: 'H001', specialization: 'Cardiology' },
    { id: 2, name: 'Dr. Priya Patel', mobile: '9123456790', email: 'priya.patel@hospital.com', hospitalId: 'H002', specialization: 'Pediatrics' },
    { id: 3, name: 'Dr. Rajesh Kumar', mobile: '9123456791', email: 'rajesh.kumar@hospital.com', hospitalId: 'H003', specialization: 'Orthopedics' },
  ],
  
  // Print Configuration
  PRINT_PAGE_SIZE: 'A4 landscape',
  PRINT_MARGIN: '0.5in',
  PRINT_FONT_SIZE_BODY: '12px',
  PRINT_FONT_SIZE_TITLE: '28px',
  PRINT_FONT_SIZE_SECTION: '14px',
  
  // Date Format
  DATE_FORMAT_OPTIONS: { 
    day: '2-digit' as const, 
    month: 'short' as const, 
    year: 'numeric' as const 
  },
  DATE_LOCALE: 'en-GB',
};

