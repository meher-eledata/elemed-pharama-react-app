import React from 'react';
import { Box, Typography } from '@mui/material';
import { StandardButton } from '../../../components/Common';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';

interface ActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  onSaveDraft?: () => void;
  onPrint: () => void;
  isSaveDisabled?: boolean;
  isSaveDraftDisabled?: boolean;
  hidePrintButton?: boolean;
  pageSize?: 'A4' | 'A5';
  onPageSizeChange?: (size: 'A4' | 'A5') => void;
  orientation?: 'landscape' | 'portrait';
  onOrientationChange?: (orientation: 'landscape' | 'portrait') => void;
  hidePageSize?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCancel,
  onSave,
  onSaveDraft,
  onPrint,
  isSaveDisabled = false,
  isSaveDraftDisabled = false,
  hidePrintButton = false,
  pageSize = 'A4',
  onPageSizeChange,
  orientation = 'landscape',
  onOrientationChange,
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', marginRight: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#616161' }}>{SALES_RECEIPT_LABELS.ORIENTATION_LABEL}</Typography>
            <Box sx={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '2px' }}>
              {([
                { value: 'landscape', label: SALES_RECEIPT_LABELS.ORIENTATION_LANDSCAPE },
                { value: 'portrait', label: SALES_RECEIPT_LABELS.ORIENTATION_PORTRAIT },
              ] as const).map((option) => (
                <Box
                  key={option.value}
                  onClick={() => onOrientationChange?.(option.value)}
                  sx={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: orientation === option.value ? '#FFFFFF' : 'transparent',
                    color: orientation === option.value ? '#5C17E5' : '#6B7280',
                    boxShadow: orientation === option.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: orientation === option.value ? '#FFFFFF' : '#E5E7EB',
                    }
                  }}
                >
                  {option.label}
                </Box>
              ))}
            </Box>
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
      {onSaveDraft && (
        <StandardButton
          variant="secondary"
          onClick={onSaveDraft}
          size="large"
          disabled={isSaveDraftDisabled}
          sx={{
            ...buttonStyles,
            backgroundColor: '#FFFFFF',
            border: '1px solid #5C17E5',
            color: '#5C17E5',
            fontWeight: 600,
            '&:disabled': {
              backgroundColor: '#F5F5F5',
              border: '1px solid #E0E0E0',
              color: '#9CA3AF',
              cursor: 'not-allowed',
            },
          }}
        >
          {SALES_RECEIPT_LABELS.SAVE_DRAFT_BUTTON}
        </StandardButton>
      )}
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

