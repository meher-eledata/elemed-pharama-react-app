import React, { useEffect, useState } from 'react';
import { Box, Chip, CircularProgress, TextField, Tooltip, Typography } from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { Dayjs } from 'dayjs';
import { StandardButton, PharmaDatePicker } from '../../../components/Common';
import {
  COMPLIANCE_CHIP_BASE_SX,
  COMPLIANCE_CONSTANTS,
  COMPLIANCE_FIELD_SX,
} from '../../../config/constants/Compliance.constants';
import { COMPLIANCE_LABELS } from '../../../config/label/Compliance.labels';
import {
  useGetComplianceDocumentQuery,
  useMakeComplianceVersionCurrentMutation,
  useUpdateComplianceVersionMutation,
  type ComplianceVersion,
} from '../../../redux/slices/complianceApi';
import { extractErrorMessage, logError } from '../../../utils/errorUtils';
import {
  formatApiDate,
  formatBytes,
  formatTimestamp,
  parseApiDate,
  toApiDate,
} from '../compliance.utils';

const L = COMPLIANCE_LABELS;
const C = COMPLIANCE_CONSTANTS;

interface VersionHistoryProps {
  documentId: number;
  // owner/admin — the make-current route is role-gated server-side.
  canMakeCurrent: boolean;
  // Controlled by the page so the row-level "Edit details" button can open the
  // current version's form directly.
  editingVersionId: number | null;
  onEditingVersionChange: (versionId: number | null) => void;
  onDownload: (version: ComplianceVersion) => void;
  onToast: (message: string, severity: 'success' | 'error') => void;
}

interface EditForm {
  validFrom: Dayjs | null;
  validTo: Dayjs | null;
  issuedBy: string;
  notes: string;
}

const metaLabelSx = { fontSize: '11px', fontWeight: 600, color: '#6B7280', fontFamily: C.FONT };
const metaValueSx = { fontSize: '13px', color: '#1A212B', fontFamily: C.FONT, wordBreak: 'break-word' as const };

const MetaField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box>
    <Typography sx={metaLabelSx}>{label}</Typography>
    <Typography sx={metaValueSx}>{value}</Typography>
  </Box>
);

const VersionHistory: React.FC<VersionHistoryProps> = ({
  documentId,
  canMakeCurrent,
  editingVersionId,
  onEditingVersionChange,
  onDownload,
  onToast,
}) => {
  // Only this endpoint returns the history; the list carries the current version only.
  const { data, isFetching, isError } = useGetComplianceDocumentQuery(documentId);
  const [updateVersion, { isLoading: isSaving }] = useUpdateComplianceVersionMutation();
  const [makeCurrent, { isLoading: isRepointing }] = useMakeComplianceVersionCurrentMutation();

  const [form, setForm] = useState<EditForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Seed the inline form whenever the edited version changes (including the page
  // opening it directly on the current version).
  useEffect(() => {
    if (editingVersionId == null) {
      setForm(null);
      setFormError(null);
      return;
    }
    const version = data?.versions.find((v) => v.id === editingVersionId);
    if (!version) return;
    setFormError(null);
    setForm({
      validFrom: parseApiDate(version.valid_from),
      validTo: parseApiDate(version.valid_to),
      issuedBy: version.issued_by ?? '',
      notes: version.notes ?? '',
    });
  }, [editingVersionId, data]);

  const handleSave = async (version: ComplianceVersion) => {
    if (!form) return;
    const from = toApiDate(form.validFrom);
    const to = toApiDate(form.validTo);
    // The PUT accepts a null valid_from, but a document without a start date is a
    // data-entry slip rather than an intent — guard it here instead of exposing it.
    if (!from && version.valid_from) {
      setFormError(L.VALIDATION.VALID_FROM_REQUIRED);
      return;
    }
    // Cross-field rule is evaluated on the merged values, exactly like the server.
    if (from && to && to < from) {
      setFormError(L.VALIDATION.VALID_TO_BEFORE_FROM);
      return;
    }

    const issuedBy = form.issuedBy.trim() || null;
    const notes = form.notes.trim() || null;
    const patch: Record<string, string | null> = {};
    if (from !== (version.valid_from ?? null)) patch.valid_from = from;
    // Clearing the expiry (null) is the explicit "does not expire" verb.
    if (to !== (version.valid_to ?? null)) patch.valid_to = to;
    if (issuedBy !== (version.issued_by ?? null)) patch.issued_by = issuedBy;
    if (notes !== (version.notes ?? null)) patch.notes = notes;

    if (Object.keys(patch).length === 0) {
      setFormError(L.VALIDATION.NO_CHANGES);
      return;
    }

    try {
      await updateVersion({ documentId, versionId: version.id, ...patch }).unwrap();
      onToast(L.TOAST.VERSION_UPDATED, 'success');
      onEditingVersionChange(null);
    } catch (error: unknown) {
      logError(error, 'ComplianceDocuments.updateVersion');
      setFormError(extractErrorMessage(error, L.TOAST.UPDATE_ERROR));
    }
  };

  const handleMakeCurrent = async (versionId: number) => {
    try {
      await makeCurrent({ documentId, versionId }).unwrap();
      onToast(L.TOAST.MADE_CURRENT, 'success');
    } catch (error: unknown) {
      logError(error, 'ComplianceDocuments.makeVersionCurrent');
      onToast(extractErrorMessage(error, L.TOAST.MAKE_CURRENT_ERROR), 'error');
    }
  };

  if (isFetching && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Typography sx={{ fontSize: '13px', color: '#B91C1C', fontFamily: C.FONT, py: 1 }}>
        {L.TOAST.HISTORY_ERROR}
      </Typography>
    );
  }

  const versions = data?.versions ?? [];
  if (versions.length === 0) {
    return (
      <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: C.FONT, py: 1 }}>
        {L.HINTS.NOTHING_FILED}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1.5 }}>
      {versions.map((version) => {
        // `is_current` comes from the server's explicit current_version_id pointer —
        // never re-derived from version_no here.
        const isCurrent = version.is_current;
        const isEditing = editingVersionId === version.id;
        return (
          <Box
            key={version.id}
            sx={{
              p: 1.5,
              borderRadius: '8px',
              border: `1px solid ${isCurrent ? '#DDD6FE' : '#E5E7EB'}`,
              backgroundColor: isCurrent ? '#F5F3FF' : '#F9FAFB',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                mb: 1,
              }}
            >
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1A212B', fontFamily: C.FONT }}>
                {L.HINTS.VERSION_NO(version.version_no)}
              </Typography>
              <Chip
                label={isCurrent ? L.BADGE.CURRENT : L.BADGE.SUPERSEDED}
                size="small"
                sx={{
                  ...COMPLIANCE_CHIP_BASE_SX,
                  backgroundColor: isCurrent ? '#EDE9FE' : '#F3F4F6',
                  color: isCurrent ? '#6D28D9' : '#4B5563',
                }}
              />
              <Box sx={{ flex: 1 }} />
              <StandardButton
                variant="text"
                size="small"
                startIcon={<DownloadOutlinedIcon sx={{ fontSize: 18 }} />}
                onClick={() => onDownload(version)}
              >
                {L.ACTIONS.DOWNLOAD}
              </StandardButton>
              {!isEditing && (
                <StandardButton
                  variant="text"
                  size="small"
                  onClick={() => onEditingVersionChange(version.id)}
                >
                  {L.ACTIONS.EDIT_DETAILS}
                </StandardButton>
              )}
              {!isCurrent && (
                <Tooltip
                  title={canMakeCurrent ? L.HINTS.MAKE_CURRENT : L.HINTS.MAKE_CURRENT_DENIED}
                >
                  <span>
                    <StandardButton
                      variant="outline"
                      size="small"
                      disabled={!canMakeCurrent || isRepointing}
                      onClick={() => handleMakeCurrent(version.id)}
                    >
                      {L.ACTIONS.MAKE_CURRENT}
                    </StandardButton>
                  </span>
                </Tooltip>
              )}
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 1.5,
              }}
            >
              <MetaField
                label={L.FIELDS.FILE_NAME}
                value={`${version.file_name} (${formatBytes(version.size_bytes)})`}
              />
              <MetaField label={L.FIELDS.UPLOADED_AT} value={formatTimestamp(version.uploaded_at)} />
              <MetaField
                label={L.FIELDS.UPLOADED_BY}
                value={version.uploaded_by ? L.HINTS.USER_REF(version.uploaded_by) : L.DASH}
              />
              <MetaField label={L.FIELDS.VALID_FROM} value={formatApiDate(version.valid_from)} />
              <MetaField
                label={L.FIELDS.VALID_TO}
                value={version.valid_to ? formatApiDate(version.valid_to) : L.STATE.NO_EXPIRY}
              />
              <MetaField label={L.FIELDS.ISSUED_BY} value={version.issued_by || L.DASH} />
            </Box>

            {version.notes && (
              <Box sx={{ mt: 1.5 }}>
                <MetaField label={L.FIELDS.NOTES} value={version.notes} />
              </Box>
            )}

            <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: C.FONT, mt: 1 }}>
              {isCurrent ? L.HINTS.CURRENT_VERSION : L.HINTS.HISTORICAL_VERSION}
            </Typography>

            {isEditing && form && (
              <Box
                sx={{
                  mt: 1.5,
                  pt: 1.5,
                  borderTop: '1px dashed #D1D5DB',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: C.FONT }}>
                  {L.MODALS.editSubtitle(version.version_no)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography sx={metaLabelSx}>{L.FIELDS.VALID_FROM}</Typography>
                    <PharmaDatePicker
                      value={form.validFrom}
                      onChange={(value) => setForm({ ...form, validFrom: value })}
                      width={170}
                    />
                  </Box>
                  <Box>
                    <Typography sx={metaLabelSx}>{L.FIELDS.VALID_TO}</Typography>
                    <PharmaDatePicker
                      value={form.validTo}
                      onChange={(value) => setForm({ ...form, validTo: value })}
                      width={170}
                      minDate={form.validFrom ?? undefined}
                    />
                    <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: C.FONT, mt: 0.5 }}>
                      {L.HINTS.VALID_TO_OPTIONAL}
                    </Typography>
                  </Box>
                </Box>
                <TextField
                  label={L.FIELDS.ISSUED_BY}
                  value={form.issuedBy}
                  onChange={(e) => setForm({ ...form, issuedBy: e.target.value })}
                  size="small"
                  sx={{ ...COMPLIANCE_FIELD_SX, maxWidth: '360px' }}
                />
                <TextField
                  label={L.FIELDS.NOTES}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  size="small"
                  multiline
                  minRows={2}
                  sx={COMPLIANCE_FIELD_SX}
                />
                {formError && (
                  <Typography sx={{ fontSize: '13px', color: '#B91C1C', fontFamily: C.FONT }}>
                    {formError}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <StandardButton
                    variant="primary"
                    size="small"
                    disabled={isSaving}
                    onClick={() => handleSave(version)}
                  >
                    {L.ACTIONS.SAVE}
                  </StandardButton>
                  <StandardButton
                    variant="secondary"
                    size="small"
                    onClick={() => onEditingVersionChange(null)}
                  >
                    {L.ACTIONS.CANCEL}
                  </StandardButton>
                </Box>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default VersionHistory;
