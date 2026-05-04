import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  IconButton,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StandardButton } from '../Common';

interface DeleteInvoiceDialogProps {
  open: boolean;
  invoiceNumber: string;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const MIN_REASON_LENGTH = 3;

const DeleteInvoiceDialog: React.FC<DeleteInvoiceDialogProps> = ({
  open,
  invoiceNumber,
  isDeleting = false,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  const trimmed = reason.trim();
  const canSubmit = trimmed.length >= MIN_REASON_LENGTH && !isDeleting;

  const handleConfirm = () => {
    if (!canSubmit) return;
    onConfirm(trimmed);
  };

  return (
    <Dialog
      open={open}
      onClose={isDeleting ? undefined : onClose}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          padding: 0,
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.15)',
        },
      }}
      aria-labelledby="delete-invoice-dialog-title"
    >
      <DialogTitle
        id="delete-invoice-dialog-title"
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
          fontFamily: "'Lexend', sans-serif",
        }}
      >
        Delete Invoice {invoiceNumber || ''}?
        <IconButton
          onClick={onClose}
          size="small"
          disabled={isDeleting}
          sx={{
            color: '#6B7280',
            '&:hover': {
              backgroundColor: '#F3F4F6',
              color: '#374151',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Typography
          sx={{
            color: '#374151',
            fontSize: '14px',
            lineHeight: 1.6,
            fontFamily: "'Lexend', sans-serif",
            mb: 2,
          }}
        >
          This will permanently delete the invoice. Stock will be restored. This
          action cannot be undone.
        </Typography>

        <TextField
          autoFocus
          required
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          label="Reason for deletion"
          placeholder="e.g., Customer billing mistake"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isDeleting}
          inputProps={{ maxLength: 500 }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              fontFamily: "'Lexend', sans-serif",
              fontSize: '14px',
            },
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, justifyContent: 'flex-end', gap: 2 }}>
        <StandardButton
          onClick={onClose}
          variant="secondary"
          size="medium"
          disabled={isDeleting}
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
          Cancel
        </StandardButton>
        <StandardButton
          onClick={handleConfirm}
          variant="primary"
          size="medium"
          disabled={!canSubmit}
          sx={{
            minWidth: '100px',
            borderRadius: '8px',
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '14px',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#B91C1C',
              boxShadow: 'none',
            },
            '&.Mui-disabled': {
              backgroundColor: '#FCA5A5',
              color: '#FFFFFF',
            },
          }}
        >
          {isDeleting ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={16} sx={{ color: '#FFFFFF' }} />
              Deleting...
            </Box>
          ) : (
            'Delete'
          )}
        </StandardButton>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteInvoiceDialog;
