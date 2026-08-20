import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Box, Snackbar, Typography } from '@mui/material';
import { COMPLIANCE_CONSTANTS } from '../../config/constants/Compliance.constants';
import { COMPLIANCE_LABELS } from '../../config/label/Compliance.labels';
import { RootState } from '../../redux/store';
import ComplianceNav from './components/ComplianceNav';
import DocumentTypesSection from './components/DocumentTypesSection';
import ReminderSettingsSection from './components/ReminderSettingsSection';

const L = COMPLIANCE_LABELS;
const C = COMPLIANCE_CONSTANTS;

// Admin-portal surface: document types + org-wide renewal reminders. Both groups of
// mutations are requireRole('owner','admin') server-side, and the JWT `org_role`
// (not the legacy numeric role) is what decides — so a legacy admin whose org_role
// is staff sees the values read-only rather than a wall of 403s.
const ComplianceSettings: React.FC = () => {
  const orgRole = useSelector((state: RootState) => state.auth.user?.org_role);
  const canEdit = orgRole === 'owner' || orgRole === 'admin';

  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const showToast = useCallback((message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3, maxWidth: '1100px' }}>
      <Box>
        <Typography sx={{ fontSize: '32px', color: '#1A212B', fontFamily: C.FONT, fontWeight: 600 }}>
          {L.PAGE_TITLE}
        </Typography>
        <Typography sx={{ fontSize: '14px', color: '#6B7280', fontFamily: C.FONT }}>
          {L.TYPES.SUBTITLE}
        </Typography>
      </Box>

      <ComplianceNav />

      <DocumentTypesSection canEdit={canEdit} onToast={showToast} />
      <ReminderSettingsSection canEdit={canEdit} onToast={showToast} />

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ComplianceSettings;
