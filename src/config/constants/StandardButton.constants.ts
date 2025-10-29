// Standardized Button System Constants
export const STANDARD_BUTTON_CONSTANTS = {
  // Button Sizes
  SIZES: {
    SMALL: 'small',
    MEDIUM: 'medium', 
    LARGE: 'large',
  },
  
  // Button Variants
  VARIANTS: {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    OUTLINE: 'outline',
    TEXT: 'text',
  },
  
  // Standard Dimensions
  DIMENSIONS: {
    SMALL: {
      height: '32px',
      padding: '6px 16px',
      fontSize: '14px',
      minWidth: '80px',
    },
    MEDIUM: {
      height: '40px',
      padding: '10px 20px',
      fontSize: '14px',
      minWidth: '100px',
    },
    LARGE: {
      height: '48px',
      padding: '12px 24px',
      fontSize: '16px',
      minWidth: '120px',
    },
  },
  
  // Colors
  COLORS: {
    PRIMARY: '#5C17E5',
    PRIMARY_HOVER: '#4A13C0',
    SECONDARY_BG: '#FFFFFF',
    SECONDARY_TEXT: '#525E6F',
    SECONDARY_BORDER: '#27313F',
    OUTLINE_TEXT: '#5C17E5',
    TEXT_COLOR: '#374151',
    DISABLED_BG: '#D1D5DB',
    DISABLED_TEXT: '#9CA3AF',
    HOVER_BG: '#F3F0FF',
    LIGHT_HOVER_BG: '#F8F9FA',
    GRAY_HOVER_BG: '#F3F4F6',
  },
  
  // Common Styles
  COMMON_STYLES: {
    fontFamily: "'Lexend', sans-serif",
    fontWeight: 500,
    textTransform: 'none',
    borderRadius: '12px',
    boxShadow: 'none',
  },
};

// Button Size Guidelines
export const BUTTON_SIZE_GUIDELINES = {
  // Use SMALL for:
  // - Icon buttons
  // - Secondary actions
  // - Compact spaces
  SMALL_USAGE: [
    'Icon buttons',
    'Secondary actions', 
    'Compact spaces',
    'Table row actions',
  ],
  
  // Use MEDIUM for:
  // - Primary actions
  // - Form buttons
  // - Most common use case
  MEDIUM_USAGE: [
    'Primary actions',
    'Form buttons',
    'Most common use case',
    'Modal buttons',
  ],
  
  // Use LARGE for:
  // - Call-to-action buttons
  // - Hero section buttons
  // - Important primary actions
  LARGE_USAGE: [
    'Call-to-action buttons',
    'Hero section buttons', 
    'Important primary actions',
    'Main navigation buttons',
  ],
};

// Migration Guide
export const MIGRATION_GUIDE = {
  // Replace existing button patterns with StandardButton
  REPLACEMENTS: {
    // Old: Custom styled buttons with inconsistent sizes
    // New: <StandardButton size="medium" variant="primary">
    
    // Old: height: '36px', padding: '6px 20px'
    // New: size="medium"
    
    // Old: height: '48px', padding: '12px 24px'  
    // New: size="large"
    
    // Old: height: '32px', padding: '4px 8px'
    // New: size="small"
  },
  
  // Common patterns to replace
  PATTERNS: {
    ADD_BUTTON: 'StandardButton size="medium" variant="primary"',
    SAVE_BUTTON: 'StandardButton size="medium" variant="primary"',
    CANCEL_BUTTON: 'StandardButton size="medium" variant="secondary"',
    DELETE_BUTTON: 'StandardButton size="small" variant="outline"',
    CLOSE_BUTTON: 'StandardButton size="small" variant="text"',
  },
};
