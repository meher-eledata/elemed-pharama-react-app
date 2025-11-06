import React from 'react';
import { Box } from '@mui/material';
import { StandardButton } from '../../../components/Common';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';

interface ActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  onPrint: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCancel,
  onSave,
  onPrint,
}) => {
  const buttonStyles = {
    minWidth: '130px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '14px',
    textTransform: 'none' as const,
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
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
        sx={{
          ...buttonStyles,
          backgroundColor: '#5C17E5',
          color: '#FFFFFF',
          boxShadow: 'none',
        }}
      >
        {SALES_RECEIPT_LABELS.SAVE_BUTTON}
      </StandardButton>
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
    </Box>
  );
};

