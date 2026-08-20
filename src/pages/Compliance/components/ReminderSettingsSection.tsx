import React, { useEffect, useState } from 'react';
import { Alert, Box, Chip, CircularProgress, MenuItem, TextField, Typography } from '@mui/material';
import { StandardButton } from '../../../components/Common';
import {
  COMPLIANCE_CARD_SX,
  COMPLIANCE_CHIP_BASE_SX,
  COMPLIANCE_CONSTANTS,
  COMPLIANCE_FIELD_SX,
} from '../../../config/constants/Compliance.constants';
import { COMPLIANCE_LABELS } from '../../../config/label/Compliance.labels';
import {
  useGetComplianceDocumentTypesQuery,
  useGetComplianceNotificationSettingsQuery,
  useUpdateComplianceNotificationSettingsMutation,
} from '../../../redux/slices/complianceApi';
import { extractErrorMessage, logError } from '../../../utils/errorUtils';

const L = COMPLIANCE_LABELS;
const C = COMPLIANCE_CONSTANTS;

// 1..6 whole numbers, each 1..3650. The server de-duplicates and re-sorts
// descending, so the saved response — not this local order — is what re-renders.
const parseLeadDays = (raw: string): number[] | null => {
  const parts = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');
  if (parts.length < 1 || parts.length > 6) return null;
  const days = parts.map(Number);
  if (days.some((day) => !Number.isInteger(day) || day < 1 || day > 3650)) return null;
  return days;
};

const formatLeadDays = (days: number[]): string => days.join(', ');

interface ReminderSettingsSectionProps {
  // owner/admin — the PUT is role-gated; everyone else reads the values.
  canEdit: boolean;
  onToast: (message: string, severity: 'success' | 'error') => void;
}

const ReminderSettingsSection: React.FC<ReminderSettingsSectionProps> = ({ canEdit, onToast }) => {
  const { data, isLoading, isError } = useGetComplianceNotificationSettingsQuery();
  const { data: types = [] } = useGetComplianceDocumentTypesQuery({ status: 'ACTIVE' });
  const [updateSettings, { isLoading: isSaving }] =
    useUpdateComplianceNotificationSettingsMutation();

  const [defaultDays, setDefaultDays] = useState('');
  const [overrideDays, setOverrideDays] = useState<Record<number, string>>({});
  const [newOverrideType, setNewOverrideType] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  // Re-seed from the server response after every load/save.
  useEffect(() => {
    if (!data) return;
    setDefaultDays(formatLeadDays(data.lead_days));
    setOverrideDays(
      data.overrides.reduce<Record<number, string>>((acc, override) => {
        acc[override.document_type_id] = formatLeadDays(override.lead_days);
        return acc;
      }, {}),
    );
    setNewOverrideType('');
    setError(null);
  }, [data]);

  const save = async (
    body: Parameters<typeof updateSettings>[0],
    successMessage: string,
  ): Promise<void> => {
    try {
      await updateSettings(body).unwrap();
      onToast(successMessage, 'success');
      setError(null);
    } catch (err: unknown) {
      logError(err, 'ComplianceSettings.updateNotificationSettings');
      setError(extractErrorMessage(err, L.REMINDERS.SAVE_ERROR));
    }
  };

  const handleSaveDefault = () => {
    const parsed = parseLeadDays(defaultDays);
    if (!parsed) {
      setError(L.REMINDERS.INVALID);
      return;
    }
    // Top-level lead_days may never be null — only a valid array or omitted.
    void save({ lead_days: parsed }, L.REMINDERS.SAVED);
  };

  const handleSaveOverride = (documentTypeId: number) => {
    const parsed = parseLeadDays(overrideDays[documentTypeId] ?? '');
    if (!parsed) {
      setError(L.REMINDERS.INVALID);
      return;
    }
    // `overrides` upserts only the types it names — omitted types keep theirs.
    void save(
      { overrides: [{ document_type_id: documentTypeId, lead_days: parsed }] },
      L.REMINDERS.SAVED,
    );
  };

  // `lead_days: null` is the delete verb — there is no DELETE endpoint.
  const handleRemoveOverride = (documentTypeId: number) =>
    void save({ overrides: [{ document_type_id: documentTypeId, lead_days: null }] }, L.REMINDERS.SAVED);

  const handleAddOverride = () => {
    if (!newOverrideType) return;
    const parsed = parseLeadDays(defaultDays) ?? [...C.DEFAULT_LEAD_DAYS];
    void save(
      { overrides: [{ document_type_id: newOverrideType, lead_days: parsed }] },
      L.REMINDERS.SAVED,
    );
  };

  const overrides = data?.overrides ?? [];
  const overriddenIds = new Set(overrides.map((override) => override.document_type_id));
  const availableTypes = types.filter((type) => !overriddenIds.has(type.id));

  return (
    <Box sx={{ ...COMPLIANCE_CARD_SX, p: 2.5 }}>
      <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1A212B', fontFamily: C.FONT }}>
        {L.REMINDERS.TITLE}
      </Typography>
      <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: C.FONT, mt: 0.5 }}>
        {L.REMINDERS.SUBTITLE}
      </Typography>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={22} />
        </Box>
      )}
      {isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {L.REMINDERS.LOAD_ERROR}
        </Alert>
      )}

      {!isLoading && !isError && data && (
        <>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                sx={{ fontSize: '14px', fontWeight: 600, color: '#1A212B', fontFamily: C.FONT }}
              >
                {L.REMINDERS.ORG_DEFAULT}
              </Typography>
              {data.is_default && (
                <Chip
                  label={L.REMINDERS.USING_DEFAULTS}
                  size="small"
                  sx={{ ...COMPLIANCE_CHIP_BASE_SX, backgroundColor: '#F3F4F6', color: '#4B5563' }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
              <TextField
                label={L.REMINDERS.LEAD_DAYS}
                value={defaultDays}
                onChange={(e) => setDefaultDays(e.target.value)}
                size="small"
                disabled={!canEdit}
                helperText={L.REMINDERS.LEAD_DAYS_HINT}
                sx={{ ...COMPLIANCE_FIELD_SX, minWidth: '320px', flex: 1 }}
              />
              {canEdit && (
                <StandardButton
                  variant="primary"
                  size="small"
                  disabled={isSaving}
                  onClick={handleSaveDefault}
                >
                  {L.ACTIONS.SAVE}
                </StandardButton>
              )}
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography
              sx={{ fontSize: '14px', fontWeight: 600, color: '#1A212B', fontFamily: C.FONT }}
            >
              {L.REMINDERS.OVERRIDES}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: C.FONT }}>
              {L.REMINDERS.OVERRIDES_HINT}
            </Typography>

            {overrides.length === 0 && (
              <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: C.FONT, mt: 1.5 }}>
                {L.REMINDERS.NO_OVERRIDES}
              </Typography>
            )}

            {overrides.map((override) => (
              <Box
                key={override.document_type_id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  flexWrap: 'wrap',
                  py: 1.5,
                  borderTop: '1px solid #F3F4F6',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '14px',
                    color: '#1A212B',
                    fontFamily: C.FONT,
                    flex: 1,
                    minWidth: '160px',
                  }}
                >
                  {/* type_key/type_name come from a LEFT JOIN and can be null. */}
                  {override.type_name ?? override.type_key ?? `#${override.document_type_id}`}
                </Typography>
                <TextField
                  value={overrideDays[override.document_type_id] ?? ''}
                  onChange={(e) =>
                    setOverrideDays((current) => ({
                      ...current,
                      [override.document_type_id]: e.target.value,
                    }))
                  }
                  size="small"
                  disabled={!canEdit}
                  sx={{ ...COMPLIANCE_FIELD_SX, width: '200px' }}
                />
                {canEdit && (
                  <>
                    <StandardButton
                      variant="secondary"
                      size="small"
                      disabled={isSaving}
                      onClick={() => handleSaveOverride(override.document_type_id)}
                    >
                      {L.ACTIONS.SAVE}
                    </StandardButton>
                    <StandardButton
                      variant="text"
                      size="small"
                      disabled={isSaving}
                      onClick={() => handleRemoveOverride(override.document_type_id)}
                    >
                      {L.REMINDERS.REMOVE_OVERRIDE}
                    </StandardButton>
                  </>
                )}
              </Box>
            ))}

            {canEdit && availableTypes.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mt: 2 }}>
                <TextField
                  select
                  label={L.REMINDERS.ADD_OVERRIDE}
                  value={newOverrideType}
                  onChange={(e) => setNewOverrideType(Number(e.target.value))}
                  size="small"
                  sx={{ ...COMPLIANCE_FIELD_SX, minWidth: '260px' }}
                >
                  {availableTypes.map((type) => (
                    <MenuItem
                      key={type.id}
                      value={type.id}
                      sx={{ fontFamily: C.FONT, fontSize: '14px' }}
                    >
                      {type.name}
                    </MenuItem>
                  ))}
                </TextField>
                <StandardButton
                  variant="outline"
                  size="small"
                  disabled={!newOverrideType || isSaving}
                  onClick={handleAddOverride}
                >
                  {L.REMINDERS.ADD_OVERRIDE}
                </StandardButton>
              </Box>
            )}
          </Box>

          {!canEdit && (
            <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: C.FONT, mt: 2 }}>
              {L.REMINDERS.READ_ONLY}
            </Typography>
          )}
          {error && (
            <Typography sx={{ fontSize: '13px', color: '#B91C1C', fontFamily: C.FONT, mt: 2 }}>
              {error}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default ReminderSettingsSection;
