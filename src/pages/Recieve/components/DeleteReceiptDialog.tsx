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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StandardButton } from '../../../components/Common';
import { ORDER_RECEIVE_DELETE_DIALOG } from '../../../config/label/OrderReceive.labels';

interface DeleteReceiptDialogProps {
  open: boolean;
  /** OUR goods-receipt (GRN) number, shown so the user can confirm they picked the right one. */
  receiptNumber?: string | null;
  isDeleting?: boolean;
  onClose: () => void;
  /** Receives the trimmed, non-empty reason. */
  onConfirm: (reason: string) => void;
}

/**
 * Confirmation + reason capture for deleting a whole goods receipt.
 *
 * Two things make this its own dialog rather than a plain ConfirmationDialog:
 *
 * 1. The backend REQUIRES `deletion_reason` (400 without it) — it is the audit trail for
 *    why stock was reversed, and it is shown back in the receipts list forever. So the
 *    reason is a mandatory input, not a nicety, and Delete stays disabled until it is given.
 * 2. Deleting a receipt reverses stock and voids supplier payments, so the copy spells out
 *    what actually happens instead of a generic "are you sure".
 *
 * Deliberately NOT phrased as "cannot be undone": nothing is destroyed server-side — the
 * receipt is retired and stays readable. Saying otherwise would misdescribe the system.
 */
const DeleteReceiptDialog: React.FC<DeleteReceiptDialogProps> = ({
  open,
  receiptNumber,
  isDeleting = false,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  // Never carry a previous reason into the next deletion.
  useEffect(() => {
    if (open) {
      setReason('');
      setTouched(false);
    }
  }, [open]);

  const trimmed = reason.trim();
  const isEmpty = trimmed.length === 0;

  const handleConfirm = () => {
    setTouched(true);
    if (isEmpty || isDeleting) return;
    onConfirm(trimmed);
  };

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
          maxWidth: '520px',
          width: '90%',
          boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.15)',
        },
      }}
      aria-labelledby="delete-receipt-dialog-title"
    >
      <DialogTitle
        id="delete-receipt-dialog-title"
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
        {ORDER_RECEIVE_DELETE_DIALOG.TITLE}
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close"
          sx={{
            color: '#6B7280',
            '&:hover': { backgroundColor: '#F3F4F6', color: '#374151' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Box
          sx={{
            color: '#374151',
            fontSize: '15px',
            lineHeight: 1.7,
            fontFamily: "'Lexend', sans-serif",
          }}
        >
          {receiptNumber
            ? ORDER_RECEIVE_DELETE_DIALOG.MESSAGE_WITH_NUMBER(receiptNumber)
            : ORDER_RECEIVE_DELETE_DIALOG.MESSAGE}
        </Box>

        <Typography
          sx={{
            mt: 2,
            mb: 0.75,
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            fontFamily: "'Lexend', sans-serif",
          }}
        >
          {ORDER_RECEIVE_DELETE_DIALOG.REASON_LABEL}
        </Typography>
        <TextField
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={ORDER_RECEIVE_DELETE_DIALOG.REASON_PLACEHOLDER}
          multiline
          minRows={2}
          maxRows={4}
          fullWidth
          autoFocus
          disabled={isDeleting}
          error={touched && isEmpty}
          helperText={touched && isEmpty ? ORDER_RECEIVE_DELETE_DIALOG.REASON_REQUIRED : ' '}
          inputProps={{ 'aria-label': ORDER_RECEIVE_DELETE_DIALOG.REASON_LABEL, maxLength: 500 }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: "'Lexend', sans-serif",
            },
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0, justifyContent: 'flex-end', gap: 2 }}>
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
            '&:hover': { backgroundColor: '#E0E0E0', border: '1px solid #D1D5DB' },
          }}
        >
          {ORDER_RECEIVE_DELETE_DIALOG.CANCEL_LABEL}
        </StandardButton>
        <StandardButton
          onClick={handleConfirm}
          variant="primary"
          size="medium"
          disabled={isDeleting || isEmpty}
          sx={{
            minWidth: '140px',
            borderRadius: '8px',
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '14px',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': { backgroundColor: '#DC2626', boxShadow: 'none' },
            '&:disabled': { backgroundColor: '#FCA5A5', color: '#FFFFFF' },
          }}
        >
          {isDeleting
            ? ORDER_RECEIVE_DELETE_DIALOG.CONFIRM_LABEL_BUSY
            : ORDER_RECEIVE_DELETE_DIALOG.CONFIRM_LABEL}
        </StandardButton>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteReceiptDialog;
