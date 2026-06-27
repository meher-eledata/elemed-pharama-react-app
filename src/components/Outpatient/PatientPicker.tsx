import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  MenuItem,
  Collapse,
  Snackbar,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { StandardButton } from '../Common';
import {
  useLazySearchPatientsQuery,
  useCreatePatientMutation,
  type OutpatientPatient,
  type CreatePatientRequest,
} from '../../redux/slices/outpatientApi';
import { OPD_LABELS } from '../../config/label/Outpatient.labels';
import { OPD_CONSTANTS } from '../../config/constants/Outpatient.constants';
import { extractErrorMessage, logError } from '../../utils/errorUtils';

interface PatientPickerProps {
  selected: OutpatientPatient | null;
  onSelect: (patient: OutpatientPatient | null) => void;
}

const L = OPD_LABELS.PATIENT_PICKER;

/**
 * Reusable patient picker for Booking + Walk-in flows: debounced search of
 * existing patients, plus an inline "create new patient" form. Returns the
 * selected patient to the parent via onSelect.
 */
const PatientPicker: React.FC<PatientPickerProps> = ({ selected, onSelect }) => {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreatePatientRequest>({ name: '' });
  const [nameError, setNameError] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  const [triggerSearch, { data: results, isFetching }] = useLazySearchPatientsQuery();
  const [createPatient, { isLoading: isCreating }] = useCreatePatientMutation();

  // Debounce the search term to avoid excessive requests.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 400);
    return () => clearTimeout(t);
  }, [term]);

  useEffect(() => {
    if (debounced.length >= 2) {
      triggerSearch(debounced);
    }
  }, [debounced, triggerSearch]);

  const showResults = useMemo(
    () => !selected && debounced.length >= 2,
    [selected, debounced]
  );

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setNameError(true);
      return;
    }
    try {
      const res = await createPatient({ ...form, name: form.name.trim() }).unwrap();
      onSelect(res.patient);
      setShowCreate(false);
      setForm({ name: '' });
      setTerm('');
    } catch (err) {
      logError(err, 'PatientPicker.createPatient');
      setSnackbar({ open: true, message: extractErrorMessage(err, L.CREATE_ERROR) });
    }
  };

  if (selected) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid #E6ECF5',
          borderRadius: '12px',
          p: 2,
          backgroundColor: '#FAFAFC',
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 12, color: '#6B7280' }}>{L.SELECTED}</Typography>
          <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{selected.name}</Typography>
          <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
            {[selected.phone, selected.mrn].filter(Boolean).join(' · ')}
          </Typography>
        </Box>
        <StandardButton variant="secondary" size="small" onClick={() => onSelect(null)}>
          {L.CHANGE}
        </StandardButton>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <TextField
        placeholder={L.SEARCH_PLACEHOLDER}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        fullWidth
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#8A99AF' }} />
            </InputAdornment>
          ),
        }}
      />

      {showResults && (
        <Box sx={{ border: '1px solid #E6ECF5', borderRadius: '12px', overflow: 'hidden' }}>
          {isFetching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={22} />
            </Box>
          ) : results && results.length > 0 ? (
            <List disablePadding sx={{ maxHeight: 220, overflowY: 'auto' }}>
              {results.map((p) => (
                <ListItemButton key={p.id} onClick={() => onSelect(p)}>
                  <ListItemText
                    primary={p.name}
                    secondary={[p.phone, p.mrn].filter(Boolean).join(' · ') || undefined}
                  />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Typography sx={{ p: 2, fontSize: 14, color: '#6B7280' }}>{L.NO_RESULTS}</Typography>
          )}
        </Box>
      )}

      <Box>
        <StandardButton
          variant="text"
          size="small"
          onClick={() => setShowCreate((s) => !s)}
          sx={{ color: OPD_CONSTANTS.THEME.PRIMARY, px: 0 }}
        >
          {L.CREATE_TOGGLE}
        </StandardButton>
      </Box>

      <Collapse in={showCreate} unmountOnExit>
        <Box
          sx={{
            border: '1px solid #E6ECF5',
            borderRadius: '12px',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography sx={{ fontWeight: 600 }}>{L.CREATE_TITLE}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label={L.FIELDS.NAME}
              required
              size="small"
              value={form.name}
              error={nameError}
              helperText={nameError ? L.NAME_REQUIRED : ' '}
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }));
                if (e.target.value.trim()) setNameError(false);
              }}
            />
            <TextField
              label={L.FIELDS.GENDER}
              select
              size="small"
              value={form.gender ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            >
              {OPD_CONSTANTS.GENDER_OPTIONS.map((g) => (
                <MenuItem key={g.value} value={g.value}>
                  {g.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={L.FIELDS.PHONE}
              size="small"
              value={form.phone ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <TextField
              label={L.FIELDS.EMAIL}
              size="small"
              value={form.email ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <TextField
              label={L.FIELDS.MRN}
              size="small"
              value={form.mrn ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, mrn: e.target.value }))}
            />
            <TextField
              label={L.FIELDS.ADDRESS}
              size="small"
              value={form.address_line1 ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, address_line1: e.target.value }))}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <StandardButton
              variant="secondary"
              size="small"
              onClick={() => {
                setShowCreate(false);
                setNameError(false);
              }}
            >
              {L.CANCEL}
            </StandardButton>
            <StandardButton
              variant="primary"
              size="small"
              onClick={handleCreate}
              disabled={isCreating}
            >
              {L.CREATE}
            </StandardButton>
          </Box>
        </Box>
      </Collapse>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PatientPicker;
