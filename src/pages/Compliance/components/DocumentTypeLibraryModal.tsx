import React, { useState } from 'react';
import { Alert, Box, Chip, CircularProgress, FormControlLabel, Switch, Typography } from '@mui/material';
import CommonModal from '../../../components/CommonModal/CommonModal';
import { StandardButton } from '../../../components/Common';
import {
  COMPLIANCE_CHIP_BASE_SX,
  COMPLIANCE_CONSTANTS,
} from '../../../config/constants/Compliance.constants';
import { COMPLIANCE_LABELS } from '../../../config/label/Compliance.labels';
import {
  useCreateComplianceDocumentTypeMutation,
  useGetComplianceDocumentTypeLibraryQuery,
  useUpdateComplianceDocumentTypeMutation,
  type ComplianceDocumentTypeTemplate,
} from '../../../redux/slices/complianceApi';
import { extractErrorMessage, logError } from '../../../utils/errorUtils';

const L = COMPLIANCE_LABELS;
const C = COMPLIANCE_CONSTANTS;

const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: C.ACCENT },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: C.ACCENT },
};

interface DocumentTypeLibraryModalProps {
  open: boolean;
  onClose: () => void;
  // "Not on the list" — hands over to the free-form DocumentTypeModal.
  onCustom: () => void;
  onToast: (message: string, severity: 'success' | 'error') => void;
}

// The shipped standard types, offered as a PICK LIST. Nothing here is in the
// pharmacy's catalogue until it is added from this modal.
const DocumentTypeLibraryModal: React.FC<DocumentTypeLibraryModalProps> = ({
  open,
  onClose,
  onCustom,
  onToast,
}) => {
  const { data: templates = [], isLoading, isError } = useGetComplianceDocumentTypeLibraryQuery(
    undefined,
    { skip: !open },
  );
  const [createType] = useCreateComplianceDocumentTypeMutation();
  const [updateType] = useUpdateComplianceDocumentTypeMutation();

  // Only the keys the user has overridden — everything else follows the template.
  const [requiredOverrides, setRequiredOverrides] = useState<Record<string, boolean>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const isRequired = (template: ComplianceDocumentTypeTemplate): boolean =>
    requiredOverrides[template.key] ?? template.is_required;

  const handleAdd = async (template: ComplianceDocumentTypeTemplate) => {
    setBusyKey(template.key);
    try {
      await createType({
        key: template.key,
        name: template.name,
        category: template.category,
        is_required: isRequired(template),
        default_validity_months: template.default_validity_months,
      }).unwrap();
      onToast(L.LIBRARY.added(template.name), 'success');
    } catch (error: unknown) {
      logError(error, 'ComplianceSettings.addLibraryType');
      onToast(extractErrorMessage(error, L.TYPES.CREATE_ERROR), 'error');
    } finally {
      setBusyKey(null);
    }
  };

  // An archived row still holds the key, so it is RESTORED rather than re-created.
  const handleRestore = async (template: ComplianceDocumentTypeTemplate) => {
    if (template.id === null) return;
    setBusyKey(template.key);
    try {
      await updateType({ id: template.id, status: 'ACTIVE' }).unwrap();
      onToast(L.TYPES.RESTORED, 'success');
    } catch (error: unknown) {
      logError(error, 'ComplianceSettings.restoreLibraryType');
      onToast(extractErrorMessage(error, L.TYPES.CREATE_ERROR), 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const allAdded = templates.length > 0 && templates.every((template) => template.already_added);

  return (
    <CommonModal
      open={open}
      title={L.LIBRARY.TITLE}
      maxWidth="640px"
      onClose={onClose}
      actionButtons={
        <StandardButton variant="outline" onClick={onCustom}>
          {L.LIBRARY.CUSTOM}
        </StandardButton>
      }
      content={
        <Box sx={{ p: 1 }}>
          <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: C.FONT }}>
            {L.LIBRARY.SUBTITLE}
          </Typography>

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={22} />
            </Box>
          )}
          {isError && (
            <Alert severity="error" sx={{ mt: 2, fontFamily: C.FONT }}>
              {L.LIBRARY.LOAD_ERROR}
            </Alert>
          )}
          {!isLoading && !isError && allAdded && (
            <Alert severity="info" sx={{ mt: 2, fontFamily: C.FONT }}>
              {L.LIBRARY.ALL_ADDED}
            </Alert>
          )}

          {!isLoading && !isError && templates.length > 0 && (
            <Typography
              sx={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#1A212B',
                fontFamily: C.FONT,
                mt: 2,
              }}
            >
              {L.LIBRARY.STANDARD}
            </Typography>
          )}

          {!isLoading &&
            !isError &&
            templates.map((template) => {
              const isArchived = template.already_added && template.status === 'ARCHIVED';
              return (
                <Box
                  key={template.key}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap',
                    py: 1.5,
                    mt: 1.5,
                    borderTop: '1px solid #F3F4F6',
                    opacity: template.already_added && !isArchived ? 0.6 : 1,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: '200px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#1A212B',
                          fontFamily: C.FONT,
                        }}
                      >
                        {template.name}
                      </Typography>
                      {template.category && (
                        <Chip
                          label={template.category}
                          size="small"
                          sx={{
                            ...COMPLIANCE_CHIP_BASE_SX,
                            backgroundColor: '#F3F4F6',
                            color: '#4B5563',
                          }}
                        />
                      )}
                      {isArchived && (
                        <Chip
                          label={L.BADGE.ARCHIVED}
                          size="small"
                          sx={{
                            ...COMPLIANCE_CHIP_BASE_SX,
                            backgroundColor: '#F3F4F6',
                            color: '#4B5563',
                          }}
                        />
                      )}
                    </Box>
                    <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: C.FONT }}>
                      {template.default_validity_months
                        ? L.HINTS.RENEWAL_MONTHS(template.default_validity_months)
                        : L.LIBRARY.NO_RENEWAL}
                    </Typography>
                  </Box>

                  {template.already_added ? (
                    isArchived ? (
                      <StandardButton
                        variant="outline"
                        size="small"
                        disabled={busyKey === template.key}
                        onClick={() => handleRestore(template)}
                      >
                        {L.LIBRARY.RESTORE}
                      </StandardButton>
                    ) : (
                      <Chip
                        label={L.LIBRARY.ADDED}
                        size="small"
                        sx={{
                          ...COMPLIANCE_CHIP_BASE_SX,
                          backgroundColor: '#DCFCE7',
                          color: '#15803D',
                        }}
                      />
                    )
                  ) : (
                    <>
                      {/* The template's own flag is only the DEFAULT — whether a
                          paper is required is the pharmacy's call, here and later
                          from "Edit details". */}
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={isRequired(template)}
                            onChange={(e) =>
                              setRequiredOverrides((current) => ({
                                ...current,
                                [template.key]: e.target.checked,
                              }))
                            }
                            sx={switchSx}
                          />
                        }
                        label={
                          <Typography
                            sx={{ fontSize: '12px', fontFamily: C.FONT, color: '#6B7280' }}
                          >
                            {L.LIBRARY.REQUIRED_TOGGLE}
                          </Typography>
                        }
                        sx={{ mr: 0 }}
                      />
                      <StandardButton
                        variant="primary"
                        size="small"
                        disabled={busyKey === template.key}
                        onClick={() => handleAdd(template)}
                      >
                        {L.LIBRARY.ADD}
                      </StandardButton>
                    </>
                  )}
                </Box>
              );
            })}

          <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: C.FONT, mt: 2 }}>
            {L.LIBRARY.CUSTOM_HINT}
          </Typography>
        </Box>
      }
    />
  );
};

export default DocumentTypeLibraryModal;
