import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  ListItemText,
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
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs, { Dayjs } from 'dayjs';
import { ReusableTable, TableColumn } from '../PharmaTable';
import { PharmaDatePicker, StandardButton } from '../Common';
import ConfirmationDialog from '../DeleteDialogue/ConfirmationDialog';
import { OPD_LABELS } from '../../config/label/Outpatient.labels';
import { OPD_CONSTANTS } from '../../config/constants/Outpatient.constants';
import { extractErrorMessage, logError } from '../../utils/errorUtils';
import {
  useGetAvailabilityQuery,
  useCreateAvailabilityMutation,
  useUpdateAvailabilityMutation,
  useDeleteAvailabilityMutation,
  type OutpatientAvailability,
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
  weekday: number; // used when editing one existing weekly row
  weekdays: number[]; // used when creating (multi-select)
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
  weekdays: [1],
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
      weekdays: [a.weekday ?? 1],
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
    const weeklyCreateInvalid = form.mode === 'weekly' && !editing && form.weekdays.length === 0;
    if (
      !form.start_time ||
      !form.end_time ||
      (form.mode === 'date' && !form.specific_date) ||
      weeklyCreateInvalid
    ) {
      notify(L.MESSAGES.VALIDATION, 'error');
      return;
    }
    const base = {
      provider_type: providerType,
      provider_id: providerId,
      start_time: form.start_time,
      end_time: form.end_time,
      slot_duration_min: form.slot_duration_min,
      accepts_walk_ins: form.accepts_walk_ins,
      active: form.active,
    };
    try {
      if (editing) {
        // Editing remains a single row: send one weekday.
        const body: AvailabilityWriteRequest = {
          ...base,
          weekday: form.mode === 'weekly' ? form.weekday : null,
          specific_date:
            form.mode === 'date' ? form.specific_date!.format(OPD_CONSTANTS.API_DATE_FORMAT) : null,
        };
        await updateAvailability({ id: editing.id, ...body }).unwrap();
      } else if (form.mode === 'weekly') {
        // Creating weekly: send the selected weekdays array (one row per weekday).
        await createAvailability({ ...base, weekdays: form.weekdays }).unwrap();
      } else {
        // Creating date-specific: unchanged single-row create.
        await createAvailability({
          ...base,
          weekday: null,
          specific_date: form.specific_date!.format(OPD_CONSTANTS.API_DATE_FORMAT),
        }).unwrap();
      }
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
            editing ? (
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
              <TextField
                label={L.DIALOG.WEEKDAYS}
                select
                size="small"
                value={form.weekdays}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    weekdays: (e.target.value as unknown as number[]).map(Number),
                  }))
                }
                fullWidth
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) =>
                    (selected as number[])
                      .slice()
                      .sort((a, b) => a - b)
                      .map((v) => OPD_LABELS.WEEKDAYS[v])
                      .join(', '),
                }}
              >
                {OPD_CONSTANTS.WEEKDAY_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    <Checkbox size="small" checked={form.weekdays.includes(o.value)} />
                    <ListItemText primary={o.label} />
                  </MenuItem>
                ))}
              </TextField>
            )
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

export default AvailabilityEditor;
