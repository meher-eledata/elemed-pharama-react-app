import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { StandardButton } from '../../components/Common';
import {
  COMPLIANCE_CARD_SX,
  COMPLIANCE_CHIP_BASE_SX,
  COMPLIANCE_CONSTANTS,
  COMPLIANCE_FIELD_SX,
  COMPLIANCE_STATE_CHIP,
} from '../../config/constants/Compliance.constants';
import { COMPLIANCE_LABELS } from '../../config/label/Compliance.labels';
import {
  useGetComplianceDocumentTypesQuery,
  useGetComplianceDocumentsQuery,
  useGetComplianceNotificationSettingsQuery,
  useLazyGetComplianceVersionBlobQuery,
  useLazyGetComplianceVersionDownloadLinkQuery,
  type ComplianceDocument,
  type ComplianceDocumentType,
  type ComplianceDocumentTypeRef,
  type ComplianceStatusFilter,
  type ComplianceVersion,
} from '../../redux/slices/complianceApi';
import { RootState } from '../../redux/store';
import { extractErrorMessage, logError } from '../../utils/errorUtils';
import ComplianceNav from './components/ComplianceNav';
import CreateDocumentModal from './components/CreateDocumentModal';
import EditDocumentModal from './components/EditDocumentModal';
import UploadVersionModal from './components/UploadVersionModal';
import VersionHistory from './components/VersionHistory';
import { deriveComplianceState, formatApiDate, triggerBlobDownload } from './compliance.utils';

const L = COMPLIANCE_LABELS;
const C = COMPLIANCE_CONSTANTS;

interface TypeGroup {
  type: ComplianceDocumentType | ComplianceDocumentTypeRef;
  documents: ComplianceDocument[];
}

interface ToastState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

const ComplianceDocuments: React.FC = () => {
  const location = useLocation();
  // Deep link from a compliance bell notification (see getNotificationRoute): a
  // document id expands that document's history; a bare TYPE id means nothing has
  // been filed for it at all, so the create flow opens pre-selected on that type.
  const deepLink = location.state as {
    complianceDocumentId?: number;
    complianceDocumentTypeId?: number;
    complianceUploadDocumentId?: number;
  } | null;
  const focusedDocumentId = deepLink?.complianceDocumentId;
  const focusedTypeId = deepLink?.complianceDocumentTypeId;
  // A calendar "nothing filed" row for an EXISTING document jumps straight to its
  // upload step (the title is only known once the list resolves).
  const uploadDocumentId = deepLink?.complianceUploadDocumentId;

  const [statusFilter, setStatusFilter] = useState<ComplianceStatusFilter>('ACTIVE');
  const [expandedDocumentId, setExpandedDocumentId] = useState<number | null>(
    focusedDocumentId ?? null,
  );
  const [editingVersionId, setEditingVersionId] = useState<number | null>(null);
  const [createTypeId, setCreateTypeId] = useState<number | null>(focusedTypeId ?? null);
  const [createOpen, setCreateOpen] = useState(focusedTypeId != null);
  const [uploadTarget, setUploadTarget] = useState<{ id: number; title: string } | null>(null);
  const [editTarget, setEditTarget] = useState<ComplianceDocument | null>(null);
  const [downloadingVersionId, setDownloadingVersionId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState>({ open: false, message: '', severity: 'success' });

  const {
    data: types = [],
    isLoading: typesLoading,
    isError: typesError,
  } = useGetComplianceDocumentTypesQuery({ status: statusFilter });
  const {
    data: documents = [],
    isLoading: documentsLoading,
    isError: documentsError,
  } = useGetComplianceDocumentsQuery({ status: statusFilter });
  // Read-only for every member; used only to colour the "expiring" window the same
  // way the reminders do.
  const { data: settings } = useGetComplianceNotificationSettingsQuery();

  const [triggerDownloadLink] = useLazyGetComplianceVersionDownloadLinkQuery();
  const [triggerVersionBlob] = useLazyGetComplianceVersionBlobQuery();

  // The make-current route is requireRole('owner','admin') — the JWT `org_role`
  // is the source, not the legacy numeric role.
  const orgRole = useSelector((state: RootState) => state.auth.user?.org_role);
  const canMakeCurrent = orgRole === 'owner' || orgRole === 'admin';

  const showToast = useCallback((message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  }, []);

  const leadDaysForType = useCallback(
    (typeId: number): number[] => {
      const override = settings?.overrides.find((o) => o.document_type_id === typeId);
      return override?.lead_days ?? settings?.lead_days ?? [...C.DEFAULT_LEAD_DAYS];
    },
    [settings],
  );

  // Group by type, keeping the server's type ordering (category ASC, name ASC) and
  // surfacing types with NOTHING filed as their own actionable card.
  const groups: TypeGroup[] = useMemo(() => {
    const byType = new Map<number, ComplianceDocument[]>();
    documents.forEach((document) => {
      const list = byType.get(document.document_type.id);
      if (list) list.push(document);
      else byType.set(document.document_type.id, [document]);
    });

    const ordered: TypeGroup[] = types.map((type) => ({
      type,
      documents: byType.get(type.id) ?? [],
    }));
    // A document whose type is not in the filtered type list (e.g. an archived type
    // while viewing active types) must still be reachable — append it by its
    // embedded type subset rather than dropping it.
    const seen = new Set(types.map((type) => type.id));
    documents.forEach((document) => {
      if (seen.has(document.document_type.id)) return;
      seen.add(document.document_type.id);
      ordered.push({
        type: document.document_type,
        documents: byType.get(document.document_type.id) ?? [],
      });
    });
    return ordered;
  }, [types, documents]);

  const activeTypes = useMemo(() => types.filter((type) => type.status === 'ACTIVE'), [types]);

  const handledUploadDeepLink = useRef(false);
  useEffect(() => {
    if (!uploadDocumentId || handledUploadDeepLink.current) return;
    const target = documents.find((document) => document.id === uploadDocumentId);
    if (!target) return;
    handledUploadDeepLink.current = true;
    setUploadTarget({ id: target.id, title: target.title });
  }, [uploadDocumentId, documents]);

  const handleDownload = async (documentId: number, version: ComplianceVersion) => {
    setDownloadingVersionId(version.id);
    try {
      // 1. Resolve the link (this also writes the 'Download Version' activity row,
      // so it is never called speculatively).
      const link = await triggerDownloadLink({ documentId, versionId: version.id }).unwrap();
      if (link?.url) {
        window.open(link.url, '_blank', 'noopener,noreferrer');
        return;
      }
      // 2. Disk-driver fallback (url null): authenticated blob fetch of .../file.
      const blob = await triggerVersionBlob({ documentId, versionId: version.id }).unwrap();
      triggerBlobDownload(blob, link?.file_name || version.file_name);
    } catch (error: unknown) {
      logError(error, 'ComplianceDocuments.download');
      showToast(extractErrorMessage(error, L.TOAST.DOWNLOAD_ERROR), 'error');
    } finally {
      setDownloadingVersionId(null);
    }
  };

  const openCreate = (typeId: number | null) => {
    setCreateTypeId(typeId);
    setCreateOpen(true);
  };

  const isLoading = typesLoading || documentsLoading;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3, maxWidth: '1100px' }}>
      <Box>
        <Typography
          sx={{ fontSize: '32px', color: '#1A212B', fontFamily: C.FONT, fontWeight: 600 }}
        >
          {L.PAGE_TITLE}
        </Typography>
        <Typography sx={{ fontSize: '14px', color: '#6B7280', fontFamily: C.FONT }}>
          {L.PAGE_SUBTITLE}
        </Typography>
      </Box>

      <ComplianceNav />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: '120px' }} />
        <TextField
          select
          label={L.FILTER.LABEL}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ComplianceStatusFilter)}
          size="small"
          sx={{ ...COMPLIANCE_FIELD_SX, minWidth: '190px' }}
        >
          <MenuItem value="ACTIVE" sx={{ fontFamily: C.FONT, fontSize: '14px' }}>
            {L.FILTER.ACTIVE}
          </MenuItem>
          <MenuItem value="all" sx={{ fontFamily: C.FONT, fontSize: '14px' }}>
            {L.FILTER.ALL}
          </MenuItem>
        </TextField>
        <StandardButton variant="primary" onClick={() => openCreate(null)}>
          {L.ACTIONS.ADD_DOCUMENT}
        </StandardButton>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && (typesError || documentsError) && (
        <Alert severity="error">{L.TOAST.LOAD_ERROR}</Alert>
      )}

      {!isLoading && !typesError && !documentsError && groups.length === 0 && (
        <Alert severity="info">{L.EMPTY.NO_TYPES}</Alert>
      )}

      {!isLoading &&
        !typesError &&
        !documentsError &&
        groups.map(({ type, documents: typeDocuments }) => (
          <Box key={type.id} sx={{ ...COMPLIANCE_CARD_SX, p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography
                sx={{ fontSize: '18px', fontWeight: 600, color: '#1A212B', fontFamily: C.FONT }}
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
              {type.status === 'ARCHIVED' && (
                <Chip
                  label={L.BADGE.ARCHIVED}
                  size="small"
                  sx={{ ...COMPLIANCE_CHIP_BASE_SX, backgroundColor: '#F3F4F6', color: '#4B5563' }}
                />
              )}
              <Box sx={{ flex: 1 }} />
              {type.default_validity_months && (
                <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: C.FONT }}>
                  {L.HINTS.RENEWAL_MONTHS(type.default_validity_months)}
                </Typography>
              )}
              {type.status === 'ACTIVE' && (
                <StandardButton variant="secondary" size="small" onClick={() => openCreate(type.id)}>
                  {L.ACTIONS.ADD_DOCUMENT}
                </StandardButton>
              )}
            </Box>

            {type.status === 'ARCHIVED' && (
              <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: C.FONT, mt: 1 }}>
                {L.HINTS.ARCHIVED_TYPE}
              </Typography>
            )}

            {/* A type with nothing filed is an ACTION, never a hidden gap. */}
            {typeDocuments.length === 0 && (
              <Alert
                severity={type.is_required ? 'warning' : 'info'}
                sx={{ mt: 2, fontFamily: C.FONT }}
                action={
                  type.status === 'ACTIVE' ? (
                    <StandardButton
                      variant="outline"
                      size="small"
                      onClick={() => openCreate(type.id)}
                    >
                      {L.ACTIONS.ADD_DOCUMENT}
                    </StandardButton>
                  ) : undefined
                }
              >
                {L.HINTS.NOTHING_FILED_TYPE}
              </Alert>
            )}

            {typeDocuments.map((document) => {
              // `current_version` is the server's explicit pointer — never max(version_no).
              const current = document.current_version;
              const derived = deriveComplianceState(current, leadDaysForType(type.id));
              const chip = COMPLIANCE_STATE_CHIP[derived.state];
              const isExpanded = expandedDocumentId === document.id;
              const historyCount = Math.max(document.version_count - 1, 0);
              return (
                <Box
                  key={document.id}
                  sx={{ mt: 2, pt: 2, borderTop: '1px solid #F3F4F6' }}
                  data-testid={`compliance-document-${document.id}`}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography
                      sx={{ fontSize: '15px', fontWeight: 600, color: '#1A212B', fontFamily: C.FONT }}
                    >
                      {document.title}
                    </Typography>
                    {document.reference_number && (
                      <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: C.FONT }}>
                        {document.reference_number}
                      </Typography>
                    )}
                    {document.status === 'ARCHIVED' && (
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
                    <Chip
                      label={derived.label}
                      size="small"
                      sx={{
                        ...COMPLIANCE_CHIP_BASE_SX,
                        backgroundColor: chip.background,
                        color: chip.color,
                      }}
                    />
                  </Box>

                  {current ? (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                        mt: 0.75,
                      }}
                    >
                      <Chip
                        label={L.BADGE.CURRENT}
                        size="small"
                        sx={{
                          ...COMPLIANCE_CHIP_BASE_SX,
                          backgroundColor: '#EDE9FE',
                          color: '#6D28D9',
                        }}
                      />
                      <Typography sx={{ fontSize: '13px', color: '#374151', fontFamily: C.FONT }}>
                        {`${L.HINTS.VERSION_NO(current.version_no)} · ${current.file_name}`}
                      </Typography>
                      <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: C.FONT }}>
                        {`${L.FIELDS.VALID_FROM} ${formatApiDate(current.valid_from)} · ${
                          L.FIELDS.VALID_TO
                        } ${current.valid_to ? formatApiDate(current.valid_to) : L.STATE.NO_EXPIRY}`}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography
                      sx={{ fontSize: '13px', color: '#B45309', fontFamily: C.FONT, mt: 0.75 }}
                    >
                      {L.HINTS.NOTHING_FILED}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    <StandardButton
                      variant="secondary"
                      size="small"
                      startIcon={<UploadFileOutlinedIcon sx={{ fontSize: 18 }} />}
                      onClick={() => setUploadTarget({ id: document.id, title: document.title })}
                    >
                      {current ? L.ACTIONS.UPLOAD_VERSION : L.ACTIONS.FILE_FIRST_VERSION}
                    </StandardButton>
                    {current && (
                      <StandardButton
                        variant="text"
                        size="small"
                        startIcon={<DownloadOutlinedIcon sx={{ fontSize: 18 }} />}
                        disabled={downloadingVersionId === current.id}
                        onClick={() => handleDownload(document.id, current)}
                      >
                        {L.ACTIONS.DOWNLOAD}
                      </StandardButton>
                    )}
                    {current && (
                      <StandardButton
                        variant="text"
                        size="small"
                        onClick={() => {
                          setExpandedDocumentId(document.id);
                          setEditingVersionId(current.id);
                        }}
                      >
                        {L.ACTIONS.EDIT_DETAILS}
                      </StandardButton>
                    )}
                    <StandardButton
                      variant="text"
                      size="small"
                      onClick={() => setEditTarget(document)}
                    >
                      {L.DOCUMENT_EDIT.ACTION}
                    </StandardButton>
                    {document.version_count > 0 && (
                      <StandardButton
                        variant="text"
                        size="small"
                        endIcon={
                          <ExpandMoreIcon
                            sx={{
                              fontSize: 18,
                              transform: isExpanded ? 'rotate(180deg)' : 'none',
                              transition: 'transform 200ms',
                            }}
                          />
                        }
                        onClick={() => {
                          setExpandedDocumentId(isExpanded ? null : document.id);
                          setEditingVersionId(null);
                        }}
                      >
                        {isExpanded
                          ? L.ACTIONS.HIDE_HISTORY
                          : historyCount > 0
                            ? L.ACTIONS.SHOW_HISTORY(historyCount)
                            : L.HINTS.VERSION_COUNT(document.version_count)}
                      </StandardButton>
                    )}
                  </Box>

                  <Collapse in={isExpanded} timeout={200} unmountOnExit>
                    <VersionHistory
                      documentId={document.id}
                      canMakeCurrent={canMakeCurrent}
                      editingVersionId={editingVersionId}
                      onEditingVersionChange={setEditingVersionId}
                      onDownload={(version) => handleDownload(document.id, version)}
                      onToast={showToast}
                    />
                  </Collapse>
                </Box>
              );
            })}
          </Box>
        ))}

      <CreateDocumentModal
        open={createOpen}
        types={activeTypes}
        initialTypeId={createTypeId}
        onClose={() => setCreateOpen(false)}
        onToast={showToast}
        // Two-step create: hand the empty document straight to the upload step so it
        // is only briefly in the "nothing filed" state.
        onCreated={(id, title) => setUploadTarget({ id, title })}
      />

      <EditDocumentModal
        open={editTarget !== null}
        document={editTarget}
        onClose={() => setEditTarget(null)}
        onToast={showToast}
      />

      <UploadVersionModal
        open={uploadTarget !== null}
        documentId={uploadTarget?.id ?? null}
        documentTitle={uploadTarget?.title ?? ''}
        onClose={() => setUploadTarget(null)}
        onToast={showToast}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ComplianceDocuments;
