import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
} from '@mui/material';
import { StandardButton } from '../../Common';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';
import { SALES_RECEIPT_CONSTANTS } from '../../../config/constants/SalesReceipt.constants';

interface SaleConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const SaleConfirmationDialog: React.FC<SaleConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (open) {
        if (event.key === 'Escape') {
          onClose();
        } else if (event.key === 'Enter' && !isLoading) {
          onConfirm();
        }
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, onConfirm, isLoading]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: SALES_RECEIPT_CONSTANTS.DIALOG.BORDER_RADIUS,
          border: SALES_RECEIPT_CONSTANTS.DIALOG.PAPER_BORDER,
          backgroundColor: SALES_RECEIPT_CONSTANTS.DIALOG.PAPER_BG,
          padding: 0,
          maxWidth: SALES_RECEIPT_CONSTANTS.DIALOG.MAX_WIDTH,
          width: '90%',
          boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.15)',
        },
      }}
      aria-labelledby="confirm-dialog-title"
    >
      {/* Title */}
      <DialogTitle
        id="confirm-dialog-title"
        sx={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#1A212B',
          padding: SALES_RECEIPT_CONSTANTS.DIALOG.PADDING_TITLE,
          fontFamily: "'Lexend', sans-serif",
        }}
      >
        {SALES_RECEIPT_LABELS.CONFIRM_SALE_TITLE}
      </DialogTitle>

      {/* Content with Message Box */}
      <DialogContent sx={{ padding: SALES_RECEIPT_CONSTANTS.DIALOG.PADDING_CONTENT }}>
        <Box
          sx={{
            backgroundColor: SALES_RECEIPT_CONSTANTS.DIALOG.MESSAGE_BOX_BG,
            border: SALES_RECEIPT_CONSTANTS.DIALOG.MESSAGE_BOX_BORDER,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Typography
            sx={{
              fontSize: '15px',
              color: '#374151',
              marginBottom: '10px',
              lineHeight: 1.7,
              fontWeight: 500,
            }}
          >
            {SALES_RECEIPT_LABELS.CONFIRM_SALE_MESSAGE_1}
          </Typography>
          <Typography
            sx={{
              fontSize: '15px',
              color: '#374151',
              marginBottom: '12px',
              lineHeight: 1.7,
              fontWeight: 500,
            }}
          >
            {SALES_RECEIPT_LABELS.CONFIRM_SALE_MESSAGE_2}
          </Typography>
          <Typography
            sx={{
              fontSize: '13px',
              color: '#DC2626',
              textAlign: 'right',
              fontStyle: 'italic',
              fontWeight: 700,
              marginTop: '8px',
            }}
          >
            {SALES_RECEIPT_LABELS.IRREVERSIBLE_WARNING}
          </Typography>
        </Box>
      </DialogContent>

      {/* Action Buttons */}
      <DialogActions
        sx={{
          padding: SALES_RECEIPT_CONSTANTS.DIALOG.PADDING_ACTIONS,
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}
      >
        <StandardButton
          onClick={onClose}
          variant="secondary"
          size="large"
          disabled={isLoading}
          sx={{
            minWidth: '130px',
            borderRadius: '10px',
            backgroundColor: '#F5F5F5',
            border: '1px solid #E0E0E0',
            color: '#616161',
            fontWeight: 600,
            fontSize: '14px',
            textTransform: 'none',
            '&:disabled': {
              opacity: 0.6,
            },
          }}
        >
          {SALES_RECEIPT_LABELS.CANCEL_CONFIRM_BUTTON}
        </StandardButton>
        <StandardButton
          onClick={onConfirm}
          variant="primary"
          size="large"
          disabled={isLoading}
          sx={{
            minWidth: '130px',
            borderRadius: '10px',
            backgroundColor: '#5C17E5',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '14px',
            textTransform: 'none',
            boxShadow: 'none',
            '&:disabled': {
              backgroundColor: '#9CA3AF',
            },
          }}
        >
          {isLoading ? SALES_RECEIPT_LABELS.PROCESSING_TEXT : SALES_RECEIPT_LABELS.CONFIRM_BUTTON}
        </StandardButton>
      </DialogActions>
    </Dialog>
  );
};

export default SaleConfirmationDialog;
