import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useSelector } from 'react-redux';
import { StandardButton } from '../../components/Common';
import { useGetOrgQuery, useUpdateOrgMutation } from '../../redux/slices/orgApi';
import { selectIsSuperadmin } from '../../redux/slices/orgSlice';
import { extractErrorMessage } from '../../utils/errorUtils';
import { ORG_LABELS } from '../../config/label/Org.labels';

const S = ORG_LABELS.SETTINGS;
const F = S.FIELDS;

interface FormState {
  name: string;
  country: string;
  timezone: string;
  currency: string;
}

const OrgSettings: React.FC = () => {
  const isSuperadmin = useSelector(selectIsSuperadmin);
  const { data: org, isLoading, isError } = useGetOrgQuery();
  const [updateOrg, { isLoading: isSaving }] = useUpdateOrgMutation();

  const [form, setForm] = useState<FormState>({ name: '', country: '', timezone: '', currency: '' });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const showToast = (message: string, severity: 'success' | 'error' = 'success') =>
    setSnackbar({ open: true, message, severity });

  // Seed the form once the org profile loads.
  useEffect(() => {
    if (org) {
      setForm({
        name: org.name ?? '',
        country: org.country ?? '',
        timezone: org.timezone ?? '',
        currency: org.currency ?? '',
      });
    }
  }, [org]);

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    try {
      await updateOrg({
        name: form.name.trim(),
        country: form.country.trim(),
        timezone: form.timezone.trim(),
        currency: form.currency.trim(),
      }).unwrap();
      showToast(S.SAVE_SUCCESS, 'success');
    } catch (err) {
      showToast(extractErrorMessage(err, S.SAVE_ERROR), 'error');
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      fontFamily: "'Lexend', sans-serif",
      '&.Mui-focused fieldset': { borderColor: '#5C17E5' },
    },
    '& .MuiInputBase-input': { fontSize: '14px', color: '#1A212B' },
  };

  const renderField = (label: string, value: string, field?: keyof FormState, readOnly?: boolean) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
        {label}
      </Typography>
      <TextField
        fullWidth
        size="small"
        value={value}
        onChange={field ? handleChange(field) : undefined}
        InputProps={{ readOnly: readOnly || !isSuperadmin || !field }}
        sx={fieldSx}
      />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '24px' }}>
      <Box>
        <Typography
          sx={{ fontWeight: 700, fontSize: '32px', color: '#1A212B', fontFamily: "'Lexend', sans-serif", mb: 0.5 }}
        >
          {S.PAGE_TITLE}
        </Typography>
        <Typography sx={{ fontSize: '16px', color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
          {isSuperadmin ? S.SUBTITLE : S.READ_ONLY_NOTE}
        </Typography>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#6B7280' }}>
          <CircularProgress size={18} />
          <Typography sx={{ fontSize: '14px', fontFamily: "'Lexend', sans-serif" }}>{S.LOADING}</Typography>
        </Box>
      )}
      {!isLoading && isError && (
        <Typography sx={{ fontSize: '14px', color: '#EF4444', fontFamily: "'Lexend', sans-serif" }}>
          {S.LOAD_ERROR}
        </Typography>
      )}

      {!isLoading && !isError && org && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: '560px', width: '100%' }}>
          {renderField(F.NAME, form.name, 'name')}
          {renderField(F.SLUG, org.slug, undefined, true)}
          {renderField(F.STATUS, org.status, undefined, true)}
          {renderField(F.COUNTRY, form.country, 'country')}
          {renderField(F.TIMEZONE, form.timezone, 'timezone')}
          {renderField(F.CURRENCY, form.currency, 'currency')}

          {isSuperadmin && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <StandardButton
                onClick={handleSave}
                disabled={isSaving}
                variant="primary"
                size="medium"
                sx={{ minWidth: '160px', height: 40 }}
              >
                {S.SAVE_BUTTON}
              </StandardButton>
            </Box>
          )}
        </Box>
      )}

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

export default OrgSettings;
