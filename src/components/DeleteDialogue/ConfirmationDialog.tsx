import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StandardButton } from '../Common';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  itemName?: string;
  // Disables the confirm button while the confirmed action is in flight,
  // preventing double-click double submits.
  isLoading?: boolean;
  /** Optional: disables the confirm button (e.g. while a submit is in flight). */
  confirmDisabled?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  onClose,
  onConfirm,
  onCancel,
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
  itemName,
  isLoading = false,
  confirmDisabled = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          padding: 0,
          maxWidth: '500px',
          width: '90%',
          minHeight: '180px',
          boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.15)',
        },
      }}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >

      <DialogTitle
        id="alert-dialog-title"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          px: 3,
          pt: 3,
          fontWeight: 600,
          fontSize: '18px',
          color: '#1A212B',
          fontFamily: "'Lexend', sans-serif"
        }}
      >
        {title}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: '#6B7280',
            '&:hover': {
              backgroundColor: '#F3F4F6',
              color: '#374151'
            }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3, minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box
          id="alert-dialog-description"
          sx={{
            color: '#374151',
            textAlign: 'center',
            fontSize: '15px',
            lineHeight: 1.7,
            fontWeight: 400,
            fontFamily: "'Lexend', sans-serif"
          }}
        >
          {message}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0, justifyContent: 'center', gap: 2 }}>
        <StandardButton
          onClick={onCancel || onClose}
          variant="secondary"
          size="medium"
          sx={{
            minWidth: '100px',
            borderRadius: '8px',
            backgroundColor: '#F5F5F5',
            border: '1px solid #E0E0E0',
            color: '#616161',
            fontWeight: 500,
            fontSize: '14px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#E0E0E0',
              border: '1px solid #D1D5DB',
            },
          }}
        >
          {cancelLabel}
        </StandardButton>
        <StandardButton
          onClick={onConfirm}
          disabled={isLoading || confirmDisabled}
          variant="primary"
          size="medium"
          sx={{
            minWidth: '100px',
            borderRadius: '8px',
            backgroundColor: '#5C17E5',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '14px',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#4C14CC',
              boxShadow: 'none',
            },
          }}
        >
          {confirmLabel}
        </StandardButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;


