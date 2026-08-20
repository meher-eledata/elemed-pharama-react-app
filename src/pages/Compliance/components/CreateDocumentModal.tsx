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
  useCreateComplianceDocumentMutation,
  type ComplianceDocumentType,
} from '../../../redux/slices/complianceApi';
import { extractErrorMessage, logError } from '../../../utils/errorUtils';

const L = COMPLIANCE_LABELS;
const C = COMPLIANCE_CONSTANTS;

interface CreateDocumentModalProps {
  open: boolean;
  // ACTIVE types only — an archived type is rejected by the server.
  types: ComplianceDocumentType[];
  // Pre-selected when the flow starts from a "nothing filed" type card.
  initialTypeId: number | null;
  onClose: () => void;
  onToast: (message: string, severity: 'success' | 'error') => void;
  // Hands the new (empty) document straight to the upload step so the window in
  // which it counts as "nothing filed" stays short.
  onCreated: (documentId: number, title: string) => void;
}

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  open,
  types,
  initialTypeId,
  onClose,
  onToast,
  onCreated,
}) => {
  const [createDocument, { isLoading }] = useCreateComplianceDocumentMutation();
  const [typeId, setTypeId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTypeId(initialTypeId ?? '');
    // Seed the title from the chosen type's name — the usual case is "one document
    // per type", and it stays fully editable.
    const seeded = types.find((t) => t.id === initialTypeId);
    setTitle(seeded?.name ?? '');
    setReferenceNumber('');
    setNotes('');
    setError(null);
  }, [open, initialTypeId, types]);

  const handleTypeChange = (value: number) => {
    setTypeId(value);
    const picked = types.find((t) => t.id === value);
    if (picked && !title.trim()) setTitle(picked.name);
  };

  const handleSubmit = async () => {
    if (!typeId) {
      setError(L.VALIDATION.TYPE_REQUIRED);
      return;
    }
    if (!title.trim()) {
      setError(L.VALIDATION.TITLE_REQUIRED);
      return;
    }
    try {
      const created = await createDocument({
        document_type_id: typeId,
        title: title.trim(),
        reference_number: referenceNumber.trim() || null,
        notes: notes.trim() || null,
      }).unwrap();
      onToast(L.TOAST.DOCUMENT_CREATED, 'success');
      onClose();
      onCreated(created.id, created.title);
    } catch (err: unknown) {
      logError(err, 'ComplianceDocuments.createDocument');
      setError(extractErrorMessage(err, L.TOAST.CREATE_ERROR));
    }
  };

  return (
    <CommonModal
      open={open}
      title={L.MODALS.CREATE_TITLE}
      onClose={onClose}
      actionButtons={
        <StandardButton variant="primary" onClick={handleSubmit} disabled={isLoading}>
          {L.ACTIONS.CREATE}
        </StandardButton>
      }
      content={
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
          <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: C.FONT }}>
            {L.MODALS.CREATE_SUBTITLE}
          </Typography>

          <TextField
            select
            label={L.FIELDS.TYPE}
            value={typeId}
            onChange={(e) => handleTypeChange(Number(e.target.value))}
            size="small"
            fullWidth
            sx={COMPLIANCE_FIELD_SX}
          >
            {types.map((type) => (
              <MenuItem key={type.id} value={type.id} sx={{ fontFamily: C.FONT, fontSize: '14px' }}>
                {type.category ? `${type.category} — ${type.name}` : type.name}
              </MenuItem>
            ))}
          </TextField>

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

export default CreateDocumentModal;
