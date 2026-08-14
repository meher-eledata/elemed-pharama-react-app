import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  TextField,
  MenuItem,
  Collapse,
  IconButton,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { SETTINGS_LABELS } from '../../config/label/Settings.labels';
import { SETTINGS_CONSTANTS } from '../../config/constants/Settings.constants';
import { StandardButton } from '../../components/Common';
import {
  useGetDocumentNumberingQuery,
  useUpdateDocumentNumberingMutation,
  DocType,
  DocumentNumberScheme,
} from '../../redux/slices/orgApi';
import {
  renderInvoiceNumberPreview,
  validateInvoiceTemplate,
} from '../../utils/invoiceNumberPreview';
import { extractErrorMessage, logError } from '../../utils/errorUtils';

const DOC = SETTINGS_LABELS.SECTIONS.DOCUMENT_NUMBERING;
const FONT = "'Lexend', sans-serif";
const ACCENT = '#5C17E5';
// Drives the panel AND its chevron — one duration so nothing lands out of step.
const COLLAPSE_MS = 200;

// Numeric fields are kept as text so a half-typed value is not coerced.
interface SchemeForm {
  enabled: boolean;
  template: string;
  // WRITE-ONLY one-time cutover: always starts blank (never seeded from the stored
  // scheme), so a non-empty value means "the admin typed one this session" and blank
  // means "leave the live counter alone". seq_start is only ever PUT when non-empty —
  // re-sending the stored value would rewind next_number on every unrelated edit.
  seq_start: string;
  reset_cycle: 'none' | 'monthly' | 'annual';
  reset_anchor_month: number;
  reset_anchor_day: string;
  reset_to: string;
}

const toForm = (scheme: DocumentNumberScheme): SchemeForm => ({
  enabled: scheme.enabled,
  template: scheme.template ?? '',
  seq_start: '',
  reset_cycle: scheme.reset_cycle,
  reset_anchor_month: scheme.reset_anchor_month,
  reset_anchor_day: String(scheme.reset_anchor_day),
  reset_to: String(scheme.reset_to),
});

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: SETTINGS_CONSTANTS.EMAIL_INPUT.RADIUS,
    backgroundColor: '#FFFFFF',
    fontFamily: FONT,
  },
  '& .MuiInputBase-input': { fontSize: '14px', color: '#1A212B' },
  '& .MuiFormHelperText-root': { fontFamily: FONT, fontSize: '12px', marginLeft: 0 },
  '& .MuiInputLabel-root': { fontFamily: FONT, fontSize: '14px' },
};

const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: ACCENT },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: ACCENT },
};

interface DocumentNumberingProps {
  // Owner/admin only — the PUT is role-gated, so everyone else sees the values read-only.
  canEdit: boolean;
  onToast: (message: string, severity: 'success' | 'error' | 'info') => void;
}

const DocumentNumbering: React.FC<DocumentNumberingProps> = ({ canEdit, onToast }) => {
  const { data, isLoading, isError } = useGetDocumentNumberingQuery();
  const [updateDocumentNumbering] = useUpdateDocumentNumberingMutation();

  const [forms, setForms] = useState<Partial<Record<DocType, SchemeForm>>>({});
  const [openDocType, setOpenDocType] = useState<DocType | null>(null);
  const [savingDocType, setSavingDocType] = useState<DocType | null>(null);
  // Server-only cross-field anchor 400 (deliberately not mirrored client-side): keep the
  // verbatim message on the field after the toast auto-hides, until the admin edits it.
  const [anchorErrors, setAnchorErrors] = useState<Partial<Record<DocType, string>>>({});
  // The PUT answers with the MERGED row (same shape as a GET entry, `preview` included),
  // so the summary can show the saved configuration the instant the row collapses. The
  // tag invalidation refetches too, but lands a round trip later — without this overlay
  // the admin sees the OLD example flash back at them and reads the save as lost.
  const [savedSchemes, setSavedSchemes] = useState<Partial<Record<DocType, DocumentNumberScheme>>>({});
  // Focus target after a save collapses the panel (the save button unmounts with it).
  const toggleRefs = useRef<Partial<Record<DocType, HTMLButtonElement | null>>>({});

  // Re-seed whenever the schemes (re)load — after a save the PUT invalidates the tag, so
  // the refetched (merged) values become the form values and supersede the overlay.
  useEffect(() => {
    if (!data) return;
    setSavedSchemes({});
    setForms(
      data.schemes.reduce<Partial<Record<DocType, SchemeForm>>>((acc, scheme) => {
        acc[scheme.doc_type] = toForm(scheme);
        return acc;
      }, {}),
    );
  }, [data]);

  const setField = <K extends keyof SchemeForm>(docType: DocType, key: K, value: SchemeForm[K]) =>
    setForms((f) => (f[docType] ? { ...f, [docType]: { ...f[docType]!, [key]: value } } : f));

  const clearAnchorError = (docType: DocType) =>
    setAnchorErrors((e) => (e[docType] ? { ...e, [docType]: undefined } : e));

  const handleSave = async (docType: DocType, docLabel: string) => {
    const form = forms[docType];
    if (!form) return;

    const template = form.template.trim();
    const startRaw = form.seq_start.trim();
    const seqStart = Number(startRaw);
    const resetToRaw = form.reset_to.trim();
    const resetTo = Number(resetToRaw);
    const anchorDay = Number(form.reset_anchor_day.trim());

    // Instant client-side feedback; the server still validates and its 400s are surfaced.
    if (startRaw !== '' && (!Number.isInteger(seqStart) || seqStart < 0)) {
      onToast(DOC.START_INVALID, 'error');
      return;
    }
    if (resetToRaw !== '' && (!Number.isInteger(resetTo) || resetTo < 0)) {
      onToast(DOC.RESET_TO_INVALID, 'error');
      return;
    }
    if (!Number.isInteger(anchorDay) || anchorDay < 1 || anchorDay > 31) {
      onToast(DOC.ANCHOR_DAY_INVALID, 'error');
      return;
    }
    if (form.enabled && !template) {
      onToast(DOC.TEMPLATE_REQUIRED, 'error');
      return;
    }
    if (template) {
      const check = validateInvoiceTemplate(template);
      if (!check.valid) {
        onToast(check.error ?? DOC.SAVE_ERROR, 'error');
        return;
      }
    }

    setSavingDocType(docType);
    try {
      // Omitted fields keep their stored value (see the API contract). Both numeric
      // fields are therefore sent ONLY when the admin filled them in: re-sending
      // seq_start would re-seed the live counter, and a blanked reset_to must never be
      // coerced to 0 (that would restart every later period at 0).
      const { scheme } = await updateDocumentNumbering({
        doc_type: docType,
        enabled: form.enabled,
        template: template || null,
        reset_cycle: form.reset_cycle,
        reset_anchor_month: form.reset_anchor_month,
        reset_anchor_day: anchorDay,
        ...(startRaw !== '' && { seq_start: seqStart }),
        ...(resetToRaw !== '' && { reset_to: resetTo }),
      }).unwrap();
      // The cutover has been applied — leaving it in the box would misread as "this is
      // the next number" and re-apply on the next save. It stays readable in the
      // summary's example, which now samples the STORED cutover the save just wrote.
      setField(docType, 'seq_start', '');
      clearAnchorError(docType);
      // Show the merged row first, then collapse: the summary the admin lands on is
      // already the saved one. ONLY on success — a failed save keeps the panel open with
      // its inline error. Focus moves to the row's toggle, which the collapse leaves in
      // place, so it is never dropped onto <body>.
      setSavedSchemes((s) => ({ ...s, [docType]: scheme }));
      setOpenDocType(null);
      toggleRefs.current[docType]?.focus();
      onToast(DOC.SAVE_SUCCESS(docLabel), 'success');
    } catch (err) {
      logError(err, 'DocumentNumbering.update');
      const message = extractErrorMessage(err, DOC.SAVE_ERROR);
      // The server names the offending field; keep its wording on that field.
      if (message.includes('reset_anchor_day')) {
        setAnchorErrors((e) => ({ ...e, [docType]: message }));
      }
      onToast(message, 'error');
    } finally {
      setSavingDocType(null);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#6B7280' }}>
        <CircularProgress size={18} />
        <Typography sx={{ fontSize: '14px', fontFamily: FONT }}>{DOC.LOADING}</Typography>
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Typography sx={{ fontSize: '14px', color: '#EF4444', fontFamily: FONT }}>
        {DOC.LOAD_ERROR}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {!canEdit && (
        <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: FONT }}>
          {DOC.READ_ONLY_NOTE}
        </Typography>
      )}

      {data.schemes.map((fetched) => {
        const docType = fetched.doc_type;
        // A just-saved row shows the PUT's merged scheme until the refetch supersedes it.
        const scheme = savedSchemes[docType] ?? fetched;
        const docLabel = DOC.DOC_TYPES[docType];
        const form = forms[docType];
        const isOpen = openDocType === docType;
        const anchorError = anchorErrors[docType];

        // Live EXAMPLE of the format (never the live counter): the backend samples with
        // `seq_start ?? reset_to` for a document dated today, so the form mirrors that
        // rule exactly — a cutover typed THIS session, else the scheme's STORED cutover,
        // else the recurring restart number. The stored fallback is what keeps this panel
        // and the summary's server-rendered example on the same number: the cutover box
        // is write-only and always loads blank, so without it a series with a stored
        // seq_start showed two different numbers in the two places at once.
        // The form's cycle+anchor go in too, because {YY}/{YYYY}/{MM} render the PERIOD
        // BUCKET's year: on the default 1-April anchor a preview shown in February must
        // say the running financial year, exactly as the server's `preview` does.
        const templateCheck = form?.template.trim() ? validateInvoiceTemplate(form.template.trim()) : null;
        const storedSeq = scheme.seq_start === null ? '' : String(scheme.seq_start);
        const sampleSeq = Number(
          form ? form.seq_start.trim() || storedSeq || form.reset_to.trim() || '0' : '0',
        );
        const preview =
          form && templateCheck?.valid
            ? renderInvoiceNumberPreview(
                form.template.trim(),
                Number.isFinite(sampleSeq) ? sampleSeq : 0,
                new Date(),
                {
                  cycle: form.reset_cycle,
                  anchorMonth: form.reset_anchor_month,
                  anchorDay: Number(form.reset_anchor_day),
                },
              )
            : null;
        // The two examples may still legitimately differ — the summary shows what the
        // SAVED scheme samples, the panel what the EDITED one would. Say so rather than
        // letting two numbers disagree silently.
        const previewIsPending = preview !== null && preview !== scheme.preview;

        return (
          <Box
            key={docType}
            sx={{
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              backgroundColor: '#F9FAFB',
              overflow: 'hidden',
            }}
          >
            {/* Summary row — name, saved state and a sample of the format, so all four
                series stay scannable without expanding any of them. */}
            <Box
              onClick={() => setOpenDocType(isOpen ? null : docType)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                padding: '12px 16px',
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#F3F4F6' },
              }}
            >
              <Typography
                sx={{ fontSize: '14px', fontWeight: 600, color: '#1A212B', fontFamily: FONT, minWidth: '140px' }}
              >
                {docLabel}
              </Typography>
              <Typography
                sx={{
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: FONT,
                  borderRadius: '6px',
                  px: 1,
                  py: '2px',
                  color: scheme.enabled ? ACCENT : '#6B7280',
                  backgroundColor: scheme.enabled ? 'rgba(92, 23, 229, 0.1)' : '#E5E7EB',
                }}
              >
                {scheme.enabled ? DOC.STATUS_ON : DOC.STATUS_OFF}
              </Typography>
              <Typography
                sx={{
                  flex: 1,
                  fontSize: '13px',
                  color: '#6B7280',
                  fontFamily: FONT,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {scheme.enabled && scheme.preview
                  ? DOC.SUMMARY_EXAMPLE(scheme.preview)
                  : DOC.SUMMARY_DEFAULT}
              </Typography>
              <IconButton
                size="small"
                aria-label={DOC.EXPAND_ARIA(docLabel)}
                aria-expanded={isOpen}
                ref={(el) => {
                  toggleRefs.current[docType] = el;
                }}
              >
                <ExpandMoreIcon
                  sx={{
                    color: '#1A212B',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    // Same duration as the Collapse below, so the chevron and the panel
                    // finish together instead of the arrow landing 150ms early.
                    transition: `transform ${COLLAPSE_MS}ms`,
                  }}
                />
              </IconButton>
            </Box>

            <Collapse in={isOpen} timeout={COLLAPSE_MS} unmountOnExit>
              {form && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    padding: '16px',
                    borderTop: '1px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.enabled}
                        disabled={!canEdit}
                        onChange={(e) => setField(docType, 'enabled', e.target.checked)}
                        sx={switchSx}
                      />
                    }
                    label={
                      <Typography sx={{ fontSize: '14px', color: '#1A212B', fontFamily: FONT }}>
                        {DOC.ENABLE_LABEL}
                      </Typography>
                    }
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label={DOC.TEMPLATE_LABEL}
                    value={form.template}
                    onChange={(e) => setField(docType, 'template', e.target.value)}
                    disabled={!canEdit}
                    error={templateCheck ? !templateCheck.valid : false}
                    helperText={
                      templateCheck && !templateCheck.valid
                        ? templateCheck.error
                        : `${DOC.TEMPLATE_HELP} ${DOC.TEMPLATE_EXAMPLE}`
                    }
                    sx={fieldSx}
                  />

                  {preview && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(92, 23, 229, 0.06)',
                      }}
                    >
                      <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: FONT }}>
                        {previewIsPending
                          ? DOC.PREVIEW_PENDING_PREFIX(docLabel)
                          : DOC.PREVIEW_PREFIX(docLabel)}
                      </Typography>
                      <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1A212B', fontFamily: FONT }}>
                        {preview}
                      </Typography>
                    </Box>
                  )}

                  {/* ONE-TIME cutover — deliberately separated from the recurring reset below,
                      because "start from" and "restart at" are the pair users conflate. */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      borderLeft: `3px solid ${ACCENT}`,
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1A212B', fontFamily: FONT }}>
                        {DOC.CUTOVER_HEADING}
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: FONT, mt: '2px' }}>
                        {DOC.CUTOVER_DESC}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <TextField
                        type="number"
                        size="small"
                        label={DOC.START_LABEL}
                        value={form.seq_start}
                        onChange={(e) => setField(docType, 'seq_start', e.target.value)}
                        disabled={!canEdit}
                        inputProps={{ min: 0, step: 1 }}
                        sx={{ ...fieldSx, maxWidth: '320px' }}
                      />
                      {/* Panel-width, like the anchor help: too long for the 320px field. */}
                      <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: FONT }}>
                        {DOC.START_HELP}
                      </Typography>
                    </Box>
                  </Box>

                  {/* RECURRING reset — applies to every new period. */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      borderLeft: '3px solid #D7DFEA',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1A212B', fontFamily: FONT }}>
                        {DOC.RECURRING_HEADING}
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: FONT, mt: '2px' }}>
                        {DOC.RECURRING_DESC}
                      </Typography>
                    </Box>
                    {/* ONE grid for both rows, so "Every new period restarts at" and "on day"
                        share a column edge instead of each row sizing itself. */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 240px))' },
                        alignItems: 'start',
                        columnGap: 1.5,
                        rowGap: 1.5,
                      }}
                    >
                      <TextField
                        select
                        size="small"
                        label={DOC.RESET_LABEL}
                        value={form.reset_cycle}
                        onChange={(e) =>
                          setField(docType, 'reset_cycle', e.target.value as SchemeForm['reset_cycle'])
                        }
                        disabled={!canEdit}
                        sx={fieldSx}
                      >
                        <MenuItem value="none">{DOC.RESET_NONE}</MenuItem>
                        <MenuItem value="monthly">{DOC.RESET_MONTHLY}</MenuItem>
                        <MenuItem value="annual">{DOC.RESET_ANNUAL}</MenuItem>
                      </TextField>
                      <TextField
                        type="number"
                        size="small"
                        label={DOC.RESET_TO_LABEL}
                        value={form.reset_to}
                        onChange={(e) => setField(docType, 'reset_to', e.target.value)}
                        disabled={!canEdit}
                        inputProps={{ min: 0, step: 1 }}
                        helperText={DOC.RESET_TO_HELP}
                        sx={fieldSx}
                      />
                      {form.reset_cycle === 'annual' && (
                        <>
                          <TextField
                            select
                            size="small"
                            label={DOC.ANCHOR_MONTH_LABEL}
                            value={form.reset_anchor_month}
                            onChange={(e) => {
                              setField(docType, 'reset_anchor_month', Number(e.target.value));
                              clearAnchorError(docType);
                            }}
                            disabled={!canEdit}
                            sx={fieldSx}
                          >
                            {DOC.MONTHS.map((month, index) => (
                              <MenuItem key={month} value={index + 1}>
                                {month}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            type="number"
                            size="small"
                            label={DOC.ANCHOR_DAY_LABEL}
                            value={form.reset_anchor_day}
                            onChange={(e) => {
                              setField(docType, 'reset_anchor_day', e.target.value);
                              clearAnchorError(docType);
                            }}
                            disabled={!canEdit}
                            inputProps={{ min: 1, max: 31, step: 1 }}
                            error={Boolean(anchorError)}
                            sx={fieldSx}
                          />
                          {/* The neutral anchor help spans the panel (too long for one
                              column). The server's cross-field 400 instead starts under the
                              "on day" field (column 2) it red-outlines, so the message reads
                              as belonging to that field; it wraps downward within the column,
                              which never moves the fields above it. */}
                          <Typography
                            sx={{
                              gridColumn: { xs: '1 / -1', sm: anchorError ? '2' : '1 / -1' },
                              fontSize: '12px',
                              fontFamily: FONT,
                              color: anchorError ? '#EF4444' : '#6B7280',
                            }}
                          >
                            {anchorError || DOC.ANCHOR_HELP}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>

                  {canEdit && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <StandardButton
                        onClick={() => handleSave(docType, docLabel)}
                        disabled={savingDocType === docType}
                        variant="primary"
                        size="medium"
                        sx={{
                          minWidth: '140px',
                          height: SETTINGS_CONSTANTS.EMAIL_INPUT.HEIGHT,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {DOC.SAVE_BUTTON}
                      </StandardButton>
                    </Box>
                  )}
                </Box>
              )}
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
};

export default DocumentNumbering;
