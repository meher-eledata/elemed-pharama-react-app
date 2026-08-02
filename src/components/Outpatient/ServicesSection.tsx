import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { ReusableTable, TableColumn } from '../PharmaTable';
import { StandardButton } from '../Common';
import AvailabilityEditor from './AvailabilityEditor';
import { OPD_LABELS } from '../../config/label/Outpatient.labels';
import { OPD_CONSTANTS } from '../../config/constants/Outpatient.constants';
import { extractErrorMessage, logError } from '../../utils/errorUtils';
import {
  useGetServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  type OutpatientService,
} from '../../redux/slices/outpatientApi';

const L = OPD_LABELS.SLOT_CONFIG;

type Notify = (message: string, severity: 'success' | 'error') => void;

// ---------------------------------------------------------------------------
// Services section (admin only): list + create/edit services (name, description,
// default duration, default sessions), plus per-service availability via the
// shared editor.
// ---------------------------------------------------------------------------
const ServicesSection: React.FC<{ notify: Notify }> = ({ notify }) => {
  const { data: services, isLoading } = useGetServicesQuery();
  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();
  const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OutpatientService | null>(null);
  const [form, setForm] = useState({ name: '', description: '', duration_min: 15, default_sessions: 1, active: true });
  const [selectedService, setSelectedService] = useState<number | ''>('');

  const rows = useMemo(() => services ?? [], [services]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', duration_min: 15, default_sessions: 1, active: true });
    setDialogOpen(true);
  };
  const openEdit = (s: OutpatientService) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? '',
      duration_min: s.duration_min ?? 15,
      default_sessions: s.default_sessions ?? 1,
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
      default_sessions: form.default_sessions,
      active: form.active,
    };
    try {
      if (editing) await updateService({ id: editing.id, ...body }).unwrap();
      else await createService(body).unwrap();
      notify(L.MESSAGES.SERVICE_SAVE_SUCCESS, 'success');
      setDialogOpen(false);
    } catch (err: any) {
      logError(err, 'ServicesSection.saveService');
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
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={L.SERVICE_DIALOG.DURATION}
              type="number"
              size="small"
              value={form.duration_min}
              onChange={(e) => setForm((f) => ({ ...f, duration_min: Number(e.target.value) }))}
              inputProps={{ min: 1 }}
              fullWidth
            />
            <TextField
              label={L.SERVICE_DIALOG.DEFAULT_SESSIONS}
              type="number"
              size="small"
              value={form.default_sessions}
              onChange={(e) => setForm((f) => ({ ...f, default_sessions: Number(e.target.value) }))}
              inputProps={{ min: 1 }}
              fullWidth
            />
          </Box>
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

export default ServicesSection;
