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
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import DoneIcon from '@mui/icons-material/Done';
import CancelIcon from '@mui/icons-material/Cancel';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { StandardButton } from '../../components/Common';
import PatientPicker from '../../components/Outpatient/PatientPicker';
import ConfirmationDialog from '../../components/DeleteDialogue/ConfirmationDialog';
import { OPD_LABELS } from '../../config/label/Outpatient.labels';
import { OPD_CONSTANTS } from '../../config/constants/Outpatient.constants';
import { extractErrorMessage, logError } from '../../utils/errorUtils';
import {
  useGetServiceOrdersQuery,
  useGetServiceOrderQuery,
  useGetServicesQuery,
  useCreateServiceOrderMutation,
  useCompleteServiceSessionMutation,
  useCancelServiceOrderMutation,
  useReopenServiceOrderMutation,
  type ServiceOrder,
  type ServiceOrderStatus,
  type GetServiceOrdersParams,
  type OutpatientPatient,
} from '../../redux/slices/outpatientApi';

dayjs.extend(utc);

const L = OPD_LABELS.SERVICE_ORDERS;

const formatOpdDate = (value?: string | null) =>
  value ? dayjs.utc(value).format(OPD_CONSTANTS.DATE_FORMAT) : '—';

const ServiceOrderStatusChip: React.FC<{ status: ServiceOrderStatus }> = ({ status }) => {
  const cfg = OPD_CONSTANTS.SERVICE_ORDER_STATUS_CHIP[status] ?? { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <Chip
      label={L.STATUS_LABELS[status] ?? status}
      size="small"
      sx={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 600, height: 24 }}
    />
  );
};

// Appointment status chip (reused for the linked sessions in the details dialog).
const ApptStatusChip: React.FC<{ status: string }> = ({ status }) => {
  const cfg = OPD_CONSTANTS.STATUS_CHIP[status] ?? { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <Chip
      label={OPD_LABELS.STATUS_LABELS[status] ?? status}
      size="small"
      sx={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 600, height: 22 }}
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

const ServiceOrders: React.FC = () => {
  const navigate = useNavigate();

  const [tab, setTab] = useState<ServiceOrderStatus | ''>('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc',
  });

  const [cancelTarget, setCancelTarget] = useState<ServiceOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [viewId, setViewId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const params: GetServiceOrdersParams = useMemo(
    () => (tab === '' ? {} : { status: tab }),
    [tab]
  );
  const { data, isLoading, error } = useGetServiceOrdersQuery(params);
  const rows = useMemo(() => data?.service_orders ?? [], [data]);

  const [completeSession] = useCompleteServiceSessionMutation();
  const [cancelOrder] = useCancelServiceOrderMutation();

  const notify = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const handleComplete = async (order: ServiceOrder) => {
    try {
      await completeSession({ id: order.id }).unwrap();
      notify(L.MESSAGES.COMPLETE_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'ServiceOrders.completeSession');
      notify(extractErrorMessage(err, L.MESSAGES.COMPLETE_ERROR), 'error');
    }
  };

  const handleBook = (order: ServiceOrder) => {
    navigate('/outpatient/book', {
      state: {
        serviceOrderId: order.id,
        patient: order.Patient,
        serviceId: order.service_id,
        serviceName: order.Service?.name,
      },
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const id = cancelTarget.id;
    setCancelTarget(null);
    try {
      await cancelOrder({ id, reason: cancelReason.trim() || undefined }).unwrap();
      notify(L.MESSAGES.CANCEL_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'ServiceOrders.cancel');
      notify(extractErrorMessage(err, L.MESSAGES.CANCEL_ERROR), 'error');
    } finally {
      setCancelReason('');
    }
  };

  const columns: TableColumn<ServiceOrder>[] = [
    {
      key: 'patient',
      header: L.TABLE.PATIENT,
      render: (o) => (
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{o.Patient?.name ?? '—'}</Typography>
          <Typography sx={{ fontSize: 12, color: '#6B7280' }}>{o.Patient?.phone ?? ''}</Typography>
        </Box>
      ),
    },
    {
      key: 'service',
      header: L.TABLE.SERVICE,
      render: (o) => o.Service?.name ?? '—',
    },
    {
      key: 'sessions',
      header: L.TABLE.SESSIONS,
      render: (o) => (
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
            {o.completed_sessions} / {o.total_sessions}
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#6B7280' }}>
            {o.remaining_sessions} {L.SESSIONS_LEFT}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'status',
      header: L.TABLE.STATUS,
      render: (o) => <ServiceOrderStatusChip status={o.status} />,
    },
    {
      key: 'created_at',
      header: L.TABLE.CREATED,
      sortable: true,
      render: (o) => formatOpdDate(o.created_at),
    },
    {
      key: 'actions',
      header: L.TABLE.ACTIONS,
      columnWidth: '180px',
      render: (o) => {
        const canBook =
          (o.status === 'pending' || o.status === 'scheduled') && o.remaining_sessions > 0;
        const canComplete = o.remaining_sessions > 0 && o.status !== 'cancelled';
        const canCancel = o.status !== 'completed' && o.status !== 'cancelled';
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title={L.ACTIONS.VIEW}>
              <IconButton size="small" onClick={() => setViewId(o.id)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canBook && (
              <Tooltip title={L.ACTIONS.BOOK}>
                <IconButton
                  size="small"
                  onClick={() => handleBook(o)}
                  sx={{ color: OPD_CONSTANTS.THEME.PRIMARY }}
                >
                  <EventAvailableIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canComplete && (
              <Tooltip title={L.ACTIONS.COMPLETE}>
                <IconButton size="small" onClick={() => handleComplete(o)} sx={{ color: '#15803D' }}>
                  <DoneIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canCancel && (
              <Tooltip title={L.ACTIONS.CANCEL}>
                <IconButton size="small" onClick={() => setCancelTarget(o)} sx={{ color: '#B91C1C' }}>
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
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
          onClick={() => setCreateOpen(true)}
          sx={{
            backgroundColor: OPD_CONSTANTS.THEME.PRIMARY,
            textTransform: 'none',
            borderRadius: '8px',
            '&:hover': { backgroundColor: OPD_CONSTANTS.THEME.PRIMARY_HOVER },
          }}
        >
          {L.NEW_BUTTON}
        </Button>
      </Box>

      <Tabs
        value={tab}
        onChange={(_e, v) => {
          setTab(v);
          setCurrentPage(1);
        }}
        sx={{ '& .MuiTabs-indicator': { backgroundColor: OPD_CONSTANTS.THEME.PRIMARY }, '& .Mui-selected': { color: `${OPD_CONSTANTS.THEME.PRIMARY} !important` } }}
      >
        {OPD_CONSTANTS.SERVICE_ORDER_STATUS_OPTIONS.map((o) => (
          <Tab key={o.value} value={o.value} label={o.label} sx={{ textTransform: 'none' }} />
        ))}
      </Tabs>

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

      {/* Details dialog */}
      <ServiceOrderViewDialog
        id={viewId}
        onClose={() => setViewId(null)}
        notify={notify}
      />

      {/* Create dialog */}
      <CreateServiceOrderDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        notify={notify}
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
// Details dialog: fetches the service order + its linked appointments on open,
// and can reopen a cancelled order. Kept inline as it is only used here.
// ---------------------------------------------------------------------------
interface ViewDialogProps {
  id: number | null;
  onClose: () => void;
  notify: (message: string, severity: 'success' | 'error') => void;
}

const ServiceOrderViewDialog: React.FC<ViewDialogProps> = ({ id, onClose, notify }) => {
  const VL = L.VIEW_DIALOG;
  const { data, isFetching } = useGetServiceOrderQuery(id as number, { skip: id === null });
  const [reopenOrder, { isLoading: isReopening }] = useReopenServiceOrderMutation();

  const order = data?.service_order;
  const appointments = data?.appointments ?? [];

  const handleReopen = async () => {
    if (!order) return;
    try {
      await reopenOrder({ id: order.id }).unwrap();
      notify(L.MESSAGES.REOPEN_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'ServiceOrders.reopen');
      notify(extractErrorMessage(err, L.MESSAGES.REOPEN_ERROR), 'error');
    }
  };

  return (
    <Dialog open={id !== null} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{VL.TITLE}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 2 }}>
        {isFetching || !order ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={26} />
          </Box>
        ) : (
          <>
            <DetailRow label={VL.PATIENT} value={order.Patient?.name ?? '—'} />
            <DetailRow label={VL.PHONE} value={order.Patient?.phone ?? '—'} />
            <DetailRow label={VL.SERVICE} value={order.Service?.name ?? '—'} />
            <DetailRow label={VL.STATUS} value={<ServiceOrderStatusChip status={order.status} />} />
            <DetailRow
              label={VL.SESSIONS}
              value={`${order.completed_sessions} / ${order.total_sessions} (${order.remaining_sessions} ${L.SESSIONS_LEFT})`}
            />
            {order.notes && <DetailRow label={VL.NOTES} value={order.notes} />}
            {order.cancelled_reason && (
              <DetailRow label={VL.CANCEL_REASON} value={order.cancelled_reason} />
            )}

            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 0.5 }}>
                {VL.APPOINTMENTS}
              </Typography>
              {appointments.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{VL.NO_APPOINTMENTS}</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {appointments.map((a) => (
                    <Box
                      key={a.id}
                      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}
                    >
                      <Typography sx={{ fontSize: 13 }}>
                        {dayjs.utc(a.scheduled_start).format(OPD_CONSTANTS.DATETIME_FORMAT)}
                      </Typography>
                      <ApptStatusChip status={a.status} />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {order?.status === 'cancelled' && (
          <StandardButton variant="primary" size="small" disabled={isReopening} onClick={handleReopen}>
            {VL.REOPEN}
          </StandardButton>
        )}
        <StandardButton variant="secondary" size="small" onClick={onClose}>
          {VL.CLOSE}
        </StandardButton>
      </DialogActions>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Create dialog: pick a patient + service, set total sessions (prefilled from
// the service's default_sessions) and optional notes. Kept inline (used here).
// ---------------------------------------------------------------------------
interface CreateDialogProps {
  open: boolean;
  onClose: () => void;
  notify: (message: string, severity: 'success' | 'error') => void;
}

const CreateServiceOrderDialog: React.FC<CreateDialogProps> = ({ open, onClose, notify }) => {
  const CL = L.NEW_DIALOG;
  const { data: services } = useGetServicesQuery({ active: true });
  const [createServiceOrder, { isLoading: isCreating }] = useCreateServiceOrderMutation();

  const [patient, setPatient] = useState<OutpatientPatient | null>(null);
  const [serviceId, setServiceId] = useState<number | ''>('');
  const [totalSessions, setTotalSessions] = useState<number | ''>(1);
  const [notes, setNotes] = useState('');
  const [showError, setShowError] = useState(false);

  // Reset local state whenever the dialog opens.
  React.useEffect(() => {
    if (open) {
      setPatient(null);
      setServiceId('');
      setTotalSessions(1);
      setNotes('');
      setShowError(false);
    }
  }, [open]);

  const handleServiceChange = (value: number) => {
    setServiceId(value);
    const svc = services?.find((s) => s.id === value);
    setTotalSessions(svc?.default_sessions && svc.default_sessions > 0 ? svc.default_sessions : 1);
  };

  const valid = !!patient && serviceId !== '' && totalSessions !== '' && Number(totalSessions) >= 1;

  const handleCreate = async () => {
    if (!patient || serviceId === '' || totalSessions === '' || Number(totalSessions) < 1) {
      setShowError(true);
      return;
    }
    try {
      await createServiceOrder({
        patient_id: patient.id,
        service_id: serviceId,
        total_sessions: Number(totalSessions),
        notes: notes.trim() || undefined,
      }).unwrap();
      notify(L.MESSAGES.CREATE_SUCCESS, 'success');
      onClose();
    } catch (err) {
      logError(err, 'ServiceOrders.create');
      notify(extractErrorMessage(err, L.MESSAGES.CREATE_ERROR), 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{CL.TITLE}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 0.5 }}>{CL.PATIENT}</Typography>
          <PatientPicker selected={patient} onSelect={setPatient} />
        </Box>
        <TextField
          label={CL.SERVICE}
          select
          size="small"
          value={serviceId}
          onChange={(e) => handleServiceChange(Number(e.target.value))}
          fullWidth
          SelectProps={{ displayEmpty: true }}
        >
          <MenuItem value="" disabled>
            {CL.PICK_SERVICE}
          </MenuItem>
          {(services ?? []).map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={CL.TOTAL_SESSIONS}
          type="number"
          size="small"
          value={totalSessions}
          onChange={(e) => setTotalSessions(e.target.value === '' ? '' : Number(e.target.value))}
          inputProps={{ min: 1 }}
          sx={{ maxWidth: 200 }}
        />
        <TextField
          label={CL.NOTES}
          size="small"
          multiline
          minRows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          fullWidth
        />
        {showError && !valid && (
          <Typography sx={{ fontSize: 13, color: '#B91C1C' }}>{CL.VALIDATION}</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <StandardButton variant="secondary" size="small" onClick={onClose}>
          {CL.CANCEL}
        </StandardButton>
        <StandardButton variant="primary" size="small" disabled={isCreating} onClick={handleCreate}>
          {CL.CREATE}
        </StandardButton>
      </DialogActions>
    </Dialog>
  );
};

export default ServiceOrders;
