import React from 'react';
import { Box, Typography } from '@mui/material';
import { StandardButton } from '../../../components/Common';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';

interface ActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  onPrint: () => void;
  isSaveDisabled?: boolean;
  hidePrintButton?: boolean;
  pageSize?: 'A4' | 'A5';
  onPageSizeChange?: (size: 'A4' | 'A5') => void;
  hidePageSize?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCancel,
  onSave,
  onPrint,
  isSaveDisabled = false,
  hidePrintButton = false,
  pageSize = 'A4',
  onPageSizeChange,
  hidePageSize = false,
}) => {
  const buttonStyles = {
    minWidth: '130px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '14px',
    textTransform: 'none' as const,
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
      {!hidePageSize && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#616161' }}>Page Size:</Typography>
          <Box sx={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '2px' }}>
            {['A4', 'A5'].map((size) => (
              <Box
                key={size}
                onClick={() => onPageSizeChange?.(size as 'A4' | 'A5')}
                sx={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: pageSize === size ? '#FFFFFF' : 'transparent',
                  color: pageSize === size ? '#5C17E5' : '#6B7280',
                  boxShadow: pageSize === size ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: pageSize === size ? '#FFFFFF' : '#E5E7EB',
                  }
                }}
              >
                {size}
              </Box>
            ))}
          </Box>
        </Box>
      )}
      <StandardButton
        variant="secondary"
        onClick={onCancel}
        size="large"
        sx={{
          ...buttonStyles,
          backgroundColor: '#F5F5F5',
          border: '1px solid #E0E0E0',
          color: '#616161',
          fontWeight: 600,
        }}
      >
        {SALES_RECEIPT_LABELS.CANCEL_BUTTON}
      </StandardButton>
      <StandardButton
        variant="primary"
        onClick={onSave}
        size="large"
        disabled={isSaveDisabled}
        sx={{
          ...buttonStyles,
          backgroundColor: isSaveDisabled ? '#9CA3AF' : '#5C17E5',
          color: '#FFFFFF',
          boxShadow: 'none',
          '&:disabled': {
            backgroundColor: '#9CA3AF',
            color: '#FFFFFF',
            cursor: 'not-allowed',
          },
        }}
      >
        {SALES_RECEIPT_LABELS.SAVE_BUTTON}
      </StandardButton>
      {!hidePrintButton && (
        <StandardButton
          variant="primary"
          onClick={onPrint}
          size="large"
          sx={{
            ...buttonStyles,
            backgroundColor: '#5C17E5',
            color: '#FFFFFF',
            boxShadow: 'none',
          }}
        >
          {SALES_RECEIPT_LABELS.PRINT_BUTTON}
        </StandardButton>
      )}
    </Box>
  );
};

