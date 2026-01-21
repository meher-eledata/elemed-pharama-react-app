import React from 'react';
import { Button, ButtonProps } from '@mui/material';

export interface StandardButtonProps extends Omit<ButtonProps, 'size' | 'variant'> {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
}

const STANDARD_BUTTON_SIZES = {
  small: {
    height: '32px',
    padding: '6px 16px',
    fontSize: '14px',
    minWidth: '80px',
  },
  medium: {
    height: '40px',
    padding: '10px 20px',
    fontSize: '14px',
    minWidth: '100px',
  },
  large: {
    height: '48px',
    padding: '12px 24px',
    fontSize: '16px',
    minWidth: '120px',
  },
};

const STANDARD_BUTTON_VARIANTS = {
  primary: {
    backgroundColor: '#5C17E5',
    color: '#FFFFFF',
    border: 'none',
    '&:hover': {
      backgroundColor: '#5C17E5',
      boxShadow: 'none',
    },
    '&:focus': {
      backgroundColor: '#5C17E5',
      boxShadow: 'none',
    },
    '&:active': {
      backgroundColor: '#5C17E5',
      boxShadow: 'none',
    },
    '&:disabled': {
      backgroundColor: '#D1D5DB',
      color: '#9CA3AF',
    },
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    color: '#525E6F',
    border: '1px solid #D7DFEA',
    boxShadow: 'none',
    outline: 'none',
    '&:hover': {
      backgroundColor: '#FFFFFF',
      borderColor: '#D7DFEA',
      boxShadow: 'none',
      outline: 'none',
    },
    '&:focus': {
      backgroundColor: '#FFFFFF',
      borderColor: '#D7DFEA',
      boxShadow: 'none',
      outline: 'none',
    },
    '&:active': {
      backgroundColor: '#FFFFFF',
      borderColor: '#D7DFEA',
      boxShadow: 'none',
      outline: 'none',
    },
    '&:disabled': {
      backgroundColor: '#F8F9FA',
      color: '#9CA3AF',
      borderColor: '#D1D5DB',
    },
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#5C17E5',
    border: '1px solid #5C17E5',
    '&:hover': {
      backgroundColor: 'transparent',
      borderColor: '#5C17E5',
    },
    '&:focus': {
      backgroundColor: 'transparent',
      borderColor: '#5C17E5',
    },
    '&:active': {
      backgroundColor: 'transparent',
      borderColor: '#5C17E5',
    },
    '&:disabled': {
      backgroundColor: 'transparent',
      color: '#9CA3AF',
      borderColor: '#D1D5DB',
    },
  },
  text: {
    backgroundColor: 'transparent',
    color: '#374151',
    border: 'none',
    '&:hover': {
      backgroundColor: 'transparent',
    },
    '&:focus': {
      backgroundColor: 'transparent',
    },
    '&:active': {
      backgroundColor: 'transparent',
    },
    '&:disabled': {
      backgroundColor: 'transparent',
      color: '#9CA3AF',
    },
  },
};

const StandardButton: React.FC<StandardButtonProps> = ({
  size = 'medium',
  variant = 'primary',
  children,
  sx = {},
  ...props
}) => {
  const sizeStyles = STANDARD_BUTTON_SIZES[size];
  const variantStyles = STANDARD_BUTTON_VARIANTS[variant];

  return (
    <Button
      variant="contained"
      disableElevation
      disableRipple
      sx={{
        ...sizeStyles,
        ...variantStyles,
        fontFamily: "'Lexend', sans-serif",
        fontWeight: 500,
        textTransform: 'none',
        borderRadius: '12px',
        boxShadow: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: 1.5,
        '&.Mui-focusVisible': {
          ...variantStyles['&:focus'],
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default StandardButton;
