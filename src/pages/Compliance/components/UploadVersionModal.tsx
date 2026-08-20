import React, { useEffect, useRef, useState } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { Dayjs } from 'dayjs';
import CommonModal from '../../../components/CommonModal/CommonModal';
import { StandardButton, PharmaDatePicker } from '../../../components/Common';
import {
  COMPLIANCE_CONSTANTS,
  COMPLIANCE_FIELD_SX,
} from '../../../config/constants/Compliance.constants';
import { COMPLIANCE_LABELS } from '../../../config/label/Compliance.labels';
import { useUploadComplianceVersionMutation } from '../../../redux/slices/complianceApi';
import { extractErrorMessage, logError } from '../../../utils/errorUtils';
import { toApiDate, validateComplianceFile } from '../compliance.utils';

const L = COMPLIANCE_LABELS;
const C = COMPLIANCE_CONSTANTS;

interface UploadVersionModalProps {
  open: boolean;
  documentId: number | null;
  documentTitle: string;
  onClose: () => void;
  onToast: (message: string, severity: 'success' | 'error') => void;
}

const labelSx = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
  fontFamily: C.FONT,
  mb: 0.5,
};

const hintSx = { fontSize: '12px', color: '#6B7280', fontFamily: C.FONT, mt: 0.5 };

const UploadVersionModal: React.FC<UploadVersionModalProps> = ({
  open,
  documentId,
  documentTitle,
  onClose,
  onToast,
}) => {
  const [uploadVersion, { isLoading }] = useUploadComplianceVersionMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [validFrom, setValidFrom] = useState<Dayjs | null>(null);
  const [validTo, setValidTo] = useState<Dayjs | null>(null);
  const [issuedBy, setIssuedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setValidFrom(null);
    setValidTo(null);
    setIssuedBy('');
    setNotes('');
    setError(null);
  }, [open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!chosen) return;
    const fileError = validateComplianceFile(chosen);
    if (fileError) {
      setFile(null);
      setError(fileError);
      return;
    }
    setError(null);
    setFile(chosen);
  };

  const handleSubmit = async () => {
    if (!documentId) return;
    if (!file) {
      setError(L.VALIDATION.FILE_REQUIRED);
      return;
    }
    const from = toApiDate(validFrom);
    if (!from) {
      setError(L.VALIDATION.VALID_FROM_REQUIRED);
      return;
    }
    // `valid_to` is OPTIONAL — a blank field means "does not expire" and must be
    // sent as nothing at all, never defaulted to a date.
    const to = toApiDate(validTo);
    if (to && to < from) {
      setError(L.VALIDATION.VALID_TO_BEFORE_FROM);
      return;
    }

    try {
      await uploadVersion({
        documentId,
        file,
        valid_from: from,
        valid_to: to,
        issued_by: issuedBy.trim() || null,
        notes: notes.trim() || null,
      }).unwrap();
      onToast(L.TOAST.VERSION_UPLOADED, 'success');
      onClose();
    } catch (err: unknown) {
      logError(err, 'ComplianceDocuments.uploadVersion');
      setError(extractErrorMessage(err, L.TOAST.UPLOAD_ERROR));
    }
  };

  return (
    <CommonModal
      open={open}
      title={L.MODALS.UPLOAD_TITLE}
      onClose={onClose}
      actionButtons={
        <StandardButton variant="primary" onClick={handleSubmit} disabled={isLoading}>
          {L.ACTIONS.UPLOAD}
        </StandardButton>
      }
      content={
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
          <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: C.FONT }}>
            {L.MODALS.uploadSubtitle(documentTitle)}
          </Typography>

          <Box>
            <Typography sx={labelSx}>{L.FIELDS.FILE}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <StandardButton
                variant="secondary"
                size="small"
                startIcon={<UploadFileOutlinedIcon sx={{ fontSize: 18 }} />}
                onClick={() => fileInputRef.current?.click()}
              >
                {L.MODALS.CHOOSE_FILE}
              </StandardButton>
              <Typography
                sx={{
                  fontSize: '13px',
                  color: file ? '#1A212B' : '#9CA3AF',
                  fontFamily: C.FONT,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {file ? file.name : L.MODALS.NO_FILE_CHOSEN}
              </Typography>
            </Box>
            <Typography sx={hintSx}>{L.HINTS.FILE_RULES}</Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept={C.UPLOAD.ACCEPT}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              data-testid="compliance-file-input"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography sx={labelSx}>{`${L.FIELDS.VALID_FROM} *`}</Typography>
              <PharmaDatePicker value={validFrom} onChange={setValidFrom} width={180} />
              <Typography sx={hintSx}>{L.HINTS.VALID_FROM_REQUIRED}</Typography>
            </Box>
            <Box>
              <Typography sx={labelSx}>{L.FIELDS.VALID_TO}</Typography>
              <PharmaDatePicker
                value={validTo}
                onChange={setValidTo}
                width={180}
                minDate={validFrom ?? undefined}
              />
              <Typography sx={hintSx}>{L.HINTS.VALID_TO_OPTIONAL}</Typography>
            </Box>
          </Box>

          <TextField
            label={L.FIELDS.ISSUED_BY}
            value={issuedBy}
            onChange={(e) => setIssuedBy(e.target.value)}
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

export default UploadVersionModal;
