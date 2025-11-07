export const CUSTOMER_MODAL_CONSTANTS = {
  // Modal Dimensions
  MODAL_WIDTH: 700,
  MODAL_HEIGHT: 500,
  MODAL_BORDER_RADIUS: '12px',
  
  // Colors
  PRIMARY_COLOR: '#5C17E5',
  PRIMARY_HOVER_COLOR: '#4A13C0',
  BORDER_COLOR: '#B0B7C3',
  TEXT_COLOR_BLACK: '#000000',
  TEXT_SECONDARY_COLOR: '#728197',
  
  // Input Field Configuration
  INPUT_BORDER_RADIUS: '11px',
  
  // Address Field Rows
  ADDRESS_FIELD_ROWS: 3,
  
  // Button Dimensions
  BUTTON_HEIGHT: '36px',
  BUTTON_MIN_WIDTH: '100px',
  BUTTON_PADDING: '6px 20px',
  BUTTON_MARGIN_TOP: '-60px',
  
  // Gender Types
  GENDER_TYPES: {
    MALE: 'male' as const,
    FEMALE: 'female' as const,
    OTHER: 'other' as const,
  },
  
  // Initial Customer Data Structure
  INITIAL_CUSTOMER_STATE: {
    customerName: '',
    mobileNumber: '',
    emailId: '',
    gender: {
      male: false,
      female: false,
      other: false,
    },
    billingAddress: '',
    shippingAddress: '',
    shippingAddressSameAsBilling: false,
    gstin: '',
    pancardNumber: '',
    drugLicense: '',
  },
  
  // Modal Style Configuration
  MODAL_STYLE: {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    boxShadow: 24,
    padding: 3,
    overflowY: 'hidden' as const,
  },
  
  // Input Style Configuration
  INPUT_STYLE: {
    OUTLINE_COLOR: '#B0B7C3',
    FOCUSED_COLOR: '#B0B7C3',
    LABEL_COLOR: '#B0B7C3',
    TEXT_COLOR: '#000000',
  },
  
  // Spacing
  STACK_SPACING: 2,
  GRID_SPACING: 4,
  GENDER_BOX_MARGIN_TOP: 15,
  CHECKBOX_MARGIN_LEFT: '8px',
  
  // Font Sizes
  CHECKBOX_LABEL_FONT_SIZE: '0.875rem',
  COMMERCIAL_HEADER_FONT_SIZE: '0.9rem',
};

