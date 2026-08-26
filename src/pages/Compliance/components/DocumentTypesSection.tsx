import React, { useState } from 'react';
import { Alert, Box, Chip, CircularProgress, Tooltip, Typography } from '@mui/material';
import { StandardButton } from '../../../components/Common';
import {
  COMPLIANCE_CARD_SX,
  COMPLIANCE_CHIP_BASE_SX,
  COMPLIANCE_CONSTANTS,
} from '../../../config/constants/Compliance.constants';
import { COMPLIANCE_LABELS } from '../../../config/label/Compliance.labels';
import {
  useGetComplianceDocumentTypesQuery,
  useUpdateComplianceDocumentTypeMutation,
  type ComplianceDocumentType,
} from '../../../redux/slices/complianceApi';
import { extractErrorMessage, logError } from '../../../utils/errorUtils';
import DeleteDocumentTypeDialog from './DeleteDocumentTypeDialog';
import DocumentTypeLibraryModal from './DocumentTypeLibraryModal';
import DocumentTypeModal from './DocumentTypeModal';

const L = COMPLIANCE_LABELS;
const C = COMPLIANCE_CONSTANTS;

interface DocumentTypesSectionProps {
  // owner/admin — every mutation on this section is role-gated server-side.
  canEdit: boolean;
  onToast: (message: string, severity: 'success' | 'error') => void;
}

const DocumentTypesSection: React.FC<DocumentTypesSectionProps> = ({ canEdit, onToast }) => {
  // `status: 'all'` — archived types must stay visible here, that is the only
  // place they can be restored from.
  const { data: types = [], isLoading, isError } = useGetComplianceDocumentTypesQuery({
    status: 'all',
  });
  const [updateType] = useUpdateComplianceDocumentTypeMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [editing, setEditing] = useState<ComplianceDocumentType | null>(null);
  const [deleting, setDeleting] = useState<ComplianceDocumentType | null>(null);

  const openModal = (type: ComplianceDocumentType | null) => {
    setEditing(type);
    setModalOpen(true);
  };

  // Archive keeps the row and every document filed against it, so it stays
  // un-confirmed and reversible from the Restore button right beside it. It is a
  // PUT: DELETE is now a real delete, not an archive.
  const handleArchive = async (type: ComplianceDocumentType) => {
    try {
      await updateType({ id: type.id, status: 'ARCHIVED' }).unwrap();
      onToast(L.TYPES.ARCHIVED, 'success');
    } catch (error: unknown) {
      logError(error, 'ComplianceSettings.archiveDocumentType');
      onToast(extractErrorMessage(error, L.TYPES.ARCHIVE_ERROR), 'error');
    }
  };

  const handleRestore = async (type: ComplianceDocumentType) => {
    try {
      await updateType({ id: type.id, status: 'ACTIVE' }).unwrap();
      onToast(L.TYPES.RESTORED, 'success');
    } catch (error: unknown) {
      logError(error, 'ComplianceSettings.restoreDocumentType');
      onToast(extractErrorMessage(error, L.TYPES.ARCHIVE_ERROR), 'error');
    }
  };

  return (
    <Box sx={{ ...COMPLIANCE_CARD_SX, p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: '240px' }}>
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1A212B', fontFamily: C.FONT }}>
            {L.TYPES.TITLE}
          </Typography>
          <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: C.FONT }}>
            {L.TYPES.SUBTITLE}
          </Typography>
        </Box>
        {canEdit && (
          <StandardButton variant="primary" size="small" onClick={() => setLibraryOpen(true)}>
            {L.TYPES.ADD}
          </StandardButton>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={22} />
        </Box>
      )}
      {isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {L.TYPES.LOAD_ERROR}
        </Alert>
      )}
      {/* A pharmacy's catalogue now starts EMPTY. That is a setup step, not an
          error, so it says what to do next and offers the library right here. */}
      {!isLoading && !isError && types.length === 0 && (
        <Alert
          severity="info"
          sx={{ mt: 2, fontFamily: C.FONT }}
          action={
            canEdit ? (
              <StandardButton variant="outline" size="small" onClick={() => setLibraryOpen(true)}>
                {L.TYPES.ADD}
              </StandardButton>
            ) : undefined
          }
        >
          {L.TYPES.EMPTY}
        </Alert>
      )}

      {types.map((type) => {
        const isArchived = type.status === 'ARCHIVED';
        return (
          <Box
            key={type.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'wrap',
              py: 1.5,
              borderTop: '1px solid #F3F4F6',
              opacity: isArchived ? 0.7 : 1,
            }}
          >
            <Box sx={{ flex: 1, minWidth: '200px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography
                  sx={{ fontSize: '14px', fontWeight: 600, color: '#1A212B', fontFamily: C.FONT }}
                >
                  {type.name}
                </Typography>
                {type.category && (
                  <Chip
                    label={type.category}
                    size="small"
                    sx={{ ...COMPLIANCE_CHIP_BASE_SX, backgroundColor: '#F3F4F6', color: '#4B5563' }}
                  />
                )}
                <Chip
                  label={type.is_required ? L.BADGE.REQUIRED : L.BADGE.OPTIONAL}
                  size="small"
                  sx={{
                    ...COMPLIANCE_CHIP_BASE_SX,
                    backgroundColor: type.is_required ? '#FEE2E2' : '#F3F4F6',
                    color: type.is_required ? '#B91C1C' : '#4B5563',
                  }}
                />
                {isArchived && (
                  <Chip
                    label={L.BADGE.ARCHIVED}
                    size="small"
                    sx={{ ...COMPLIANCE_CHIP_BASE_SX, backgroundColor: '#F3F4F6', color: '#4B5563' }}
                  />
                )}
              </Box>
              <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: C.FONT }}>
                {[
                  type.key,
                  type.default_validity_months
                    ? L.HINTS.RENEWAL_MONTHS(type.default_validity_months)
                    : null,
                  type.description,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            </Box>
            {canEdit && (
              <>
                <StandardButton variant="text" size="small" onClick={() => openModal(type)}>
                  {L.ACTIONS.EDIT_DETAILS}
                </StandardButton>
                {isArchived ? (
                  <StandardButton variant="outline" size="small" onClick={() => handleRestore(type)}>
                    {L.TYPES.RESTORE}
                  </StandardButton>
                ) : (
                  <Tooltip title={L.TYPES.ARCHIVE_CONFIRM}>
                    <span>
                      <StandardButton
                        variant="secondary"
                        size="small"
                        onClick={() => handleArchive(type)}
                      >
                        {L.TYPES.ARCHIVE}
                      </StandardButton>
                    </span>
                  </Tooltip>
                )}
                {/* Permanent, and only possible while nothing is filed against the
                    type — both facts are stated in the confirm dialog. */}
                <StandardButton variant="text" size="small" onClick={() => setDeleting(type)}>
                  {L.DELETE.ACTION}
                </StandardButton>
              </>
            )}
          </Box>
        );
      })}

      <DocumentTypeLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onCustom={() => {
          setLibraryOpen(false);
          openModal(null);
        }}
        onToast={onToast}
      />

      <DocumentTypeModal
        open={modalOpen}
        type={editing}
        onClose={() => setModalOpen(false)}
        onToast={onToast}
      />

      <DeleteDocumentTypeDialog
        open={deleting !== null}
        type={deleting}
        onClose={() => setDeleting(null)}
        onToast={onToast}
      />
    </Box>
  );
};

export default DocumentTypesSection;
