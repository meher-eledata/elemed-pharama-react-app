import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Grid,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StandardButton } from '../../../components/Common';
import {
  MASTER_VIEW_CONFIG,
  MASTER_GENDER_OPTIONS,
  isEmptyMasterValue,
  type MasterCategory,
  type MasterCategoryConfig,
} from '../../../config/constants/MasterView.constants';
import { MASTER_VIEW_LABELS } from '../../../config/label/MasterView.labels';
import { useGetProductFieldOptionsQuery } from '../../../redux/slices/masterApi';

interface MasterEditModalProps {
  open: boolean;
  category: MasterCategory;
  // The full row being edited (display source for locked + initial editable values)
  row: Record<string, unknown> | null;
  saving: boolean;
  errorMessage?: string;
  onClose: () => void;
  // Receives ONLY { pk, ...editableWhitelist } — never locked fields.
  onSave: (body: Record<string, unknown>) => void;
  // Role-appropriate field config. Defaults to the full config for the category;
  // the caller passes a PII-filtered config for pharmacists.
  config?: MasterCategoryConfig;
}

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', md: '720px' },
  maxHeight: '92vh',
  bgcolor: 'background.paper',
  borderRadius: '12px',
  border: '1px solid',
  borderColor: 'divider',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: "'Lexend', sans-serif",
};

// For EDITABLE inputs: empty/missing values (incl. "nan"/NaN) become a blank input,
// so the user never edits a literal "nan" and a cleared field submits as null.
const toFieldString = (value: unknown): string => {
  if (isEmptyMasterValue(value)) return '';
  return String(value);
};

// For LOCKED (read-only) fields: show the same "-" placeholder the view table uses.
const toLockedDisplay = (value: unknown): string => {
  if (isEmptyMasterValue(value)) return MASTER_VIEW_LABELS.EMPTY_PLACEHOLDER;
  return String(value);
};

// A masked phone value (the server prefills `phone` redacted, e.g. ******9390) contains
// an asterisk. We treat such an untouched value as UNCHANGED: skip 10-digit validation and
// never submit it. Only a real, user-entered value (no '*') is validated and sent.
const isMaskedValue = (value: string): boolean => value.includes('*');

const MasterEditModal: React.FC<MasterEditModalProps> = ({
  open,
  category,
  row,
  saving,
  errorMessage,
  onClose,
  onSave,
  config = MASTER_VIEW_CONFIG[category],
}) => {
  const editableFields = useMemo(
    () => config.fields.filter((f) => f.editable),
    [config]
  );

  // Product Type / Unit-of-Measure dropdown options. Only fetched while editing a
  // product (the only category with `select` fields), and only when the modal is open.
  const hasSelectField = useMemo(
    () => config.fields.some((f) => f.type === 'select'),
    [config]
  );
  const { data: fieldOptions } = useGetProductFieldOptionsQuery(undefined, {
    skip: !open || !hasSelectField,
  });

  // Resolve the option list for a select field, ensuring the current stored value is
  // present (prepended if missing) so editing other fields never drops an off-list value.
  const selectOptionsFor = (key: string, current: string): string[] => {
    const base = key === 'type' ? fieldOptions?.types : fieldOptions?.units;
    const list = base ?? [];
    if (current !== '' && !list.includes(current)) return [current, ...list];
    return list;
  };

  // Local form state holds only the editable fields (as strings for inputs).
  const [values, setValues] = useState<Record<string, string>>({});
  // Per-field validation errors (keyed by field.key), shown as inline helperText.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && row) {
      const initial: Record<string, string> = {};
      for (const field of editableFields) {
        initial[field.key] = toFieldString(row[field.key]);
      }
      setValues(initial);
      setFieldErrors({});
    }
  }, [open, row, editableFields]);

  const handleChange = (key: string, value: string) => {
    // `phone` is digits-only, capped at 10 (matches the add-customer contract).
    const next = key === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setValues((prev) => ({ ...prev, [key]: next }));
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!row) return;

    // Generic validation: required fields + phone exactly-10-digits.
    const errors: Record<string, string> = {};
    for (const field of editableFields) {
      const raw = (values[field.key] ?? '').trim();
      if (field.required && raw === '') {
        errors[field.key] = `${field.label} is required`;
      } else if (
        field.key === 'phone' &&
        raw !== '' &&
        !isMaskedValue(raw) &&
        !/^\d{10}$/.test(raw)
      ) {
        // Skip validation while phone is still the untouched masked prefill (contains '*').
        errors[field.key] = 'Phone must be exactly 10 digits';
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Build the body from the PK + ONLY whitelisted editable fields.
    const body: Record<string, unknown> = {
      [config.pkKey]: row[config.pkKey],
    };

    for (const field of editableFields) {
      const raw = values[field.key] ?? '';
      if (field.key === 'phone' && isMaskedValue(raw)) {
        // Untouched masked prefill → phone is UNCHANGED; omit it from the body so the
        // stored real phone is never overwritten by the redacted placeholder.
        continue;
      }
      if (field.type === 'gender') {
        body[field.key] = raw === '' ? null : Number(raw);
      } else if (field.type === 'number') {
        body[field.key] = raw === '' ? null : Number(raw);
      } else {
        body[field.key] = raw === '' ? null : raw;
      }
    }

    onSave(body);
  };

  if (!row) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle} component="form" onSubmit={handleSubmit}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 3,
            pb: 2,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '20px', color: '#1A212B' }}>
            {MASTER_VIEW_LABELS.EDIT_TITLES[category]}
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ px: 3, pt: 1.5, pb: 2, flexGrow: 1, minHeight: 0, overflowY: 'auto' }}>
          {errorMessage ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          ) : null}

          <Grid container spacing={2}>
            {config.fields.map((field) => {
              const locked = !field.editable;
              const editValue = values[field.key] ?? '';
              const displayValue = toLockedDisplay(row[field.key]);

              if (field.type === 'gender') {
                if (locked) {
                  // (gender is never locked in current config, but stay safe)
                  return (
                    <Grid item xs={12} sm={6} key={field.key}>
                      <TextField
                        label={field.label}
                        value={displayValue}
                        fullWidth
                        size="small"
                        disabled
                      />
                    </Grid>
                  );
                }
                return (
                  <Grid item xs={12} sm={6} key={field.key}>
                    <FormControl fullWidth size="small">
                      <InputLabel id={`master-edit-${field.key}-label`}>
                        {field.label}
                      </InputLabel>
                      <Select
                        labelId={`master-edit-${field.key}-label`}
                        label={field.label}
                        value={editValue}
                        onChange={(e) => handleChange(field.key, String(e.target.value))}
                      >
                        <MenuItem value="">
                          <em>—</em>
                        </MenuItem>
                        {MASTER_GENDER_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                );
              }

              if (field.type === 'select' && !locked) {
                const options = selectOptionsFor(field.key, editValue);
                return (
                  <Grid item xs={12} sm={6} key={field.key}>
                    <FormControl fullWidth size="small" required={Boolean(field.required)}>
                      <InputLabel id={`master-edit-${field.key}-label`}>
                        {field.label}
                      </InputLabel>
                      <Select
                        labelId={`master-edit-${field.key}-label`}
                        label={field.label}
                        value={editValue}
                        onChange={(e) => handleChange(field.key, String(e.target.value))}
                      >
                        <MenuItem value="">
                          <em>—</em>
                        </MenuItem>
                        {options.map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                );
              }

              const isMultiline = field.type === 'multiline';
              const fieldError = locked ? '' : fieldErrors[field.key] ?? '';
              // Customer phone prefills MASKED (e.g. ******9390). Clarify it can be changed
              // by entering a full 10-digit number; show this hint when there's no error.
              const isMaskedPhone =
                !locked && field.key === 'phone' && isMaskedValue(editValue);
              const phoneHelper = isMaskedPhone
                ? 'Showing masked number — enter a full 10-digit number to change'
                : undefined;
              return (
                <Grid item xs={12} sm={isMultiline ? 12 : 6} key={field.key}>
                  <TextField
                    label={field.label}
                    name={field.key}
                    value={locked ? displayValue : editValue}
                    onChange={
                      locked
                        ? undefined
                        : (e) => handleChange(field.key, e.target.value)
                    }
                    required={!locked && Boolean(field.required)}
                    error={Boolean(fieldError)}
                    helperText={fieldError || phoneHelper || undefined}
                    type={field.type === 'number' ? 'number' : 'text'}
                    multiline={isMultiline}
                    minRows={isMultiline ? 2 : undefined}
                    placeholder={
                      field.key === 'phone' ? 'Enter a 10-digit number' : undefined
                    }
                    inputProps={
                      field.key === 'phone'
                        ? { inputMode: 'numeric', maxLength: 10 }
                        : undefined
                    }
                    fullWidth
                    size="small"
                    disabled={locked}
                    InputProps={{ readOnly: locked }}
                  />
                </Grid>
              );
            })}
          </Grid>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5,
            p: 3,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <StandardButton variant="secondary" size="medium" onClick={onClose} type="button">
            {MASTER_VIEW_LABELS.CANCEL_BUTTON}
          </StandardButton>
          <StandardButton variant="primary" size="medium" type="submit" disabled={saving}>
            {MASTER_VIEW_LABELS.SAVE_BUTTON}
          </StandardButton>
        </Box>
      </Box>
    </Modal>
  );
};

export default MasterEditModal;
