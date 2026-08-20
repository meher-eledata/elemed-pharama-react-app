import React, { useEffect, useState } from 'react';
import { Alert, Box, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import CommonModal from '../../../components/CommonModal/CommonModal';
import { StandardButton } from '../../../components/Common';
import {
  COMPLIANCE_CONSTANTS,
  COMPLIANCE_FIELD_SX,
} from '../../../config/constants/Compliance.constants';
import { COMPLIANCE_LABELS } from '../../../config/label/Compliance.labels';
import {
  useCreateComplianceDocumentTypeMutation,
  useUpdateComplianceDocumentTypeMutation,
  type ComplianceDocumentType,
} from '../../../redux/slices/complianceApi';
import { extractErrorMessage, logError } from '../../../utils/errorUtils';

const L = COMPLIANCE_LABELS;
const C = COMPLIANCE_CONSTANTS;

const KEY_PATTERN = /^[a-z0-9_]{2,64}$/;

// The 409 body: { error, id, status } — `status: 'ARCHIVED'` means the colliding
// type is archived and must be RESTORED, not re-created.
interface KeyConflict {
  message: string;
  id: number;
  status: string;
}

const readKeyConflict = (error: unknown): KeyConflict | null => {
  const failure = error as { status?: number; data?: { error?: string; id?: number; status?: string } };
  if (failure?.status !== 409 || !failure.data?.id) return null;
  return {
    message: failure.data.error ?? '',
    id: failure.data.id,
    status: failure.data.status ?? '',
  };
};

interface DocumentTypeModalProps {
  open: boolean;
  // null = create a new type; otherwise edit (the key is immutable).
  type: ComplianceDocumentType | null;
  onClose: () => void;
  onToast: (message: string, severity: 'success' | 'error') => void;
}

const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: C.ACCENT },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: C.ACCENT },
};

const DocumentTypeModal: React.FC<DocumentTypeModalProps> = ({ open, type, onClose, onToast }) => {
  const [createType, { isLoading: isCreating }] = useCreateComplianceDocumentTypeMutation();
  const [updateType, { isLoading: isUpdating }] = useUpdateComplianceDocumentTypeMutation();

  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [validityMonths, setValidityMonths] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<KeyConflict | null>(null);

  useEffect(() => {
    if (!open) return;
    setKey(type?.key ?? '');
    setName(type?.name ?? '');
    setDescription(type?.description ?? '');
    setCategory(type?.category ?? '');
    setIsRequired(type?.is_required ?? false);
    setValidityMonths(type?.default_validity_months ? String(type.default_validity_months) : '');
    setError(null);
    setConflict(null);
  }, [open, type]);

  const parseMonths = (): number | null | undefined => {
    const raw = validityMonths.trim();
    if (!raw) return null;
    const months = Number(raw);
    if (!Number.isInteger(months) || months < 1 || months > 600) return undefined;
    return months;
  };

  const handleSubmit = async () => {
    setConflict(null);
    if (!name.trim()) {
      setError(L.TYPES.NAME_REQUIRED);
      return;
    }
    const months = parseMonths();
    if (months === undefined) {
      setError(L.TYPES.VALIDITY_INVALID);
      return;
    }

    try {
      if (type) {
        await updateType({
          id: type.id,
          name: name.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
          is_required: isRequired,
          default_validity_months: months,
        }).unwrap();
        onToast(L.TYPES.UPDATED, 'success');
      } else {
        if (!KEY_PATTERN.test(key.trim())) {
          setError(L.TYPES.KEY_REQUIRED);
          return;
        }
        await createType({
          key: key.trim(),
          name: name.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
          is_required: isRequired,
          default_validity_months: months,
        }).unwrap();
        onToast(L.TYPES.CREATED, 'success');
      }
      onClose();
    } catch (err: unknown) {
      logError(err, 'ComplianceSettings.saveDocumentType');
      const keyConflict = readKeyConflict(err);
      if (keyConflict) {
        setConflict(keyConflict);
        setError(null);
        return;
      }
      setError(extractErrorMessage(err, L.TYPES.CREATE_ERROR));
    }
  };

  // The direct way out of the archived-key 409: restore the existing row instead
  // of leaving the user at a dead-end error.
  const handleRestoreConflict = async () => {
    if (!conflict) return;
    try {
      await updateType({ id: conflict.id, status: 'ACTIVE' }).unwrap();
      onToast(L.TYPES.RESTORED, 'success');
      onClose();
    } catch (err: unknown) {
      logError(err, 'ComplianceSettings.restoreDocumentType');
      setError(extractErrorMessage(err, L.TYPES.CREATE_ERROR));
    }
  };

  return (
    <CommonModal
      open={open}
      title={type ? L.TYPES.EDIT_TITLE : L.TYPES.ADD_TITLE}
      onClose={onClose}
      actionButtons={
        <StandardButton
          variant="primary"
          onClick={handleSubmit}
          disabled={isCreating || isUpdating}
        >
          {L.ACTIONS.SAVE}
        </StandardButton>
      }
      content={
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
          <TextField
            label={`${L.TYPES.KEY} *`}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            size="small"
            fullWidth
            // Immutable after creation — the server ignores it on PUT.
            disabled={Boolean(type)}
            helperText={L.TYPES.KEY_HINT}
            sx={COMPLIANCE_FIELD_SX}
          />
          <TextField
            label={`${L.TYPES.NAME} *`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
            sx={COMPLIANCE_FIELD_SX}
          />
          <TextField
            label={L.TYPES.CATEGORY}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            size="small"
            fullWidth
            sx={COMPLIANCE_FIELD_SX}
          />
          <TextField
            label={L.TYPES.DESCRIPTION}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
            sx={COMPLIANCE_FIELD_SX}
          />
          <TextField
            label={L.TYPES.VALIDITY_MONTHS}
            value={validityMonths}
            onChange={(e) => setValidityMonths(e.target.value)}
            size="small"
            fullWidth
            helperText={L.TYPES.VALIDITY_MONTHS_HINT}
            sx={COMPLIANCE_FIELD_SX}
          />
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  sx={switchSx}
                />
              }
              label={
                <Typography sx={{ fontSize: '14px', fontFamily: C.FONT, color: '#1A212B' }}>
                  {L.TYPES.IS_REQUIRED}
                </Typography>
              }
            />
            <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: C.FONT }}>
              {L.TYPES.IS_REQUIRED_HINT}
            </Typography>
          </Box>

          {conflict && (
            <Alert
              severity="warning"
              sx={{ fontFamily: C.FONT }}
              action={
                conflict.status === 'ARCHIVED' ? (
                  <StandardButton variant="outline" size="small" onClick={handleRestoreConflict}>
                    {L.TYPES.RESTORE_CONFLICT}
                  </StandardButton>
                ) : undefined
              }
            >
              {conflict.message}
            </Alert>
          )}

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

export default DocumentTypeModal;
