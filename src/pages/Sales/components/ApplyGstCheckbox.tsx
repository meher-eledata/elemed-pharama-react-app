import React from 'react';
import { Box, Tooltip, Checkbox, FormControlLabel, Typography } from '@mui/material';
import { SalesReceiptItem } from '../SalesReceipt.types';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';

interface ApplyGstCheckboxProps {
  editingRowId: string | null;
  applyGstToAll: boolean;
  salesItems: SalesReceiptItem[];
  onApplyGstToAllChange: (checked: boolean) => void;
}

export const ApplyGstCheckbox: React.FC<ApplyGstCheckboxProps> = ({
  editingRowId,
  applyGstToAll,
  salesItems,
  onApplyGstToAllChange,
}) => {
  if (!editingRowId) {
    return <Box />;
  }

  return (
    <Tooltip title={SALES_RECEIPT_LABELS.APPLY_GST_TO_ALL_TOOLTIP} placement="top">
      <FormControlLabel
        control={
          <Checkbox
            checked={applyGstToAll}
            onChange={(e) => {
              const isChecked = e.target.checked;
              onApplyGstToAllChange(isChecked);
            }}
            sx={{
              color: '#5C17E5',
              '&.Mui-checked': {
                color: '#5C17E5',
              },
            }}
          />
        }
        label={
          <Typography sx={{ 
            fontFamily: "'Lexend', sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            color: '#1A212B',
          }}>
            {SALES_RECEIPT_LABELS.APPLY_GST_TO_ALL_LABEL}
          </Typography>
        }
        sx={{ marginLeft: 0 }}
      />
    </Tooltip>
  );
};

