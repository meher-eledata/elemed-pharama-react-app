import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  IconButton,
  TextField,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StandardButton } from '../Common';

export interface DeleteDocumentDialogProps {
  open: boolean;
  /** Lower-case noun for the document being retired, e.g. "invoice" or "receipt". */
  documentLabel: string;
  /** The user-facing document number (invoice number / GRN). Optional — legacy rows lack one. */
  documentNumber?: string | null;
  /**
   * What actually happens when this document is retired — stock movements and money.
   * Per-document because a sale restores stock while a purchase receipt reverses it.
   */
  consequenceText: string;
  isDeleting?: boolean;
  onClose: () => void;
  /** Receives the trimmed reason; only fires once it meets MIN_REASON_LENGTH. */
  onConfirm: (reason: string) => void;
}

/**
 * Confirmation + mandatory-reason capture for retiring a whole document (sales invoice or
 * goods receipt).
 *
 * ONE dialog for both on purpose. The two flows had drifted into near-duplicate components
 * that disagreed on things nobody had chosen — minimum reason length, whether the busy state
 * showed a spinner, whether the dialog could be dismissed mid-delete. Those are not
 * per-feature decisions, so they live here once.
 *
 * What IS per-feature is the noun and the consequence sentence, which are props.
 *
 * `deletion_reason` is mandatory server-side on both endpoints (400 without it) and is shown
 * back in the history forever, so Delete stays disabled until the reason is substantive —
 * a one-character reason is not an audit trail.
 */
export const MIN_REASON_LENGTH = 3;

const DeleteDocumentDialog: React.FC<DeleteDocumentDialogProps> = ({
  open,
  documentLabel,
  documentNumber,
  consequenceText,
  isDeleting = false,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  // Never carry a previous reason into the next deletion.
  useEffect(() => {
    if (!open) {
      setReason('');
      setTouched(false);
    }
  }, [open]);

  const trimmed = reason.trim();
  const tooShort = trimmed.length < MIN_REASON_LENGTH;
  const canSubmit = !tooShort && !isDeleting;

  const handleConfirm = () => {
    setTouched(true);
    if (!canSubmit) return;
    onConfirm(trimmed);
  };

  return (
    <Dialog
      open={open}
      // Not dismissable mid-delete: the request is already in flight and closing would
      // strand the user with no idea whether it landed.
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
      aria-labelledby="delete-document-dialog-title"
    >
      <DialogTitle
        id="delete-document-dialog-title"
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
        {`Delete ${documentLabel}${documentNumber ? ` ${documentNumber}` : ''}?`}
        <IconButton
          onClick={onClose}
          size="small"
          disabled={isDeleting}
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
            fontSize: '14px',
            lineHeight: 1.6,
            fontFamily: "'Lexend', sans-serif",
            mb: 2,
          }}
        >
          {consequenceText}
        </Box>

        <TextField
          autoFocus
          required
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          label="Reason for deletion"
          placeholder={`e.g., Entered twice by mistake`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          disabled={isDeleting}
          error={touched && tooShort}
          helperText={
            touched && tooShort
              ? `Please enter a reason — it is recorded against this ${documentLabel}.`
              : ' '
          }
          inputProps={{ 'aria-label': 'Reason for deletion', maxLength: 500 }}
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
            '&:hover': { backgroundColor: '#E0E0E0', border: '1px solid #D1D5DB' },
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
            '&:hover': { backgroundColor: '#B91C1C', boxShadow: 'none' },
            '&.Mui-disabled': { backgroundColor: '#FCA5A5', color: '#FFFFFF' },
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

export default DeleteDocumentDialog;
