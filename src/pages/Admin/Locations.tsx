import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { ReusableTable, TableColumn } from '../../components/PharmaTable';
import { StandardButton } from '../../components/Common';
import { LOCATION_LABELS } from '../../config/label/Locations.labels';
import { extractErrorMessage } from '../../utils/errorUtils';
import { orgApi, Location } from '../../redux/slices/orgApi';
import {
  useGetLocationsQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
} from '../../redux/slices/locationsApi';

const L = LOCATION_LABELS.ADMIN;
const ROWS_PER_PAGE = 25;

interface LocationForm {
  name: string;
  code: string;
  type: string;
  gstin: string;
  drug_license_1: string;
  drug_license_2: string;
  address: string;
  phone: string;
  active: boolean;
}

const emptyForm: LocationForm = {
  name: '',
  code: '',
  type: '',
  gstin: '',
  drug_license_1: '',
  drug_license_2: '',
  address: '',
  phone: '',
  active: true,
};

const toForm = (location: Location): LocationForm => ({
  name: location.name,
  code: location.code ?? '',
  type: location.type ?? '',
  gstin: location.gstin ?? '',
  drug_license_1: location.drug_license_1 ?? '',
  drug_license_2: location.drug_license_2 ?? '',
  address: location.address ?? '',
  phone: location.phone ?? '',
  active: location.status === 1,
});

const Locations: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { data, isLoading, isFetching, error } = useGetLocationsQuery();
  const rows: Location[] = data?.locations ?? [];

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  });

  const handleSortRequest = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  // ---- Snackbar ----
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // ---- Create/Edit dialog ----
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [form, setForm] = useState<LocationForm>(emptyForm);
  const [formError, setFormError] = useState('');

  const [createLocation, { isLoading: isCreating }] = useCreateLocationMutation();
  const [updateLocation, { isLoading: isUpdating }] = useUpdateLocationMutation();
  const isSaving = isCreating || isUpdating;

  const openCreateDialog = () => {
    setEditingLocation(null);
    setForm(emptyForm);
    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = (location: Location) => {
    setEditingLocation(location);
    setForm(toForm(location));
    setFormError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (isSaving) return;
    setDialogOpen(false);
  };

  const setField = (key: keyof LocationForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setFormError(L.DIALOG.VALIDATION.NAME_REQUIRED);
      return;
    }
    setFormError('');
    const trimmed = {
      name: form.name.trim(),
      code: form.code.trim(),
      type: form.type.trim(),
      gstin: form.gstin.trim(),
      drug_license_1: form.drug_license_1.trim(),
      drug_license_2: form.drug_license_2.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
    };
    try {
      if (editingLocation) {
        // UPDATE sends '' for blanked optional fields — the backend maps empty
        // string to null, so clearing a field actually clears it (an omitted /
        // undefined field is skipped server-side and would never clear).
        await updateLocation({
          id: editingLocation.id,
          ...trimmed,
          status: form.active ? 1 : 0,
        }).unwrap();
      } else {
        // CREATE omits untouched empties (nothing to clear on a new row).
        await createLocation({
          name: trimmed.name,
          code: trimmed.code || undefined,
          type: trimmed.type || undefined,
          gstin: trimmed.gstin || undefined,
          drug_license_1: trimmed.drug_license_1 || undefined,
          drug_license_2: trimmed.drug_license_2 || undefined,
          address: trimmed.address || undefined,
          phone: trimmed.phone || undefined,
        }).unwrap();
      }
      // Locations also live in org context (seeded from /me) — refetch it so the
      // top-bar switcher and print identity pick the change up immediately.
      dispatch(orgApi.util.invalidateTags(['Me']));
      setDialogOpen(false);
      setSnackbar({
        open: true,
        message: editingLocation ? L.MESSAGES.UPDATE_SUCCESS : L.MESSAGES.CREATE_SUCCESS,
        severity: 'success',
      });
    } catch (err) {
      // Surfaces backend 400s inline (e.g. deactivating the last active location).
      setFormError(extractErrorMessage(err, L.MESSAGES.SAVE_ERROR));
    }
  };

  const columns: TableColumn<Location>[] = [
    {
      key: 'name',
      header: L.TABLE.NAME,
      sortable: true,
      render: (l) => <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{l.name}</Typography>,
    },
    {
      key: 'code',
      header: L.TABLE.CODE,
      sortable: true,
      render: (l) => <Typography sx={{ fontSize: 14 }}>{l.code || '-'}</Typography>,
    },
    {
      key: 'gstin',
      header: L.TABLE.GSTIN,
      sortable: false,
      render: (l) => <Typography sx={{ fontSize: 14 }}>{l.gstin || '-'}</Typography>,
    },
    {
      key: 'phone',
      header: L.TABLE.PHONE,
      sortable: false,
      render: (l) => <Typography sx={{ fontSize: 14 }}>{l.phone || '-'}</Typography>,
    },
    {
      key: 'status',
      header: L.TABLE.STATUS,
      sortable: true,
      render: (l) => {
        const isActive = l.status === 1;
        return (
          <Chip
            label={isActive ? L.STATUS.ACTIVE : L.STATUS.INACTIVE}
            size="small"
            sx={{
              backgroundColor: isActive ? '#E7F6EC' : '#FDECEC',
              color: isActive ? '#137333' : '#C5221F',
              fontWeight: 600,
              fontSize: 12,
            }}
          />
        );
      },
    },
    {
      key: 'actions',
      header: L.TABLE.ACTIONS,
      sortable: false,
      render: (l) => (
        <IconButton
          size="small"
          aria-label={`${L.EDIT_BUTTON} ${l.name}`}
          onClick={() => openEditDialog(l)}
          sx={{ color: '#5C17E5' }}
        >
          <EditOutlinedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      ),
    },
  ];

  const sortedData = [...rows].sort((a, b) => {
    const key = sortConfig.key as keyof Location;
    const av = String(a[key] ?? '');
    const bv = String(b[key] ?? '');
    const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
    return sortConfig.direction === 'asc' ? cmp : -cmp;
  });

  const fields: Array<{ key: keyof LocationForm; label: string; multiline?: boolean }> = [
    { key: 'name', label: L.DIALOG.FIELDS.NAME },
    { key: 'code', label: L.DIALOG.FIELDS.CODE },
    { key: 'type', label: L.DIALOG.FIELDS.TYPE },
    { key: 'gstin', label: L.DIALOG.FIELDS.GSTIN },
    { key: 'drug_license_1', label: L.DIALOG.FIELDS.DRUG_LICENSE_1 },
    { key: 'drug_license_2', label: L.DIALOG.FIELDS.DRUG_LICENSE_2 },
    { key: 'address', label: L.DIALOG.FIELDS.ADDRESS, multiline: true },
    { key: 'phone', label: L.DIALOG.FIELDS.PHONE },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3, minHeight: 'calc(100vh - 200px)', pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            {L.PAGE_TITLE}
          </Typography>
          <Typography sx={{ color: '#728197', fontSize: '14px' }}>{L.SUBTITLE}</Typography>
        </Box>
        <StandardButton variant="primary" size="medium" onClick={openCreateDialog} sx={{ minWidth: 160 }}>
          {L.ADD_BUTTON}
        </StandardButton>
      </Box>

      {/* Table */}
      {isLoading || isFetching ? (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            {L.MESSAGES.LOADING}
          </Typography>
        </Box>
      ) : error ? (
        <Box p={4} textAlign="center" color="error.main">
          <Typography variant="body1">{extractErrorMessage(error, L.MESSAGES.ERROR)}</Typography>
        </Box>
      ) : (
        <ReusableTable
          columns={columns}
          data={sortedData}
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
          currentFilter={{}}
          totalRows={sortedData.length}
          rowsPerPage={ROWS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSortRequest={handleSortRequest}
          sortConfig={sortConfig}
        />
      )}

      {/* Back */}
      <Button
        variant="contained"
        onClick={() => navigate('/admin')}
        sx={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          backgroundColor: '#5C17E5',
          textTransform: 'none',
          borderRadius: '12px',
          '&:hover': { backgroundColor: '#4a12b8' },
        }}
      >
        Back
      </Button>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, borderBottom: '1px solid #E0E0E0' }}>
          {editingLocation ? L.DIALOG.EDIT_TITLE : L.DIALOG.CREATE_TITLE}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {fields.map(({ key, label, multiline }) => (
            <Box key={key} sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: key === 'name' ? 1 : 0 }}>
              <Typography sx={{ fontSize: '13px', color: '#728197' }}>{label}</Typography>
              <TextField
                value={form[key]}
                onChange={setField(key)}
                placeholder={label}
                multiline={multiline}
                minRows={multiline ? 2 : undefined}
                inputProps={{ 'aria-label': label }}
              />
            </Box>
          ))}

          {editingLocation && (
            <FormControlLabel
              control={
                <Switch
                  checked={form.active}
                  onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#5C17E5' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#5C17E5' },
                  }}
                />
              }
              label={L.DIALOG.FIELDS.ACTIVE}
            />
          )}

          {formError && (
            <Alert severity="error" sx={{ borderRadius: '8px' }}>
              {formError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <StandardButton onClick={closeDialog} variant="secondary" size="medium" disabled={isSaving}>
            {L.DIALOG.CANCEL}
          </StandardButton>
          <StandardButton onClick={handleSubmit} variant="primary" size="medium" disabled={isSaving}>
            {isSaving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : L.DIALOG.SAVE}
          </StandardButton>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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

export default Locations;
