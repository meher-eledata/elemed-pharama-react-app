import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Dialog,
  DialogContent,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { StandardButton } from '../../components/Common';
import PatientPicker from '../../components/Outpatient/PatientPicker';
import { OPD_LABELS } from '../../config/label/Outpatient.labels';
import { OPD_CONSTANTS } from '../../config/constants/Outpatient.constants';
import { extractErrorMessage, logError } from '../../utils/errorUtils';
import {
  useGetProvidersQuery,
  useRegisterWalkInMutation,
  type OutpatientPatient,
} from '../../redux/slices/outpatientApi';

const L = OPD_LABELS.WALK_IN;

const WalkInRegister: React.FC = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<OutpatientPatient | null>(null);
  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [token, setToken] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const { data: providers } = useGetProvidersQuery();
  const [registerWalkIn, { isLoading }] = useRegisterWalkInMutation();

  const handleRegister = async () => {
    if (!patient || doctorId === '') return;
    try {
      const res = await registerWalkIn({ patient_id: patient.id, doctor_id: doctorId }).unwrap();
      setToken(res.token_number);
      setSnackbar({ open: true, message: L.MESSAGES.SUCCESS, severity: 'success' });
    } catch (err: any) {
      logError(err, 'WalkInRegister.registerWalkIn');
      const msg =
        err?.status === 409
          ? extractErrorMessage(err, L.MESSAGES.NOT_ACCEPTING)
          : extractErrorMessage(err, L.MESSAGES.ERROR);
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const handleDone = () => {
    setToken(null);
    navigate('/outpatient');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: OPD_CONSTANTS.LAYOUT.PAGE_PADDING }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>
          {L.PAGE_TITLE}
        </Typography>
        <Typography sx={{ color: '#6B7280', fontSize: 14 }}>{L.SUBTITLE}</Typography>
      </Box>

      <Paper sx={{ p: 3, borderRadius: '12px', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 3 }} elevation={0} variant="outlined">
        <PatientPicker selected={patient} onSelect={setPatient} />

        <Box>
          <TextField
            label={L.DOCTOR}
            select
            size="small"
            value={doctorId}
            onChange={(e) => setDoctorId(Number(e.target.value))}
            helperText={L.DOCTOR_HINT}
            sx={{ maxWidth: 320 }}
          >
            {(providers ?? []).map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
                {d.branch ? ` · ${d.branch}` : ''}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box>
          <StandardButton
            variant="primary"
            size="medium"
            disabled={!patient || doctorId === '' || isLoading}
            onClick={handleRegister}
          >
            {L.REGISTER}
          </StandardButton>
        </Box>
      </Paper>

      {/* Token card dialog */}
      <Dialog open={token !== null} onClose={handleDone} maxWidth="xs" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CheckCircleIcon sx={{ fontSize: 56, color: '#15803D' }} />
          <Typography sx={{ fontWeight: 600, fontSize: 18 }}>{L.TOKEN_TITLE}</Typography>
          <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{L.TOKEN_LABEL}</Typography>
          <Typography sx={{ fontSize: 56, fontWeight: 800, color: OPD_CONSTANTS.THEME.PRIMARY, lineHeight: 1 }}>
            {token}
          </Typography>
          {patient && <Typography sx={{ fontSize: 14 }}>{patient.name}</Typography>}
          <StandardButton variant="primary" size="medium" onClick={handleDone} sx={{ mt: 1 }}>
            {L.TOKEN_DONE}
          </StandardButton>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WalkInRegister;
