import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import CloseIcon from '@mui/icons-material/Close';
import { PURCHASE_RETURN_LABELS } from '../../../config/label/PurchaseReturn.labels';
import { PURCHASE_RETURN_CONSTANTS } from '../../../config/constants/PurchaseReturn.constants';

const L = PURCHASE_RETURN_LABELS.UPLOAD;
const FILE_RULES = PURCHASE_RETURN_CONSTANTS.CREDIT_NOTE_FILE;

interface CreditNoteUploadProps {
  label: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
}

// Optional credit-note photo/scan picker (clone of the InvoiceUploadSection
// pattern): hidden file input, dashed click zone, image thumbnail preview,
// filename + remove X. Validates type/size client-side; the file itself is
// uploaded by the caller after its primary action succeeds.
const CreditNoteUpload: React.FC<CreditNoteUploadProps> = ({ label, file, onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileError, setFileError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isImage = !!file?.type?.startsWith('image/');

  useEffect(() => {
    if (!file || !isImage) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    // Allow re-selecting the same file after a remove.
    event.target.value = '';
    if (!selected) return;

    if (!(FILE_RULES.ALLOWED_TYPES as readonly string[]).includes(selected.type)) {
      setFileError(L.INVALID_TYPE);
      return;
    }
    if (selected.size > FILE_RULES.MAX_MB * 1024 * 1024) {
      setFileError(L.FILE_TOO_LARGE(FILE_RULES.MAX_MB));
      return;
    }
    setFileError('');
    onFileSelect(selected);
  };

  const handleRemove = () => {
    setFileError('');
    onFileSelect(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '360px' }}>
      <Typography sx={{ fontSize: '13px', color: '#728197' }}>{label}</Typography>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={FILE_RULES.ACCEPT}
        style={{ display: 'none' }}
        data-testid="credit-note-file-input"
      />

      {file ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '12px',
            border: '1px solid #D1D5DB',
            backgroundColor: '#F9FAFB',
          }}
        >
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Credit note preview"
              style={{
                maxWidth: '60px',
                maxHeight: '40px',
                objectFit: 'contain',
                borderRadius: '4px',
              }}
            />
          )}
          <Typography
            sx={{
              flex: 1,
              fontSize: '13px',
              color: '#374151',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {file.name}
          </Typography>
          <IconButton
            size="small"
            aria-label={L.REMOVE}
            onClick={handleRemove}
            sx={{
              padding: '4px',
              color: '#6B7280',
              '&:hover': { backgroundColor: 'transparent', color: '#EF4444' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Box
          onClick={() => fileInputRef.current?.click()}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '18px',
            border: '1px dashed #D1D5DB',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: '#5C17E5',
              backgroundColor: '#F3E8FF',
            },
          }}
        >
          <UploadIcon sx={{ color: '#9CA3AF', fontSize: '20px' }} />
          <Typography sx={{ fontFamily: "'Lexend', sans-serif", fontSize: '14px', color: '#728197' }}>
            {L.PROMPT}
          </Typography>
        </Box>
      )}

      {fileError && (
        <Typography sx={{ fontSize: '12px', color: '#DC2626' }}>{fileError}</Typography>
      )}
    </Box>
  );
};

export default CreditNoteUpload;
