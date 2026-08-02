import React, { useRef, useState } from 'react';
import { Box, Typography, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useSelector } from 'react-redux';
import { StandardButton } from '../../components/Common';
import ConfirmationDialog from '../../components/DeleteDialogue/ConfirmationDialog';
import {
  useGetOrgQuery,
  useUpdateOrgLogoMutation,
  useDeleteOrgLogoMutation,
} from '../../redux/slices/orgApi';
import { selectIsSuperadmin } from '../../redux/slices/orgSlice';
import { extractErrorMessage, logError } from '../../utils/errorUtils';
import { ORG_LABELS } from '../../config/label/Org.labels';
import elemedLogo from '../../assets/ElemedLogo.svg';

const L = ORG_LABELS.LABEL;

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const OrgLabel: React.FC = () => {
  const isSuperadmin = useSelector(selectIsSuperadmin);
  const { data: org, isLoading, isError } = useGetOrgQuery();
  const [updateOrgLogo, { isLoading: isSaving }] = useUpdateOrgLogoMutation();
  const [deleteOrgLogo, { isLoading: isRemoving }] = useDeleteOrgLogoMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Data URL of a file the user picked but has not saved yet.
  const [pending, setPending] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const showToast = (message: string, severity: 'success' | 'error' = 'success') =>
    setSnackbar({ open: true, message, severity });

  const currentLogo = org?.logo_url || null;
  // What to render in the preview: pending selection wins, else the saved logo, else default.
  const previewSrc = pending || currentLogo || elemedLogo;
  const isDefault = !pending && !currentLogo;

  const handleChoose = () => fileInputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again re-triggers change.
    e.target.value = '';
    if (!file) return;

    if (!L.ACCEPTED_TYPES.includes(file.type as (typeof L.ACCEPTED_TYPES)[number])) {
      showToast(L.INVALID_TYPE, 'error');
      return;
    }
    if (file.size > L.MAX_BYTES) {
      showToast(L.OVERSIZE, 'error');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPending(dataUrl);
    } catch (err) {
      logError(err, 'OrgLabel.readFile');
      showToast(L.READ_ERROR, 'error');
    }
  };

  const handleSave = async () => {
    if (!pending) return;
    try {
      await updateOrgLogo({ image: pending }).unwrap();
      setPending(null);
      showToast(L.UPLOAD_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'OrgLabel.updateLogo');
      showToast(extractErrorMessage(err, L.UPLOAD_ERROR), 'error');
    }
  };

  const handleRemove = async () => {
    setConfirmOpen(false);
    try {
      await deleteOrgLogo().unwrap();
      setPending(null);
      showToast(L.REMOVE_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'OrgLabel.deleteLogo');
      showToast(extractErrorMessage(err, L.REMOVE_ERROR), 'error');
    }
  };

  const caption = pending ? L.PENDING_CAPTION : isDefault ? L.DEFAULT_CAPTION : L.CURRENT_HEADING;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '24px' }}>
      <Box>
        <Typography
          sx={{ fontWeight: 700, fontSize: '32px', color: '#1A212B', fontFamily: "'Lexend', sans-serif", mb: 0.5 }}
        >
          {L.PAGE_TITLE}
        </Typography>
        <Typography sx={{ fontSize: '16px', color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
          {isSuperadmin ? L.SUBTITLE : L.READ_ONLY_NOTE}
        </Typography>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#6B7280' }}>
          <CircularProgress size={18} />
          <Typography sx={{ fontSize: '14px', fontFamily: "'Lexend', sans-serif" }}>{L.LOADING}</Typography>
        </Box>
      )}
      {!isLoading && isError && (
        <Typography sx={{ fontSize: '14px', color: '#EF4444', fontFamily: "'Lexend', sans-serif" }}>
          {L.LOAD_ERROR}
        </Typography>
      )}

      {!isLoading && !isError && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: '560px', width: '100%' }}>
          {/* Preview card */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              p: '24px',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              backgroundColor: '#F9FAFB',
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '16px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src={previewSrc}
                alt="Organization logo"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </Box>
            <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
              {caption}
            </Typography>
          </Box>

          <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
            {L.HINT}
          </Typography>

          {isSuperadmin && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <StandardButton
                  onClick={handleChoose}
                  variant="secondary"
                  size="medium"
                  sx={{ minWidth: '150px', height: 40 }}
                >
                  {L.CHOOSE_BUTTON}
                </StandardButton>
                <StandardButton
                  onClick={handleSave}
                  disabled={!pending || isSaving}
                  variant="primary"
                  size="medium"
                  sx={{ minWidth: '150px', height: 40 }}
                >
                  {L.UPLOAD_BUTTON}
                </StandardButton>
                {currentLogo && (
                  <StandardButton
                    onClick={() => setConfirmOpen(true)}
                    disabled={isRemoving}
                    variant="secondary"
                    size="medium"
                    sx={{ minWidth: '150px', height: 40 }}
                  >
                    {L.REMOVE_BUTTON}
                  </StandardButton>
                )}
              </Box>
            </>
          )}
        </Box>
      )}

      <ConfirmationDialog
        open={confirmOpen}
        title={L.REMOVE_CONFIRM_TITLE}
        message={L.REMOVE_CONFIRM_MESSAGE}
        confirmLabel={L.REMOVE_BUTTON}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleRemove}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrgLabel;
