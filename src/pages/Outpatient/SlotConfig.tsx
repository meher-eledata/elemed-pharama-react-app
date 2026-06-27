import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  Chip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import dayjs, { Dayjs } from 'dayjs';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { PharmaDatePicker, StandardButton } from '../../components/Common';
import ConfirmationDialog from '../../components/DeleteDialogue/ConfirmationDialog';
import { OPD_LABELS } from '../../config/label/Outpatient.labels';
import { OPD_CONSTANTS } from '../../config/constants/Outpatient.constants';
import { extractErrorMessage, logError } from '../../utils/errorUtils';
import { selectOrgRole, selectModuleRoles } from '../../redux/slices/orgSlice';
import { useGetAllUsersQuery } from '../../redux/slices/adminSlice';
import {
  useGetProvidersQuery,
  useGetServicesQuery,
  useGetAvailabilityQuery,
  useCreateAvailabilityMutation,
  useUpdateAvailabilityMutation,
  useDeleteAvailabilityMutation,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useLinkProviderUserMutation,
  type OutpatientAvailability,
  type OutpatientService,
  type AvailabilityWriteRequest,
  type ProviderType,
} from '../../redux/slices/outpatientApi';

const L = OPD_LABELS.SLOT_CONFIG;

type Notify = (message: string, severity: 'success' | 'error') => void;

// ---------------------------------------------------------------------------
// Availability editor — shared between provider (doctor) and service sections.
// `canEdit` gates all write controls; read-only viewers see the table only.
// ---------------------------------------------------------------------------
interface AvailabilityEditorProps {
  providerType: ProviderType;
  providerId: number;
  canEdit: boolean;
  notify: Notify;
}

interface AvailabilityForm {
  mode: 'weekly' | 'date';
  weekday: number;
  specific_date: Dayjs | null;
  start_time: string;
  end_time: string;
  slot_duration_min: number;
  accepts_walk_ins: boolean;
  active: boolean;
}

const emptyForm = (): AvailabilityForm => ({
  mode: 'weekly',
  weekday: 1,
  specific_date: null,
  start_time: OPD_CONSTANTS.AVAILABILITY.DEFAULT_START,
  end_time: OPD_CONSTANTS.AVAILABILITY.DEFAULT_END,
  slot_duration_min: OPD_CONSTANTS.AVAILABILITY.DEFAULT_SLOT_MIN,
  accepts_walk_ins: true,
  active: true,
});

const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({ providerType, providerId, canEdit, notify }) => {
  const { data, isLoading, error } = useGetAvailabilityQuery({ provider_type: providerType, provider_id: providerId });
  const [createAvailability, { isLoading: isCreating }] = useCreateAvailabilityMutation();
  const [updateAvailability, { isLoading: isUpdating }] = useUpdateAvailabilityMutation();
  const [deleteAvailability] = useDeleteAvailabilityMutation();

  const [editing, setEditing] = useState<OutpatientAvailability | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<AvailabilityForm>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<OutpatientAvailability | null>(null);

  const rows = useMemo(() => data ?? [], [data]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (a: OutpatientAvailability) => {
    setEditing(a);
    setForm({
      mode: a.specific_date ? 'date' : 'weekly',
      weekday: a.weekday ?? 1,
      specific_date: a.specific_date ? dayjs(a.specific_date) : null,
      start_time: a.start_time ?? OPD_CONSTANTS.AVAILABILITY.DEFAULT_START,
      end_time: a.end_time ?? OPD_CONSTANTS.AVAILABILITY.DEFAULT_END,
      slot_duration_min: a.slot_duration_min ?? OPD_CONSTANTS.AVAILABILITY.DEFAULT_SLOT_MIN,
      accepts_walk_ins: a.accepts_walk_ins ?? true,
      active: a.active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.start_time || !form.end_time || (form.mode === 'date' && !form.specific_date)) {
      notify(L.MESSAGES.VALIDATION, 'error');
      return;
    }
    const body: AvailabilityWriteRequest = {
      provider_type: providerType,
      provider_id: providerId,
      weekday: form.mode === 'weekly' ? form.weekday : null,
      specific_date: form.mode === 'date' ? form.specific_date!.format(OPD_CONSTANTS.API_DATE_FORMAT) : null,
      start_time: form.start_time,
      end_time: form.end_time,
      slot_duration_min: form.slot_duration_min,
      accepts_walk_ins: form.accepts_walk_ins,
      active: form.active,
    };
    try {
      if (editing) await updateAvailability({ id: editing.id, ...body }).unwrap();
      else await createAvailability(body).unwrap();
      notify(L.MESSAGES.SAVE_SUCCESS, 'success');
      setDialogOpen(false);
    } catch (err: any) {
      logError(err, 'SlotConfig.saveAvailability');
      const msg = err?.status === 403 ? L.MESSAGES.FORBIDDEN : extractErrorMessage(err, L.MESSAGES.SAVE_ERROR);
      notify(msg, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await deleteAvailability(id).unwrap();
      notify(L.MESSAGES.DELETE_SUCCESS, 'success');
    } catch (err: any) {
      logError(err, 'SlotConfig.deleteAvailability');
      const msg = err?.status === 403 ? L.MESSAGES.FORBIDDEN : extractErrorMessage(err, L.MESSAGES.DELETE_ERROR);
      notify(msg, 'error');
    }
  };

  const whenText = (a: OutpatientAvailability) =>
    a.specific_date ? dayjs(a.specific_date).format(OPD_CONSTANTS.DATE_FORMAT) : OPD_LABELS.WEEKDAYS[a.weekday ?? 0] ?? '—';

  const columns: TableColumn<OutpatientAvailability>[] = [
    { key: 'when', header: L.TABLE.WHEN, render: whenText },
    { key: 'time', header: L.TABLE.TIME, render: (a) => `${a.start_time ?? '—'} – ${a.end_time ?? '—'}` },
    { key: 'slot_duration_min', header: L.TABLE.DURATION, render: (a) => a.slot_duration_min ?? '—' },
    {
      key: 'accepts_walk_ins',
      header: L.TABLE.WALK_INS,
      render: (a) => (a.accepts_walk_ins ? 'Yes' : 'No'),
    },
    {
      key: 'active',
      header: L.TABLE.ACTIVE,
      render: (a) => (
        <Chip
          label={a.active ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            backgroundColor: a.active ? '#DCFCE7' : '#F3F4F6',
            color: a.active ? '#15803D' : '#6B7280',
            fontWeight: 600,
            height: 24,
          }}
        />
      ),
    },
    ...(canEdit
      ? [
          {
            key: 'actions',
            header: L.TABLE.ACTIONS,
            columnWidth: '110px',
            render: (a: OutpatientAvailability) => (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title={L.DIALOG.EDIT_TITLE}>
                  <IconButton size="small" onClick={() => openEdit(a)} sx={{ color: OPD_CONSTANTS.THEME.PRIMARY }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={L.DELETE_DIALOG.TITLE}>
                  <IconButton size="small" onClick={() => setDeleteTarget(a)} sx={{ color: '#B91C1C' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ),
          } as TableColumn<OutpatientAvailability>,
        ]
      : []),
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {canEdit && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <StandardButton variant="primary" size="small" onClick={openAdd}>
            <AddIcon fontSize="small" sx={{ mr: 0.5 }} />
            {L.ADD}
          </StandardButton>
        </Box>
      )}
      {!canEdit && (
        <Typography sx={{ fontSize: 12, color: '#6B7280' }}>{L.READ_ONLY_HINT}</Typography>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>{L.MESSAGES.AVAIL_ERROR}</Box>
      ) : (
        <ReusableTable
          columns={columns}
          data={rows}
          selectedRows={[]}
          setSelectedRows={() => {}}
          emptyMessage={L.TABLE.EMPTY}
          searchAndFilterConfig={{ filterOptions: [] }}
          currentSearchTerm=""
          onSearchChange={() => {}}
          showFilters={false}
          onShowFiltersToggle={() => {}}
          currentFilterKey=""
          onFilterSelect={() => {}}
          hideDefaultSearch
          totalRows={rows.length}
          rowsPerPage={rows.length || 1}
          currentPage={1}
          onPageChange={() => {}}
          onSortRequest={() => {}}
          sortConfig={{ key: '', direction: 'asc' }}
        />
      )}

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? L.DIALOG.EDIT_TITLE : L.DIALOG.ADD_TITLE}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 0.5 }}>{L.DIALOG.MODE}</Typography>
            <RadioGroup
              row
              value={form.mode}
              onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as 'weekly' | 'date' }))}
            >
              <FormControlLabel value="weekly" control={<Radio size="small" />} label={L.DIALOG.MODE_WEEKLY} />
              <FormControlLabel value="date" control={<Radio size="small" />} label={L.DIALOG.MODE_DATE} />
            </RadioGroup>
          </Box>
          {form.mode === 'weekly' ? (
            <TextField
              label={L.DIALOG.WEEKDAY}
              select
              size="small"
              value={form.weekday}
              onChange={(e) => setForm((f) => ({ ...f, weekday: Number(e.target.value) }))}
              fullWidth
            >
              {OPD_CONSTANTS.WEEKDAY_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Box>
              <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 0.5 }}>{L.DIALOG.DATE}</Typography>
              <PharmaDatePicker
                value={form.specific_date}
                onChange={(v) => setForm((f) => ({ ...f, specific_date: v }))}
                width="100%"
                height={44}
              />
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={L.DIALOG.START}
              type="time"
              size="small"
              value={form.start_time}
              onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label={L.DIALOG.END}
              type="time"
              size="small"
              value={form.end_time}
              onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
          <TextField
            label={L.DIALOG.DURATION}
            type="number"
            size="small"
            value={form.slot_duration_min}
            onChange={(e) => setForm((f) => ({ ...f, slot_duration_min: Number(e.target.value) }))}
            inputProps={{ min: 1 }}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.accepts_walk_ins}
                onChange={(e) => setForm((f) => ({ ...f, accepts_walk_ins: e.target.checked }))}
              />
            }
            label={L.DIALOG.WALK_INS}
          />
          <FormControlLabel
            control={
              <Switch checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
            }
            label={L.DIALOG.ACTIVE}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <StandardButton variant="secondary" size="small" onClick={() => setDialogOpen(false)}>
            {L.DIALOG.CANCEL}
          </StandardButton>
          <StandardButton variant="primary" size="small" disabled={isCreating || isUpdating} onClick={handleSave}>
            {L.DIALOG.SAVE}
          </StandardButton>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={deleteTarget !== null}
        title={L.DELETE_DIALOG.TITLE}
        message={L.DELETE_DIALOG.MESSAGE}
        confirmLabel={L.DELETE_DIALOG.CONFIRM}
        cancelLabel={L.DELETE_DIALOG.DISMISS}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Services section (admin only): list + create/edit services, plus per-service
// availability via the shared editor.
// ---------------------------------------------------------------------------
const ServicesSection: React.FC<{ notify: Notify }> = ({ notify }) => {
  const { data: services, isLoading } = useGetServicesQuery();
  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();
  const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OutpatientService | null>(null);
  const [form, setForm] = useState({ name: '', description: '', duration_min: 15, active: true });
  const [selectedService, setSelectedService] = useState<number | ''>('');

  const rows = useMemo(() => services ?? [], [services]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', duration_min: 15, active: true });
    setDialogOpen(true);
  };
  const openEdit = (s: OutpatientService) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? '',
      duration_min: s.duration_min ?? 15,
      active: s.active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      notify(L.MESSAGES.VALIDATION, 'error');
      return;
    }
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      duration_min: form.duration_min,
      active: form.active,
    };
    try {
      if (editing) await updateService({ id: editing.id, ...body }).unwrap();
      else await createService(body).unwrap();
      notify(L.MESSAGES.SERVICE_SAVE_SUCCESS, 'success');
      setDialogOpen(false);
    } catch (err: any) {
      logError(err, 'SlotConfig.saveService');
      const msg = err?.status === 403 ? L.MESSAGES.FORBIDDEN : extractErrorMessage(err, L.MESSAGES.SERVICE_SAVE_ERROR);
      notify(msg, 'error');
    }
  };

  const columns: TableColumn<OutpatientService>[] = [
    { key: 'name', header: L.SERVICES_TABLE.NAME, render: (s) => s.name },
    { key: 'description', header: L.SERVICES_TABLE.DESCRIPTION, render: (s) => s.description ?? '—' },
    { key: 'duration_min', header: L.SERVICES_TABLE.DURATION, render: (s) => s.duration_min ?? '—' },
    {
      key: 'active',
      header: L.SERVICES_TABLE.ACTIVE,
      render: (s) => (
        <Chip
          label={s.active ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            backgroundColor: s.active ? '#DCFCE7' : '#F3F4F6',
            color: s.active ? '#15803D' : '#6B7280',
            fontWeight: 600,
            height: 24,
          }}
        />
      ),
    },
    {
      key: 'actions',
      header: L.SERVICES_TABLE.ACTIONS,
      columnWidth: '80px',
      render: (s) => (
        <Tooltip title={L.SERVICE_DIALOG.EDIT_TITLE}>
          <IconButton size="small" onClick={() => openEdit(s)} sx={{ color: OPD_CONSTANTS.THEME.PRIMARY }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <StandardButton variant="primary" size="small" onClick={openAdd}>
          <AddIcon fontSize="small" sx={{ mr: 0.5 }} />
          {L.ADD_SERVICE}
        </StandardButton>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ReusableTable
          columns={columns}
          data={rows}
          selectedRows={[]}
          setSelectedRows={() => {}}
          emptyMessage={L.SERVICES_TABLE.EMPTY}
          searchAndFilterConfig={{ filterOptions: [] }}
          currentSearchTerm=""
          onSearchChange={() => {}}
          showFilters={false}
          onShowFiltersToggle={() => {}}
          currentFilterKey=""
          onFilterSelect={() => {}}
          hideDefaultSearch
          totalRows={rows.length}
          rowsPerPage={rows.length || 1}
          currentPage={1}
          onPageChange={() => {}}
          onSortRequest={() => {}}
          sortConfig={{ key: '', direction: 'asc' }}
        />
      )}

      {/* Per-service availability */}
      <Box sx={{ mt: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1, color: '#374151' }}>
          {L.SERVICE_AVAILABILITY_TITLE}
        </Typography>
        <TextField
          label={L.SERVICE}
          select
          size="small"
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ minWidth: 240, mb: 1.5 }}
        >
          {rows.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
        {selectedService === '' ? (
          <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{L.PICK_SERVICE}</Typography>
        ) : (
          <AvailabilityEditor providerType="service" providerId={selectedService} canEdit notify={notify} />
        )}
      </Box>

      {/* Service add/edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? L.SERVICE_DIALOG.EDIT_TITLE : L.SERVICE_DIALOG.ADD_TITLE}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label={L.SERVICE_DIALOG.NAME}
            size="small"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
          />
          <TextField
            label={L.SERVICE_DIALOG.DESCRIPTION}
            size="small"
            multiline
            minRows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            fullWidth
          />
          <TextField
            label={L.SERVICE_DIALOG.DURATION}
            type="number"
            size="small"
            value={form.duration_min}
            onChange={(e) => setForm((f) => ({ ...f, duration_min: Number(e.target.value) }))}
            inputProps={{ min: 1 }}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
            }
            label={L.SERVICE_DIALOG.ACTIVE}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <StandardButton variant="secondary" size="small" onClick={() => setDialogOpen(false)}>
            {L.SERVICE_DIALOG.CANCEL}
          </StandardButton>
          <StandardButton variant="primary" size="small" disabled={isCreating || isUpdating} onClick={handleSave}>
            {L.SERVICE_DIALOG.SAVE}
          </StandardButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Link provider accounts (admin only): connect a Doctor record to a User login.
// ---------------------------------------------------------------------------
const LinkProvidersSection: React.FC<{ notify: Notify }> = ({ notify }) => {
  const { data: providers, isLoading } = useGetProvidersQuery();
  const { data: usersData } = useGetAllUsersQuery();
  const [linkProviderUser, { isLoading: isLinking }] = useLinkProviderUserMutation();

  const [target, setTarget] = useState<{ id: number; name: string } | null>(null);
  const [userId, setUserId] = useState<number | ''>('');

  const users = usersData?.users ?? [];
  const rows = useMemo(() => providers ?? [], [providers]);

  const userName = (id?: number | null) => {
    if (id == null) return null;
    const u = users.find((x) => x.id === id);
    return u ? `${u.name} (${u.email})` : `User #${id}`;
  };

  const handleLink = async () => {
    if (!target || userId === '') return;
    try {
      await linkProviderUser({ provider_id: target.id, user_id: userId }).unwrap();
      notify(L.MESSAGES.LINK_SUCCESS, 'success');
      setTarget(null);
      setUserId('');
    } catch (err: any) {
      logError(err, 'SlotConfig.linkProvider');
      const msg = err?.status === 403 ? L.MESSAGES.FORBIDDEN : extractErrorMessage(err, L.MESSAGES.LINK_ERROR);
      notify(msg, 'error');
    }
  };

  const columns: TableColumn<NonNullable<typeof providers>[number]>[] = [
    { key: 'name', header: L.LINK_TABLE.DOCTOR, render: (p) => p.name },
    { key: 'branch', header: L.LINK_TABLE.BRANCH, render: (p) => p.branch ?? '—' },
    {
      key: 'user_id',
      header: L.LINK_TABLE.LINKED_USER,
      render: (p) =>
        p.user_id ? (
          userName(p.user_id)
        ) : (
          <Chip
            label={L.LINK_TABLE.UNLINKED}
            size="small"
            sx={{ backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 600, height: 24 }}
          />
        ),
    },
    {
      key: 'actions',
      header: L.LINK_TABLE.ACTIONS,
      columnWidth: '90px',
      render: (p) => (
        <Tooltip title={L.LINK_DIALOG.TITLE}>
          <IconButton
            size="small"
            onClick={() => {
              setTarget({ id: p.id, name: p.name });
              setUserId(p.user_id ?? '');
            }}
            sx={{ color: OPD_CONSTANTS.THEME.PRIMARY }}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ReusableTable
          columns={columns}
          data={rows}
          selectedRows={[]}
          setSelectedRows={() => {}}
          emptyMessage={L.LINK_TABLE.EMPTY}
          searchAndFilterConfig={{ filterOptions: [] }}
          currentSearchTerm=""
          onSearchChange={() => {}}
          showFilters={false}
          onShowFiltersToggle={() => {}}
          currentFilterKey=""
          onFilterSelect={() => {}}
          hideDefaultSearch
          totalRows={rows.length}
          rowsPerPage={rows.length || 1}
          currentPage={1}
          onPageChange={() => {}}
          onSortRequest={() => {}}
          sortConfig={{ key: '', direction: 'asc' }}
        />
      )}

      <Dialog open={target !== null} onClose={() => setTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {L.LINK_DIALOG.TITLE}
          {target ? ` — ${target.name}` : ''}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label={L.LINK_DIALOG.USER}
            select
            size="small"
            value={userId}
            onChange={(e) => setUserId(e.target.value === '' ? '' : Number(e.target.value))}
            fullWidth
          >
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name} ({u.email})
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <StandardButton variant="secondary" size="small" onClick={() => setTarget(null)}>
            {L.LINK_DIALOG.CANCEL}
          </StandardButton>
          <StandardButton variant="primary" size="small" disabled={userId === '' || isLinking} onClick={handleLink}>
            {L.LINK_DIALOG.SAVE}
          </StandardButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Page: role-aware sections in accordions (Settings.tsx pattern).
// ---------------------------------------------------------------------------
const sectionSx = {
  borderRadius: '12px',
  boxShadow: '0px 1px 3px rgba(0,0,0,0.08)',
  backgroundColor: '#FFFFFF',
  '&:before': { display: 'none' },
  '&.Mui-expanded': { margin: 0 },
} as const;

const SlotConfig: React.FC = () => {
  const currentUserId = useSelector((s: any) => s.auth.user?.id as number | undefined);
  const orgRole = useSelector(selectOrgRole);
  const moduleRoles = useSelector(selectModuleRoles);

  const isAdmin = orgRole === 'admin' || orgRole === 'superadmin';
  const isDoctorRole = moduleRoles.outpatient === 'doctor';

  const [expanded, setExpanded] = useState<string>('availability');
  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const notify: Notify = (message, severity) => setSnackbar({ open: true, message, severity });

  const { data: providers } = useGetProvidersQuery();
  const ownProvider = useMemo(
    () => (providers ?? []).find((p) => p.user_id === currentUserId),
    [providers, currentUserId]
  );

  // Doctor-role users are locked to their own provider.
  useEffect(() => {
    if (isDoctorRole && !isAdmin && ownProvider && doctorId === '') {
      setDoctorId(ownProvider.id);
    }
  }, [isDoctorRole, isAdmin, ownProvider, doctorId]);

  // Who may write availability: admins (any), or a doctor for their OWN provider.
  const canEditAvailability =
    isAdmin || (isDoctorRole && !!ownProvider && doctorId !== '' && ownProvider.id === doctorId);

  const handleAccordionChange = (panel: string) => (_e: React.SyntheticEvent, isExpanded: boolean) =>
    setExpanded(isExpanded ? panel : '');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: OPD_CONSTANTS.LAYOUT.PAGE_GAP, p: OPD_CONSTANTS.LAYOUT.PAGE_PADDING }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>
          {L.PAGE_TITLE}
        </Typography>
        <Typography sx={{ color: '#6B7280', fontSize: 14 }}>{L.SUBTITLE}</Typography>
      </Box>

      {/* Provider availability */}
      <Accordion expanded={expanded === 'availability'} onChange={handleAccordionChange('availability')} sx={sectionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{L.SECTIONS.AVAILABILITY.TITLE}</Typography>
            <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{L.SECTIONS.AVAILABILITY.DESC}</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {isDoctorRole && !isAdmin && !ownProvider ? (
            <Alert severity="info" sx={{ borderRadius: '8px' }}>
              {L.NOT_LINKED}
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField
                  label={L.PROVIDER}
                  select
                  size="small"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={isDoctorRole && !isAdmin && !!ownProvider}
                  helperText={isDoctorRole && !isAdmin && ownProvider ? L.DOCTOR_LOCKED_HINT : ' '}
                  sx={{ minWidth: 240 }}
                >
                  {(providers ?? []).map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                      {d.branch ? ` · ${d.branch}` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              {doctorId === '' ? (
                <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{L.PICK_PROVIDER}</Typography>
              ) : (
                <AvailabilityEditor
                  providerType="doctor"
                  providerId={doctorId}
                  canEdit={canEditAvailability}
                  notify={notify}
                />
              )}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Services (admin only) */}
      {isAdmin && (
        <Accordion expanded={expanded === 'services'} onChange={handleAccordionChange('services')} sx={sectionSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{L.SECTIONS.SERVICES.TITLE}</Typography>
              <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{L.SECTIONS.SERVICES.DESC}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <ServicesSection notify={notify} />
          </AccordionDetails>
        </Accordion>
      )}

      {/* Link provider accounts (admin only) */}
      {isAdmin && (
        <Accordion expanded={expanded === 'link'} onChange={handleAccordionChange('link')} sx={sectionSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{L.SECTIONS.LINK.TITLE}</Typography>
              <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{L.SECTIONS.LINK.DESC}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <LinkProvidersSection notify={notify} />
          </AccordionDetails>
        </Accordion>
      )}

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

export default SlotConfig;
