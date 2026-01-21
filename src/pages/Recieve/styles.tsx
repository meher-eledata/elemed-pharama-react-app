import React from "react";

export const TickMarkIcon = (props: any) => (
  <svg
    {...(props as any)}
    width="18"
    height="18"
    viewBox="0 0 16 16"
    fill="none"
    style={{
      pointerEvents: "none",
      color: "currentColor",
    }}
  >
    <path
      d="M13.5 4.5L6 12L2.5 8.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const commonStyles = {
  inputField: {
    '& .MuiOutlinedInput-root': {
      height: '2rem', borderRadius: '0.375rem', backgroundColor: '#FFFFFF', // 32px = 2rem, 6px = 0.375rem
      '& fieldset': { borderColor: '#D1D5DB', borderWidth: '0.0625rem' }, // 1px = 0.0625rem
      '&:hover fieldset': { borderColor: '#9CA3AF' },
      '&.Mui-focused fieldset': { borderColor: '#3B82F6', borderWidth: '0.0625rem' }, // 1px = 0.0625rem
      '& .MuiOutlinedInput-input': { padding: '0.375rem 0.5rem', fontSize: '0.8125rem', color: '#374151' }, // 6px = 0.375rem, 8px = 0.5rem, 13px = 0.8125rem
    },
  },
  numberInput: {
    '& input[type=number]': { MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'textfield' },
    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 }
  },
  searchField: {
    '& .MuiOutlinedInput-root': {
      height: '2.5rem', borderRadius: '0.75rem', backgroundColor: '#fff', // 40px = 2.5rem, 12px = 0.75rem
      boxShadow: 'inset 0 0 0 0.0625rem #BFD1E6', '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, // 1px = 0.0625rem
      '&:hover': { boxShadow: 'inset 0 0 0 0.0625rem #AFC3DD' }, // 1px = 0.0625rem
      '&.Mui-focused': { boxShadow: 'inset 0 0 0 0.125rem #9EB6D6' }, // 2px = 0.125rem
    },
  },
  filterButton: {
    minWidth: '10rem', height: '2.5rem', borderRadius: '0.75rem', bgcolor: '#EEF2F7', // 160px = 10rem, 40px = 2.5rem, 12px = 0.75rem
    color: '#1A212B', textTransform: 'none', px: 2, border: '0.0625rem solid #D7DFEA', // 1px = 0.0625rem
    boxShadow: '0 0.125rem 0.5rem rgba(2, 6, 23, 0.08)', '&:hover': { bgcolor: '#E6EBF2' }, fontWeight: 600, // 2px = 0.125rem, 8px = 0.5rem
  }
};

// OrderDetails Styles
export const orderDetailsStyles = {
  tableInputField: {
    '& .MuiOutlinedInput-root': {
      height: '32px',
      borderRadius: '6px',
      backgroundColor: '#FFFFFF',
      '& fieldset': {
        borderColor: '#D1D5DB',
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: '#9CA3AF',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#9AA8BC',
        borderWidth: '1px',
      },
    },
    '& .MuiOutlinedInput-input': {
      padding: '6px 8px',
      fontSize: '13px',
      color: '#374151',
    },
  },
  tableNumberInput: {
    '& .MuiOutlinedInput-root': {
      height: '32px',
      borderRadius: '6px',
      backgroundColor: '#FFFFFF',
      '& fieldset': {
        borderColor: '#D1D5DB',
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: '#9CA3AF',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#9AA8BC',
        borderWidth: '1px',
      },
    },
    '& .MuiOutlinedInput-input': {
      padding: '6px 8px',
      fontSize: '13px',
      color: '#374151',
    },
    '& input[type=number]': {
      MozAppearance: 'textfield',
      WebkitAppearance: 'none',
      appearance: 'textfield'
    },
    '& input[type=number]::-webkit-outer-spin-button': {
      WebkitAppearance: 'none',
      margin: 0
    },
    '& input[type=number]::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0
    }
  },
  formField: {
    width: '274px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '18px',
      height: '44px',
      backgroundColor: '#FFFFFF',
      '& fieldset': {
        borderColor: '#D1D5DB',
      },
      '&:hover fieldset': {
        borderColor: '#D1D5DB',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#728197',
        borderWidth: '2px',
        outline: 'none',
      },
    },
    '& .MuiOutlinedInput-input': {
      padding: '12px 16px',
      fontFamily: "'Lexend', sans-serif",
      fontSize: '16px',
      lineHeight: '24px',
      color: '#728197',
    },
  },
  autocompleteField: {
    width: '274px',
    '& .MuiOutlinedInput-root': {
      height: '44px',
      borderRadius: '30px',
      backgroundColor: '#FFFFFF',
      padding: '0 16px',
      '& fieldset': {
        borderColor: '#D1D5DB',
      },
      '&:hover fieldset': {
        borderColor: '#D1D5DB',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#5C17E5',
        borderWidth: '2px',
      },
    },
  },
  labelText: {
    fontFamily: "'Lexend', sans-serif",
    fontWeight: 500,
    fontSize: '12px',
    lineHeight: '18px',
    color: '#728197',
  },
  dropdownPaper: {
    padding: 0,
    marginTop: '4px',
    borderRadius: '12px',
    border: '1px solid #E6ECF5',
    backgroundColor: '#fff',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
};
