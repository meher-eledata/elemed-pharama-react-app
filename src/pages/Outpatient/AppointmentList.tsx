import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import CancelIcon from '@mui/icons-material/Cancel';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { PharmaDatePicker, StandardButton } from '../../components/Common';
import ConfirmationDialog from '../../components/DeleteDialogue/ConfirmationDialog';
import { OPD_LABELS } from '../../config/label/Outpatient.labels';
import { OPD_CONSTANTS } from '../../config/constants/Outpatient.constants';
import { extractErrorMessage, logError } from '../../utils/errorUtils';
import {
  useGetAppointmentsQuery,
  useGetProvidersQuery,
  useGetServicesQuery,
  useGetSlotsQuery,
  useCheckInAppointmentMutation,
  useCancelAppointmentMutation,
  useRescheduleAppointmentMutation,
  useSetAppointmentStatusMutation,
  type OutpatientAppointment,
  type GetAppointmentsParams,
  type AppointmentStatus,
  type AppointmentType,
  type AppointmentSource,
} from '../../redux/slices/outpatientApi';

dayjs.extend(utc);

const L = OPD_LABELS.APPOINTMENTS;

// OPD scheduled times are stored as naive UTC-labeled wall-clock; format in UTC
// so a 14:00 booking reads back as 14:00 regardless of the browser timezone.
const formatOpdDateTime = (value?: string | null) =>
  value ? dayjs.utc(value).format(OPD_CONSTANTS.DATETIME_FORMAT) : '—';

const StatusChip: React.FC<{ status: AppointmentStatus }> = ({ status }) => {
  const cfg = OPD_CONSTANTS.STATUS_CHIP[status] ?? { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <Chip
      label={OPD_LABELS.STATUS_LABELS[status] ?? status}
      size="small"
      sx={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 600, height: 24 }}
    />
  );
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
    <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{label}</Typography>
    {typeof value === 'string' ? (
      <Typography sx={{ fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{value}</Typography>
    ) : (
      value
    )}
  </Box>
);

const AppointmentList: React.FC = () => {
  const navigate = useNavigate();
  const today = useMemo(() => dayjs().startOf('day'), []);

  const [tab, setTab] = useState<'upcoming' | 'historical'>('upcoming');
  const [from, setFrom] = useState<Dayjs | null>(null);
  const [to, setTo] = useState<Dayjs | null>(null);
  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [serviceId, setServiceId] = useState<number | ''>('');
  const [status, setStatus] = useState<AppointmentStatus | ''>('');
  const [type, setType] = useState<AppointmentType | ''>('');
  const [source, setSource] = useState<AppointmentSource | ''>('');
  const [q, setQ] = useState('');

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'scheduled_start',
    direction: 'asc',
  });

  const [cancelTarget, setCancelTarget] = useState<OutpatientAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState<OutpatientAppointment | null>(null);
  const [viewTarget, setViewTarget] = useState<OutpatientAppointment | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const { data: providers } = useGetProvidersQuery();
  const { data: services } = useGetServicesQuery();
  const [checkIn] = useCheckInAppointmentMutation();
  const [cancelAppointment] = useCancelAppointmentMutation();
  const [rescheduleAppointment, { isLoading: isRescheduling }] = useRescheduleAppointmentMutation();
  const [setAppointmentStatus, { isLoading: isSettingStatus }] = useSetAppointmentStatusMutation();

  // Build query params. Tab sets the date bound; explicit From/To override.
  const params: GetAppointmentsParams = useMemo(() => {
    const apiDate = OPD_CONSTANTS.API_DATE_FORMAT;
    const p: GetAppointmentsParams = {};
    if (from) p.date_from = from.format(apiDate);
    else if (tab === 'upcoming') p.date_from = today.format(apiDate);
    if (to) p.date_to = to.format(apiDate);
    else if (tab === 'historical') p.date_to = today.format(apiDate);
    if (doctorId !== '') p.doctor_id = doctorId;
    if (serviceId !== '') p.service_id = serviceId;
    if (status !== '') p.status = status;
    if (type !== '') p.appointment_type = type;
    if (source !== '') p.source = source;
    if (q.trim()) p.q = q.trim();
    return p;
  }, [from, to, tab, today, doctorId, serviceId, status, type, source, q]);

  const { data, isLoading, error } = useGetAppointmentsQuery(params);

  const rows = useMemo(() => data?.appointments ?? [], [data]);

  // Keep the open details dialog in sync with refreshed list data.
  React.useEffect(() => {
    if (!viewTarget) return;
    const fresh = rows.find((r) => r.id === viewTarget.id);
    if (fresh && fresh !== viewTarget) setViewTarget(fresh);
  }, [rows, viewTarget]);

  const notify = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const handleCheckIn = async (appt: OutpatientAppointment) => {
    try {
      await checkIn({ id: appt.id }).unwrap();
      notify(L.MESSAGES.CHECK_IN_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'AppointmentList.checkIn');
      notify(extractErrorMessage(err, L.MESSAGES.CHECK_IN_ERROR), 'error');
    }
  };

  const handleChangeStatus = async (id: number, next: AppointmentStatus) => {
    try {
      const res = await setAppointmentStatus({ id, status: next }).unwrap();
      setViewTarget(res.appointment);
      notify(L.MESSAGES.STATUS_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'AppointmentList.setStatus');
      notify(extractErrorMessage(err, L.MESSAGES.STATUS_ERROR), 'error');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const id = cancelTarget.id;
    setCancelTarget(null);
    try {
      await cancelAppointment({ id, reason: cancelReason.trim() || undefined }).unwrap();
      notify(L.MESSAGES.CANCEL_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'AppointmentList.cancel');
      notify(extractErrorMessage(err, L.MESSAGES.CANCEL_ERROR), 'error');
    } finally {
      setCancelReason('');
    }
  };

  const columns: TableColumn<OutpatientAppointment>[] = [
    {
      key: 'patient',
      header: L.TABLE.PATIENT,
      render: (a) => (
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{a.Patient?.name ?? '—'}</Typography>
          <Typography sx={{ fontSize: 12, color: '#6B7280' }}>{a.Patient?.phone ?? ''}</Typography>
        </Box>
      ),
    },
    {
      key: 'appointment_type',
      header: L.TABLE.TYPE,
      render: (a) => OPD_LABELS.TYPE_LABELS[a.appointment_type] ?? a.appointment_type,
    },
    {
      key: 'provider',
      header: L.TABLE.PROVIDER,
      render: (a) => a.Doctor?.name ?? a.Service?.name ?? '—',
    },
    {
      key: 'scheduled_start',
      header: L.TABLE.DATETIME,
      sortable: true,
      render: (a) => formatOpdDateTime(a.scheduled_start),
    },
    {
      key: 'status',
      header: L.TABLE.STATUS,
      render: (a) => <StatusChip status={a.status} />,
    },
    {
      key: 'source',
      header: L.TABLE.SOURCE,
      render: (a) => OPD_LABELS.SOURCE_LABELS[a.source] ?? a.source,
    },
    {
      key: 'actions',
      header: L.TABLE.ACTIONS,
      columnWidth: '180px',
      render: (a) => {
        const closed = a.status === 'cancelled' || a.status === 'completed' || a.status === 'no_show';
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title={L.ACTIONS.VIEW}>
              <IconButton size="small" onClick={() => setViewTarget(a)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={L.ACTIONS.CHECK_IN}>
              <span>
                <IconButton
                  size="small"
                  disabled={a.status !== 'scheduled'}
                  onClick={() => handleCheckIn(a)}
                  sx={{ color: '#15803D' }}
                >
                  <HowToRegIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={L.ACTIONS.RESCHEDULE}>
              <span>
                <IconButton
                  size="small"
                  disabled={closed}
                  onClick={() => setRescheduleTarget(a)}
                  sx={{ color: OPD_CONSTANTS.THEME.PRIMARY }}
                >
                  <EditCalendarIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={L.ACTIONS.CANCEL}>
              <span>
                <IconButton
                  size="small"
                  disabled={closed}
                  onClick={() => setCancelTarget(a)}
                  sx={{ color: '#B91C1C' }}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  const handleSortRequest = (key: string) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  const clearFilters = () => {
    setFrom(null);
    setTo(null);
    setDoctorId('');
    setServiceId('');
    setStatus('');
    setType('');
    setSource('');
    setQ('');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: OPD_CONSTANTS.LAYOUT.PAGE_GAP, p: OPD_CONSTANTS.LAYOUT.PAGE_PADDING }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {L.PAGE_TITLE}
          </Typography>
          <Typography sx={{ color: '#6B7280', fontSize: 14 }}>{L.SUBTITLE}</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/outpatient/book')}
          sx={{
            backgroundColor: OPD_CONSTANTS.THEME.PRIMARY,
            textTransform: 'none',
            borderRadius: '8px',
            '&:hover': { backgroundColor: OPD_CONSTANTS.THEME.PRIMARY_HOVER },
          }}
        >
          {L.BOOK_BUTTON}
        </Button>
      </Box>

      <Tabs
        value={tab}
        onChange={(_e, v) => setTab(v)}
        sx={{ '& .MuiTabs-indicator': { backgroundColor: OPD_CONSTANTS.THEME.PRIMARY }, '& .Mui-selected': { color: `${OPD_CONSTANTS.THEME.PRIMARY} !important` } }}
      >
        <Tab value="upcoming" label={L.TABS.UPCOMING} sx={{ textTransform: 'none' }} />
        <Tab value="historical" label={L.TABS.HISTORICAL} sx={{ textTransform: 'none' }} />
      </Tabs>

      {/* Filter bar */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-end' }}>
        <PharmaDatePicker value={from} onChange={setFrom} label={L.FILTERS.FROM} width={150} height={40} />
        <PharmaDatePicker value={to} onChange={setTo} label={L.FILTERS.TO} width={150} height={40} minDate={from ?? undefined} />
        <TextField
          label={L.FILTERS.DOCTOR}
          select
          size="small"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">{L.FILTERS.ALL}</MenuItem>
          {(providers ?? []).map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={L.FILTERS.SERVICE}
          select
          size="small"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">{L.FILTERS.ALL}</MenuItem>
          {(services ?? []).map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={L.FILTERS.STATUS}
          select
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value as AppointmentStatus | '')}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">{L.FILTERS.ALL}</MenuItem>
          {OPD_CONSTANTS.STATUS_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={L.FILTERS.TYPE}
          select
          size="small"
          value={type}
          onChange={(e) => setType(e.target.value as AppointmentType | '')}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">{L.FILTERS.ALL}</MenuItem>
          {OPD_CONSTANTS.TYPE_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={L.FILTERS.SOURCE}
          select
          size="small"
          value={source}
          onChange={(e) => setSource(e.target.value as AppointmentSource | '')}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">{L.FILTERS.ALL}</MenuItem>
          {OPD_CONSTANTS.SOURCE_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          placeholder={L.SEARCH_PLACEHOLDER}
          size="small"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <StandardButton variant="text" size="small" onClick={clearFilters} sx={{ color: OPD_CONSTANTS.THEME.PRIMARY }}>
          {L.FILTERS.CLEAR}
        </StandardButton>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>{L.MESSAGES.ERROR}</Box>
      ) : (
        <ReusableTable
          columns={columns}
          data={rows}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          emptyMessage={L.MESSAGES.EMPTY}
          searchAndFilterConfig={{ filterOptions: [] }}
          currentSearchTerm=""
          onSearchChange={() => {}}
          showFilters={false}
          onShowFiltersToggle={() => {}}
          currentFilterKey=""
          onFilterSelect={() => {}}
          hideDefaultSearch
          totalRows={rows.length}
          rowsPerPage={OPD_CONSTANTS.PAGINATION.ROWS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={handleSortRequest}
          sortConfig={sortConfig}
        />
      )}

      {/* Appointment details dialog */}
      <Dialog open={viewTarget !== null} onClose={() => setViewTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{L.VIEW_DIALOG.TITLE}</DialogTitle>
        {viewTarget && (
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2 }}>
            <DetailRow label={L.VIEW_DIALOG.PATIENT} value={viewTarget.Patient?.name ?? '—'} />
            <DetailRow label={L.VIEW_DIALOG.PHONE} value={viewTarget.Patient?.phone ?? '—'} />
            <DetailRow
              label={L.VIEW_DIALOG.TYPE}
              value={OPD_LABELS.TYPE_LABELS[viewTarget.appointment_type] ?? viewTarget.appointment_type}
            />
            <DetailRow
              label={L.VIEW_DIALOG.PROVIDER}
              value={viewTarget.Doctor?.name ?? viewTarget.Service?.name ?? '—'}
            />
            <DetailRow label={L.VIEW_DIALOG.DATETIME} value={formatOpdDateTime(viewTarget.scheduled_start)} />
            <DetailRow
              label={L.VIEW_DIALOG.STATUS}
              value={<StatusChip status={viewTarget.status} />}
            />
            <DetailRow
              label={L.VIEW_DIALOG.SOURCE}
              value={OPD_LABELS.SOURCE_LABELS[viewTarget.source] ?? viewTarget.source}
            />
            {viewTarget.token_number != null && (
              <DetailRow label={L.VIEW_DIALOG.TOKEN} value={String(viewTarget.token_number)} />
            )}
            {viewTarget.check_in_at && (
              <DetailRow label={L.VIEW_DIALOG.CHECK_IN_AT} value={formatOpdDateTime(viewTarget.check_in_at)} />
            )}
            {viewTarget.cancelled_reason && (
              <DetailRow label={L.VIEW_DIALOG.CANCEL_REASON} value={viewTarget.cancelled_reason} />
            )}

            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 0.5 }}>
                {L.VIEW_DIALOG.CHANGE_STATUS}
              </Typography>
              {(OPD_CONSTANTS.STATUS_TRANSITIONS[viewTarget.status] ?? []).length === 0 ? (
                <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{L.VIEW_DIALOG.NO_TRANSITIONS}</Typography>
              ) : (
                <TextField
                  select
                  size="small"
                  value=""
                  disabled={isSettingStatus}
                  onChange={(e) => handleChangeStatus(viewTarget.id, e.target.value as AppointmentStatus)}
                  fullWidth
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="" disabled>
                    {L.VIEW_DIALOG.CHANGE_STATUS}
                  </MenuItem>
                  {(OPD_CONSTANTS.STATUS_TRANSITIONS[viewTarget.status] ?? []).map((s) => (
                    <MenuItem key={s} value={s}>
                      {OPD_LABELS.STATUS_LABELS[s] ?? s}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Box>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <StandardButton variant="secondary" size="small" onClick={() => setViewTarget(null)}>
            {L.VIEW_DIALOG.CLOSE}
          </StandardButton>
        </DialogActions>
      </Dialog>

      {/* Reschedule dialog */}
      <RescheduleDialog
        target={rescheduleTarget}
        loading={isRescheduling}
        onClose={() => setRescheduleTarget(null)}
        onSubmit={async (date, slotStart) => {
          if (!rescheduleTarget) return;
          try {
            await rescheduleAppointment({
              id: rescheduleTarget.id,
              scheduled_start: date,
              time: slotStart,
            }).unwrap();
            notify(L.MESSAGES.RESCHEDULE_SUCCESS, 'success');
            setRescheduleTarget(null);
          } catch (err: any) {
            logError(err, 'AppointmentList.reschedule');
            const msg =
              err?.status === 409
                ? L.MESSAGES.SLOT_TAKEN
                : extractErrorMessage(err, L.MESSAGES.RESCHEDULE_ERROR);
            notify(msg, 'error');
          }
        }}
      />

      {/* Cancel dialog */}
      <ConfirmationDialog
        open={cancelTarget !== null}
        title={L.CANCEL_DIALOG.TITLE}
        message={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            <Typography sx={{ fontSize: 14 }}>{L.CANCEL_DIALOG.MESSAGE}</Typography>
            <TextField
              label={L.CANCEL_DIALOG.REASON}
              size="small"
              multiline
              minRows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              fullWidth
            />
          </Box>
        }
        confirmLabel={L.CANCEL_DIALOG.CONFIRM}
        cancelLabel={L.CANCEL_DIALOG.DISMISS}
        onClose={() => {
          setCancelTarget(null);
          setCancelReason('');
        }}
        onCancel={() => {
          setCancelTarget(null);
          setCancelReason('');
        }}
        onConfirm={handleConfirmCancel}
      />

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

// ---------------------------------------------------------------------------
// Reschedule dialog: picks a date, fetches slots for the appointment's provider,
// and submits the chosen slot. Kept inline as it is only used here.
// ---------------------------------------------------------------------------
interface RescheduleDialogProps {
  target: OutpatientAppointment | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (date: string, slotStart: string) => void;
}

const RescheduleDialog: React.FC<RescheduleDialogProps> = ({ target, loading, onClose, onSubmit }) => {
  const RL = OPD_LABELS.APPOINTMENTS.RESCHEDULE_DIALOG;
  const [date, setDate] = useState<Dayjs | null>(null);
  const [slot, setSlot] = useState('');

  const providerType = target?.appointment_type === 'service' ? 'service' : 'doctor';
  const providerId = target?.appointment_type === 'service' ? target?.service_id : target?.doctor_id;

  const { data: slots, isFetching } = useGetSlotsQuery(
    {
      provider_type: providerType,
      provider_id: providerId as number,
      date: date ? date.format(OPD_CONSTANTS.API_DATE_FORMAT) : '',
    },
    { skip: !target || !date || !providerId }
  );

  // Reset local state whenever the target changes.
  React.useEffect(() => {
    setDate(null);
    setSlot('');
  }, [target?.id]);

  const available = (slots ?? []).filter((s) => s.available);

  return (
    <Dialog open={target !== null} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{RL.TITLE}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 0.5 }}>{RL.DATE}</Typography>
          <PharmaDatePicker
            value={date}
            onChange={(v) => {
              setDate(v);
              setSlot('');
            }}
            width="100%"
            height={44}
            minDate={dayjs().startOf('day')}
          />
        </Box>
        {date && (
          <TextField
            label={RL.SLOT}
            select
            size="small"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            disabled={isFetching || available.length === 0}
            helperText={!isFetching && available.length === 0 ? RL.NO_SLOTS : ' '}
            fullWidth
          >
            {available.map((s) => (
              <MenuItem key={s.start} value={s.start}>
                {s.start} – {s.end}
              </MenuItem>
            ))}
          </TextField>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <StandardButton variant="secondary" size="small" onClick={onClose}>
          {RL.CANCEL}
        </StandardButton>
        <StandardButton
          variant="primary"
          size="small"
          disabled={!date || !slot || loading}
          onClick={() => date && slot && onSubmit(date.format(OPD_CONSTANTS.API_DATE_FORMAT), slot)}
        >
          {RL.CONFIRM}
        </StandardButton>
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentList;
