import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { PharmaDatePicker, StandardButton } from '../../components/Common';
import PatientPicker from '../../components/Outpatient/PatientPicker';
import { OPD_LABELS } from '../../config/label/Outpatient.labels';
import { OPD_CONSTANTS } from '../../config/constants/Outpatient.constants';
import { extractErrorMessage, logError } from '../../utils/errorUtils';
import {
  useGetProvidersQuery,
  useGetServicesQuery,
  useGetSlotsQuery,
  useCreateAppointmentMutation,
  type OutpatientPatient,
  type AppointmentType,
} from '../../redux/slices/outpatientApi';

const L = OPD_LABELS.BOOKING;
const STEPS = [L.STEPS.PATIENT, L.STEPS.CATEGORY, L.STEPS.PROVIDER, L.STEPS.CONFIRM];

const BookingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const [patient, setPatient] = useState<OutpatientPatient | null>(null);
  const [apptType, setApptType] = useState<AppointmentType>('consultation');
  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [serviceId, setServiceId] = useState<number | ''>('');
  const [date, setDate] = useState<Dayjs | null>(null);
  const [slotStart, setSlotStart] = useState('');

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const { data: providers } = useGetProvidersQuery();
  const { data: services } = useGetServicesQuery({ active: true });
  const [createAppointment, { isLoading: isBooking }] = useCreateAppointmentMutation();

  const providerType = apptType === 'service' ? 'service' : 'doctor';
  const providerId = apptType === 'service' ? serviceId : doctorId;

  const { data: slots, isFetching: slotsLoading, refetch: refetchSlots } = useGetSlotsQuery(
    {
      provider_type: providerType,
      provider_id: providerId as number,
      date: date ? date.format(OPD_CONSTANTS.API_DATE_FORMAT) : '',
    },
    { skip: providerId === '' || !date }
  );

  const available = useMemo(() => (slots ?? []).filter((s) => s.available), [slots]);

  const providerName = useMemo(() => {
    if (apptType === 'service') return services?.find((s) => s.id === serviceId)?.name ?? '';
    return providers?.find((d) => d.id === doctorId)?.name ?? '';
  }, [apptType, services, providers, serviceId, doctorId]);

  const notify = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const canNext = useMemo(() => {
    if (activeStep === 0) return !!patient;
    if (activeStep === 1) return true; // OPD + type are always set
    if (activeStep === 2) return providerId !== '' && !!date && !!slotStart;
    return true;
  }, [activeStep, patient, providerId, date, slotStart]);

  const resetProviderStep = () => {
    setDate(null);
    setSlotStart('');
  };

  const handleBook = async () => {
    if (!patient || !date || !slotStart) return;
    try {
      await createAppointment({
        patient_id: patient.id,
        appointment_type: apptType,
        ...(apptType === 'consultation'
          ? { doctor_id: doctorId as number }
          : { service_id: serviceId as number }),
        scheduled_start: date.format(OPD_CONSTANTS.API_DATE_FORMAT),
        time: slotStart,
      }).unwrap();
      notify(L.MESSAGES.SUCCESS, 'success');
      navigate('/outpatient');
    } catch (err: any) {
      logError(err, 'BookingFlow.createAppointment');
      if (err?.status === 409) {
        setSlotStart('');
        refetchSlots();
        notify(L.MESSAGES.SLOT_TAKEN, 'error');
        setActiveStep(2);
      } else {
        notify(extractErrorMessage(err, L.MESSAGES.ERROR), 'error');
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: OPD_CONSTANTS.LAYOUT.PAGE_PADDING }}>
      <Typography variant="h5" fontWeight={700}>
        {L.PAGE_TITLE}
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3, borderRadius: '12px', maxWidth: 720 }} elevation={0} variant="outlined">
        {activeStep === 0 && <PatientPicker selected={patient} onSelect={setPatient} />}

        {activeStep === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography sx={{ fontSize: 13, color: '#6B7280', mb: 1 }}>{L.CATEGORY.CHOOSE}</Typography>
              <ToggleButtonGroup exclusive value="opd" sx={{ gap: 1 }}>
                <ToggleButton
                  value="opd"
                  selected
                  sx={{
                    textTransform: 'none',
                    '&.Mui-selected': {
                      backgroundColor: '#EDE9FE',
                      color: OPD_CONSTANTS.THEME.PRIMARY,
                      borderColor: OPD_CONSTANTS.THEME.PRIMARY,
                    },
                  }}
                >
                  {L.CATEGORY.OPD}
                </ToggleButton>
                <Tooltip title={L.CATEGORY.IPD_DISABLED}>
                  <span>
                    <ToggleButton value="ipd" disabled sx={{ textTransform: 'none' }}>
                      {L.CATEGORY.IPD} · {L.CATEGORY.IPD_DISABLED}
                    </ToggleButton>
                  </span>
                </Tooltip>
              </ToggleButtonGroup>
            </Box>
            <Box>
              <ToggleButtonGroup
                exclusive
                value={apptType}
                onChange={(_e, v) => {
                  if (v) {
                    setApptType(v);
                    setDoctorId('');
                    setServiceId('');
                    resetProviderStep();
                  }
                }}
                sx={{ gap: 1 }}
              >
                <ToggleButton
                  value="consultation"
                  sx={{
                    textTransform: 'none',
                    '&.Mui-selected': { backgroundColor: '#EDE9FE', color: OPD_CONSTANTS.THEME.PRIMARY },
                  }}
                >
                  {L.CATEGORY.CONSULTATION}
                </ToggleButton>
                <ToggleButton
                  value="service"
                  sx={{
                    textTransform: 'none',
                    '&.Mui-selected': { backgroundColor: '#EDE9FE', color: OPD_CONSTANTS.THEME.PRIMARY },
                  }}
                >
                  {L.CATEGORY.SERVICE}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {apptType === 'consultation' ? (
              <TextField
                label={L.PROVIDER.DOCTOR}
                select
                size="small"
                value={doctorId}
                onChange={(e) => {
                  setDoctorId(Number(e.target.value));
                  resetProviderStep();
                }}
                sx={{ maxWidth: 320 }}
              >
                {(providers ?? []).map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                label={L.PROVIDER.SERVICE}
                select
                size="small"
                value={serviceId}
                onChange={(e) => {
                  setServiceId(Number(e.target.value));
                  resetProviderStep();
                }}
                sx={{ maxWidth: 320 }}
              >
                {(services ?? []).map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {providerId === '' ? (
              <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
                {apptType === 'consultation' ? L.PROVIDER.PICK_PROVIDER : L.PROVIDER.PICK_SERVICE}
              </Typography>
            ) : (
              <>
                <Box>
                  <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 0.5 }}>{L.PROVIDER.DATE}</Typography>
                  <PharmaDatePicker
                    value={date}
                    onChange={(v) => {
                      setDate(v);
                      setSlotStart('');
                    }}
                    width={220}
                    height={44}
                    minDate={dayjs().startOf('day')}
                  />
                </Box>
                {date && (
                  <Box>
                    <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 1 }}>{L.PROVIDER.SLOTS}</Typography>
                    {slotsLoading ? (
                      <CircularProgress size={22} />
                    ) : available.length === 0 ? (
                      <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{L.PROVIDER.NO_SLOTS}</Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {available.map((s) => {
                          const isSel = s.start === slotStart;
                          return (
                            <StandardButton
                              key={s.start}
                              variant={isSel ? 'primary' : 'secondary'}
                              size="small"
                              onClick={() => setSlotStart(s.start)}
                            >
                              {s.start}
                            </StandardButton>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {activeStep === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>{L.CONFIRM.TITLE}</Typography>
            <SummaryRow label={L.CONFIRM.PATIENT} value={patient?.name ?? '—'} />
            <SummaryRow label={L.CONFIRM.TYPE} value={OPD_LABELS.TYPE_LABELS[apptType]} />
            <SummaryRow label={L.CONFIRM.PROVIDER} value={providerName || '—'} />
            <SummaryRow
              label={L.CONFIRM.DATETIME}
              value={date ? `${date.format(OPD_CONSTANTS.DATE_FORMAT)} ${slotStart}` : '—'}
            />
          </Box>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 1, maxWidth: 720 }}>
        <StandardButton
          variant="secondary"
          size="medium"
          disabled={activeStep === 0}
          onClick={() => setActiveStep((s) => s - 1)}
        >
          {L.NAV.BACK}
        </StandardButton>
        <Box sx={{ flex: 1 }} />
        {activeStep < STEPS.length - 1 ? (
          <StandardButton
            variant="primary"
            size="medium"
            disabled={!canNext}
            onClick={() => setActiveStep((s) => s + 1)}
          >
            {L.NAV.NEXT}
          </StandardButton>
        ) : (
          <StandardButton variant="primary" size="medium" disabled={isBooking} onClick={handleBook}>
            {L.CONFIRM.BOOK}
          </StandardButton>
        )}
      </Box>

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

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F1F4', py: 1 }}>
    <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{label}</Typography>
    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{value}</Typography>
  </Box>
);

export default BookingFlow;
