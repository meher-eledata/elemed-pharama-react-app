import React, { useEffect, useState } from 'react';
import { Box, MenuItem, TextField, Typography } from '@mui/material';
import CommonModal from '../../../components/CommonModal/CommonModal';
import { StandardButton } from '../../../components/Common';
import {
  COMPLIANCE_CONSTANTS,
  COMPLIANCE_FIELD_SX,
} from '../../../config/constants/Compliance.constants';
import { COMPLIANCE_LABELS } from '../../../config/label/Compliance.labels';
import {
  useUpdateComplianceDocumentMutation,
  type ComplianceDocument,
  type ComplianceStatus,
  type UpdateComplianceDocumentRequest,
} from '../../../redux/slices/complianceApi';
import { extractErrorMessage, logError } from '../../../utils/errorUtils';

const L = COMPLIANCE_LABELS;
const C = COMPLIANCE_CONSTANTS;

interface EditDocumentModalProps {
  open: boolean;
  document: ComplianceDocument | null;
  onClose: () => void;
  onToast: (message: string, severity: 'success' | 'error') => void;
}

// PUT /compliance/documents/:id — title / reference number / notes / archive.
// The document TYPE is deliberately not editable (a mis-filed document is archived
// and re-created), and the validity dates live on the version, not here.
const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  open,
  document,
  onClose,
  onToast,
}) => {
  const [updateDocument, { isLoading }] = useUpdateComplianceDocumentMutation();
  const [title, setTitle] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ComplianceStatus>('ACTIVE');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !document) return;
    setTitle(document.title);
    setReferenceNumber(document.reference_number ?? '');
    setNotes(document.notes ?? '');
    setStatus(document.status);
    setError(null);
  }, [open, document]);

  const handleSubmit = async () => {
    if (!document) return;
    if (!title.trim()) {
      setError(L.VALIDATION.TITLE_REQUIRED);
      return;
    }
    const reference = referenceNumber.trim() || null;
    const trimmedNotes = notes.trim() || null;
    // At least one field is required, and only changed fields are sent.
    const patch: Omit<UpdateComplianceDocumentRequest, 'id'> = {};
    if (title.trim() !== document.title) patch.title = title.trim();
    if (reference !== document.reference_number) patch.reference_number = reference;
    if (trimmedNotes !== document.notes) patch.notes = trimmedNotes;
    if (status !== document.status) patch.status = status;
    if (Object.keys(patch).length === 0) {
      setError(L.VALIDATION.NO_CHANGES);
      return;
    }

    try {
      await updateDocument({ id: document.id, ...patch }).unwrap();
      onToast(L.DOCUMENT_EDIT.SAVED, 'success');
      onClose();
    } catch (err: unknown) {
      logError(err, 'ComplianceDocuments.updateDocument');
      setError(extractErrorMessage(err, L.DOCUMENT_EDIT.ERROR));
    }
  };

  return (
    <CommonModal
      open={open}
      title={L.DOCUMENT_EDIT.TITLE}
      onClose={onClose}
      actionButtons={
        <StandardButton variant="primary" onClick={handleSubmit} disabled={isLoading}>
          {L.ACTIONS.SAVE}
        </StandardButton>
      }
      content={
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
          <TextField
            label={`${L.FIELDS.TITLE} *`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            size="small"
            fullWidth
            sx={COMPLIANCE_FIELD_SX}
          />
          <TextField
            label={L.FIELDS.REFERENCE_NUMBER}
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            size="small"
            fullWidth
            sx={COMPLIANCE_FIELD_SX}
          />
          <TextField
            label={L.FIELDS.NOTES}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
            sx={COMPLIANCE_FIELD_SX}
          />
          <TextField
            select
            label={L.DOCUMENT_EDIT.STATUS}
            value={status}
            onChange={(e) => setStatus(e.target.value as ComplianceStatus)}
            size="small"
            fullWidth
            sx={COMPLIANCE_FIELD_SX}
          >
            <MenuItem value="ACTIVE" sx={{ fontFamily: C.FONT, fontSize: '14px' }}>
              {L.DOCUMENT_EDIT.ACTIVE}
            </MenuItem>
            <MenuItem value="ARCHIVED" sx={{ fontFamily: C.FONT, fontSize: '14px' }}>
              {L.DOCUMENT_EDIT.ARCHIVED}
            </MenuItem>
          </TextField>
          <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: C.FONT }}>
            {L.DOCUMENT_EDIT.ARCHIVE_HINT}
          </Typography>

          {error && (
            <Typography sx={{ fontSize: '13px', color: '#B91C1C', fontFamily: C.FONT }}>
              {error}
            </Typography>
          )}
        </Box>
      }
    />
  );
};

export default EditDocumentModal;
