import React, { useEffect, useState } from 'react';
import { Alert, Box, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { StandardButton } from '../../../components/Common';
import {
  COMPLIANCE_CONSTANTS,
  COMPLIANCE_DANGER_BUTTON_SX,
} from '../../../config/constants/Compliance.constants';
import { COMPLIANCE_LABELS } from '../../../config/label/Compliance.labels';
import {
  useDeleteComplianceDocumentTypeMutation,
  useUpdateComplianceDocumentTypeMutation,
  type ComplianceDeleteConflict,
  type ComplianceDocumentType,
} from '../../../redux/slices/complianceApi';
import { extractErrorMessage, logError } from '../../../utils/errorUtils';
import { readDeleteConflict } from '../compliance.utils';

const L = COMPLIANCE_LABELS;
const C = COMPLIANCE_CONSTANTS;

interface DeleteDocumentTypeDialogProps {
  open: boolean;
  type: ComplianceDocumentType | null;
  onClose: () => void;
  onToast: (message: string, severity: 'success' | 'error') => void;
}

// Deleting a document type is PERMANENT (unlike archiving, which is reversible and
// is deliberately un-confirmed), so it is confirmed here first. When documents are
// filed against the type the server refuses with 409 — the dialog then states the
// real reason and offers the archive that would have worked, instead of throwing a
// raw error toast at a user who cannot tell the two outcomes apart.
const DeleteDocumentTypeDialog: React.FC<DeleteDocumentTypeDialogProps> = ({
  open,
  type,
  onClose,
  onToast,
}) => {
  const [deleteType, { isLoading: isDeleting }] = useDeleteComplianceDocumentTypeMutation();
  const [updateType, { isLoading: isArchiving }] = useUpdateComplianceDocumentTypeMutation();
  const [conflict, setConflict] = useState<ComplianceDeleteConflict | null>(null);

  // Never carry one type's refusal into the next dialog.
  useEffect(() => {
    if (!open) setConflict(null);
  }, [open]);

  if (!type) return null;
  const isBusy = isDeleting || isArchiving;

  const handleDelete = async () => {
    try {
      await deleteType(type.id).unwrap();
      onToast(L.DELETE.DELETED, 'success');
      onClose();
    } catch (error: unknown) {
      logError(error, 'ComplianceSettings.deleteDocumentType');
      // Branch on the STATUS CODE and document_count, never on the message text.
      const refusal = readDeleteConflict(error);
      if (refusal) {
        setConflict(refusal);
        return;
      }
      onToast(extractErrorMessage(error, L.DELETE.ERROR), 'error');
      onClose();
    }
  };

  const handleArchiveInstead = async () => {
    try {
      await updateType({ id: type.id, status: 'ARCHIVED' }).unwrap();
      onToast(L.TYPES.ARCHIVED, 'success');
      onClose();
    } catch (error: unknown) {
      logError(error, 'ComplianceSettings.archiveDocumentType');
      onToast(extractErrorMessage(error, L.TYPES.ARCHIVE_ERROR), 'error');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isBusy ? undefined : onClose}
      PaperProps={{
        sx: { borderRadius: '16px', border: '1px solid #E5E7EB', maxWidth: '460px', width: '90%' },
      }}
      aria-labelledby="compliance-delete-type-title"
    >
      <DialogTitle
        id="compliance-delete-type-title"
        sx={{
          fontFamily: C.FONT,
          fontWeight: 600,
          fontSize: '18px',
          color: '#1A212B',
          px: 3,
          pt: 3,
          pb: 1,
        }}
      >
        {L.DELETE.TITLE}
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 1 }}>
        {conflict ? (
          <Alert severity="warning" sx={{ fontFamily: C.FONT }}>
            <Box>{L.DELETE.blocked(type.name, conflict.document_count)}</Box>
            <Box sx={{ mt: 0.5 }}>{L.DELETE.BLOCKED_HINT}</Box>
          </Alert>
        ) : (
          <>
            <Typography sx={{ fontSize: '14px', color: '#1A212B', fontFamily: C.FONT }}>
              {L.DELETE.confirm(type.name)}
            </Typography>
            <Typography
              sx={{ fontSize: '13px', color: '#6B7280', fontFamily: C.FONT, mt: 1 }}
            >
              {L.DELETE.HINT}
            </Typography>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1.5 }}>
        <StandardButton variant="secondary" onClick={onClose} disabled={isBusy}>
          {L.ACTIONS.CANCEL}
        </StandardButton>
        {conflict ? (
          <StandardButton variant="primary" onClick={handleArchiveInstead} disabled={isBusy}>
            {L.DELETE.ARCHIVE_INSTEAD}
          </StandardButton>
        ) : (
          <StandardButton
            variant="primary"
            onClick={handleDelete}
            disabled={isBusy}
            sx={COMPLIANCE_DANGER_BUTTON_SX}
          >
            {L.DELETE.CONFIRM_ACTION}
          </StandardButton>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDocumentTypeDialog;
