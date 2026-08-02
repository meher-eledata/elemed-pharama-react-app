import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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
  Paper,
  Tooltip,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import CancelIcon from '@mui/icons-material/Cancel';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import ConfirmationDialog from '../../components/DeleteDialogue/ConfirmationDialog';
import { OPD_LABELS } from '../../config/label/Outpatient.labels';
import { OPD_CONSTANTS } from '../../config/constants/Outpatient.constants';
import { extractErrorMessage, logError } from '../../utils/errorUtils';
import { selectModuleRoles } from '../../redux/slices/orgSlice';
import {
  useGetProvidersQuery,
  useGetQueueQuery,
  useCallNextMutation,
  useCheckInAppointmentMutation,
  useSkipAppointmentMutation,
  useNoShowAppointmentMutation,
  useCancelWalkInMutation,
  useReorderQueueMutation,
  type QueueEntry,
  type OutpatientAppointment,
  type AppointmentStatus,
} from '../../redux/slices/outpatientApi';

dayjs.extend(utc);

const L = OPD_LABELS.QUEUE;

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

// Wait elapsed since check-in (or "—" if not checked in yet).
const waitText = (a: OutpatientAppointment): string => {
  if (!a.check_in_at) return '—';
  const mins = dayjs.utc().diff(dayjs.utc(a.check_in_at), 'minute');
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const LiveQueue: React.FC = () => {
  const currentUserId = useSelector((s: any) => s.auth.user?.id as number | undefined);
  const moduleRoles = useSelector(selectModuleRoles);
  const isDoctorRole = moduleRoles.outpatient === 'doctor';

  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const [noShowTarget, setNoShowTarget] = useState<OutpatientAppointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<OutpatientAppointment | null>(null);

  const { data: providers } = useGetProvidersQuery();

  // Resolve a doctor-role user's own provider record.
  const ownProvider = useMemo(
    () => (providers ?? []).find((p) => p.user_id === currentUserId),
    [providers, currentUserId]
  );

  // A doctor-role user is locked to their own provider; others may pick any.
  useEffect(() => {
    if (isDoctorRole && ownProvider && doctorId === '') {
      setDoctorId(ownProvider.id);
    }
  }, [isDoctorRole, ownProvider, doctorId]);

  const { data, isLoading, isFetching, error } = useGetQueueQuery(
    { doctor_id: doctorId === '' ? undefined : doctorId },
    { skip: doctorId === '', pollingInterval: OPD_CONSTANTS.QUEUE_POLL_MS }
  );

  const [callNext, { isLoading: isCalling }] = useCallNextMutation();
  const [checkIn] = useCheckInAppointmentMutation();
  const [skip] = useSkipAppointmentMutation();
  const [noShow] = useNoShowAppointmentMutation();
  const [cancelWalkIn] = useCancelWalkInMutation();
  const [reorderQueue] = useReorderQueueMutation();

  const entries = useMemo<QueueEntry[]>(() => data?.queue ?? [], [data]);
  const serving = entries.find((e) => e.appointment.status === 'in_consultation');
  const waitingEntries = entries.filter((e) => e.appointment.status !== 'in_consultation');

  const notify = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const handleCallNext = async () => {
    if (doctorId === '') return;
    try {
      await callNext({ doctor_id: doctorId }).unwrap();
      notify(L.MESSAGES.CALL_NEXT_SUCCESS, 'success');
    } catch (err: any) {
      logError(err, 'LiveQueue.callNext');
      const msg = err?.status === 404 ? L.MESSAGES.CALL_NEXT_EMPTY : extractErrorMessage(err, L.MESSAGES.CALL_NEXT_ERROR);
      notify(msg, 'error');
    }
  };

  const handleCheckIn = async (a: OutpatientAppointment) => {
    try {
      await checkIn({ id: a.id }).unwrap();
      notify(L.MESSAGES.CHECK_IN_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'LiveQueue.checkIn');
      notify(extractErrorMessage(err, L.MESSAGES.CHECK_IN_ERROR), 'error');
    }
  };

  const handleSkip = async (a: OutpatientAppointment) => {
    try {
      await skip({ id: a.id }).unwrap();
      notify(L.MESSAGES.SKIP_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'LiveQueue.skip');
      notify(extractErrorMessage(err, L.MESSAGES.SKIP_ERROR), 'error');
    }
  };

  const handleConfirmNoShow = async () => {
    if (!noShowTarget) return;
    const id = noShowTarget.id;
    setNoShowTarget(null);
    try {
      await noShow({ id }).unwrap();
      notify(L.MESSAGES.NO_SHOW_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'LiveQueue.noShow');
      notify(extractErrorMessage(err, L.MESSAGES.NO_SHOW_ERROR), 'error');
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const id = cancelTarget.id;
    setCancelTarget(null);
    try {
      await cancelWalkIn({ id }).unwrap();
      notify(L.MESSAGES.CANCEL_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'LiveQueue.cancelWalkIn');
      notify(extractErrorMessage(err, L.MESSAGES.CANCEL_ERROR), 'error');
    }
  };

  // Reorder by swapping a waiting entry with its neighbour, then submit the full
  // ordered id list of the active (non-serving) queue.
  const handleMove = async (index: number, dir: -1 | 1) => {
    if (doctorId === '') return;
    const target = index + dir;
    if (target < 0 || target >= waitingEntries.length) return;
    const ids = waitingEntries.map((e) => e.appointment.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await reorderQueue({ doctor_id: doctorId, ordered_ids: ids }).unwrap();
      notify(L.MESSAGES.REORDER_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'LiveQueue.reorder');
      notify(extractErrorMessage(err, L.MESSAGES.REORDER_ERROR), 'error');
    }
  };

  const columns: TableColumn<QueueEntry>[] = [
    {
      key: 'position',
      header: L.POSITION,
      columnWidth: '64px',
      render: (e) => <Typography sx={{ fontWeight: 700 }}>{e.position}</Typography>,
    },
    {
      key: 'token',
      header: L.TOKEN,
      columnWidth: '80px',
      render: (e) => e.appointment.token_number ?? '—',
    },
    {
      key: 'patient',
      header: L.PATIENT,
      render: (e) => (
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{e.appointment.Patient?.name ?? '—'}</Typography>
          <Typography sx={{ fontSize: 12, color: '#6B7280' }}>{e.appointment.Patient?.phone ?? ''}</Typography>
        </Box>
      ),
    },
    {
      key: 'status',
      header: L.STATUS,
      render: (e) => <StatusChip status={e.appointment.status} />,
    },
    {
      key: 'source',
      header: L.SOURCE,
      render: (e) => OPD_LABELS.SOURCE_LABELS[e.appointment.source] ?? e.appointment.source,
    },
    {
      key: 'wait',
      header: L.WAIT,
      render: (e) => waitText(e.appointment),
    },
    {
      key: 'actions',
      header: L.ACTIONS,
      columnWidth: '260px',
      render: (e) => {
        const a = e.appointment;
        // index within the waiting list for reorder.
        const idx = waitingEntries.findIndex((w) => w.appointment.id === a.id);
        return (
          <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
            <Tooltip title={L.ACTIONS_LABELS.MOVE_UP}>
              <span>
                <IconButton size="small" disabled={idx <= 0} onClick={() => handleMove(idx, -1)}>
                  <KeyboardArrowUpIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={L.ACTIONS_LABELS.MOVE_DOWN}>
              <span>
                <IconButton
                  size="small"
                  disabled={idx < 0 || idx >= waitingEntries.length - 1}
                  onClick={() => handleMove(idx, 1)}
                >
                  <KeyboardArrowDownIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={L.ACTIONS_LABELS.CHECK_IN}>
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
            <Tooltip title={L.ACTIONS_LABELS.SKIP}>
              <IconButton size="small" onClick={() => handleSkip(a)} sx={{ color: OPD_CONSTANTS.THEME.PRIMARY }}>
                <SkipNextIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={L.ACTIONS_LABELS.NO_SHOW}>
              <IconButton size="small" onClick={() => setNoShowTarget(a)} sx={{ color: '#6B7280' }}>
                <PersonOffIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={L.ACTIONS_LABELS.CANCEL_WALK_IN}>
              <span>
                <IconButton
                  size="small"
                  disabled={a.source !== 'walk_in'}
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: OPD_CONSTANTS.LAYOUT.PAGE_GAP, p: OPD_CONSTANTS.LAYOUT.PAGE_PADDING }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {L.PAGE_TITLE}
          </Typography>
          <Typography sx={{ color: '#6B7280', fontSize: 14 }}>{L.SUBTITLE}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField
            label={L.DOCTOR}
            select
            size="small"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={isDoctorRole && !!ownProvider}
            helperText={isDoctorRole && ownProvider ? L.DOCTOR_LOCKED_HINT : ' '}
            sx={{ minWidth: 220 }}
          >
            {(providers ?? []).map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
                {d.branch ? ` · ${d.branch}` : ''}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            startIcon={isCalling ? <CircularProgress size={16} color="inherit" /> : <CampaignIcon />}
            disabled={doctorId === '' || isCalling || waitingEntries.length === 0}
            onClick={handleCallNext}
            sx={{
              backgroundColor: OPD_CONSTANTS.THEME.PRIMARY,
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': { backgroundColor: OPD_CONSTANTS.THEME.PRIMARY_HOVER },
            }}
          >
            {L.CALL_NEXT}
          </Button>
        </Box>
      </Box>

      {isDoctorRole && !ownProvider && (
        <Alert severity="info" sx={{ borderRadius: '8px' }}>
          {L.NOT_LINKED}
        </Alert>
      )}

      {doctorId === '' ? (
        <Box sx={{ p: 6, textAlign: 'center', color: '#6B7280' }}>{L.PICK_DOCTOR}</Box>
      ) : (
        <>
          {/* Now-serving highlight card */}
          {serving && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '12px',
                border: `2px solid ${OPD_CONSTANTS.THEME.PRIMARY}`,
                backgroundColor: '#FBF8FF',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <CampaignIcon sx={{ color: OPD_CONSTANTS.THEME.PRIMARY, fontSize: 32 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 12, color: OPD_CONSTANTS.THEME.PRIMARY, fontWeight: 700, letterSpacing: 0.5 }}>
                  {L.NOW_SERVING}
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
                  {serving.appointment.Patient?.name ?? '—'}
                  {serving.appointment.token_number != null && (
                    <Typography component="span" sx={{ color: '#6B7280', fontWeight: 600, ml: 1, fontSize: 14 }}>
                      {L.TOKEN} {serving.appointment.token_number}
                    </Typography>
                  )}
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{serving.appointment.Patient?.phone ?? ''}</Typography>
              </Box>
              <StatusChip status={serving.appointment.status} />
            </Paper>
          )}

          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1, color: '#374151' }}>
              {L.WAITING} ({waitingEntries.length})
            </Typography>
            {isLoading && !data ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Box sx={{ p: 4, textAlign: 'center', color: 'error.main' }}>{L.MESSAGES.ERROR}</Box>
            ) : (
              <ReusableTable
                columns={columns}
                data={waitingEntries}
                selectedRows={[]}
                setSelectedRows={() => {}}
                emptyMessage={L.MESSAGES.EMPTY}
                searchAndFilterConfig={{ filterOptions: [] }}
                currentSearchTerm=""
                onSearchChange={() => {}}
                showFilters={false}
                onShowFiltersToggle={() => {}}
                currentFilterKey=""
                onFilterSelect={() => {}}
                hideDefaultSearch
                totalRows={waitingEntries.length}
                rowsPerPage={waitingEntries.length || 1}
                currentPage={1}
                onPageChange={() => {}}
          onSortRequest={() => {}}
          sortConfig={{ key: '', direction: 'asc' }}
              />
            )}
            {isFetching && data && (
              <Typography sx={{ fontSize: 11, color: '#9CA3AF', mt: 0.5, textAlign: 'right' }}>
                Updating…
              </Typography>
            )}
          </Box>
        </>
      )}

      <ConfirmationDialog
        open={noShowTarget !== null}
        title={L.NO_SHOW_DIALOG.TITLE}
        message={L.NO_SHOW_DIALOG.MESSAGE}
        confirmLabel={L.NO_SHOW_DIALOG.CONFIRM}
        cancelLabel={L.NO_SHOW_DIALOG.DISMISS}
        onClose={() => setNoShowTarget(null)}
        onCancel={() => setNoShowTarget(null)}
        onConfirm={handleConfirmNoShow}
      />

      <ConfirmationDialog
        open={cancelTarget !== null}
        title={L.CANCEL_WALK_IN_DIALOG.TITLE}
        message={L.CANCEL_WALK_IN_DIALOG.MESSAGE}
        confirmLabel={L.CANCEL_WALK_IN_DIALOG.CONFIRM}
        cancelLabel={L.CANCEL_WALK_IN_DIALOG.DISMISS}
        onClose={() => setCancelTarget(null)}
        onCancel={() => setCancelTarget(null)}
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

export default LiveQueue;
