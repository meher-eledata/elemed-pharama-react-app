import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Button,
  TextField,
  MenuItem,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import dayjs from 'dayjs';
import {
  useGetProfileQuery,
  useGetProfileActivityQuery,
  useUpdateProfileMutation,
  useUploadProfileDocumentsMutation,
  useLazyGetProfileDocumentDownloadLinkQuery,
  useLazyGetProfileDocumentBlobQuery,
  type Profile,
  type UpdateProfileRequest,
  type ProfileDocumentType,
} from '../../redux/slices/profileApi';
import { extractErrorMessage, logError } from '../../utils/errorUtils';
import { USER_PROFILE_LABELS } from '../../config/label/UserProfile.labels';
import { getInitials } from '../../config/helpers/initials';

const PRIMARY = '#5C17E5';
const L = USER_PROFILE_LABELS;

const sectionSx = {
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  backgroundColor: '#F9FAFB',
  p: 3,
};

const sectionTitleSx = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#1A212B',
  mb: 2,
};

// Match the app's "other modules" date format (DD/MM/YYYY); fall back to a dash.
const formatDate = (value: string | null | undefined): string =>
  value ? dayjs(value).format('DD/MM/YYYY') : L.DASH;

const formatDateTime = (value: string | null | undefined): string =>
  value ? dayjs(value).format('DD/MM/YYYY HH:mm') : L.DASH;

const dash = (value: string | null | undefined): string =>
  value && value.trim() !== '' ? value : L.DASH;

const Field: React.FC<{ label: string; value: string; hint?: string }> = ({
  label,
  value,
  hint,
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
    <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>{label}</Typography>
    <Typography sx={{ fontSize: '15px', color: '#1A212B', fontWeight: 500 }}>{value}</Typography>
    {hint && (
      <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>{hint}</Typography>
    )}
  </Box>
);

const fieldGridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
  gap: 2.5,
};

const Header: React.FC<{ profile: Profile }> = ({ profile }) => {
  const fullName = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();
  const displayName = fullName || profile.username;
  return (
    <Box sx={{ ...sectionSx, display: 'flex', alignItems: 'center', gap: 3 }}>
      <Avatar
        sx={{
          backgroundColor: PRIMARY,
          color: 'white',
          fontWeight: 'bold',
          fontSize: '24px',
          width: 72,
          height: 72,
        }}
      >
        {getInitials(displayName)}
      </Avatar>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography sx={{ fontSize: '24px', fontWeight: 600, color: '#1A212B' }}>
          {displayName}
        </Typography>
        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
          {L.HEADER.USERNAME_PREFIX}
          {profile.username}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Chip
            label={profile.role}
            size="small"
            sx={{ backgroundColor: PRIMARY, color: 'white', textTransform: 'capitalize' }}
          />
          <Chip
            label={profile.status}
            size="small"
            variant="outlined"
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>
      </Box>
    </Box>
  );
};

// Editable contact whitelist (matches PUT /api/profile). Keys map 1:1 to
// UpdateProfileRequest string fields; the two identity fields render separately.
type ContactFieldKey = Exclude<
  keyof UpdateProfileRequest,
  'identity_document' | 'identity_document_number'
>;

const EDIT_FIELDS: Array<{ key: ContactFieldKey; label: string }> = [
  { key: 'first_name', label: L.EDIT.FIRST_NAME },
  { key: 'last_name', label: L.EDIT.LAST_NAME },
  { key: 'mobile', label: L.EDIT.MOBILE },
  { key: 'address_line1', label: L.SECTIONS.CONTACT.ADDRESS_LINE1 },
  { key: 'address_line2', label: L.SECTIONS.CONTACT.ADDRESS_LINE2 },
  { key: 'city', label: L.SECTIONS.CONTACT.CITY },
  { key: 'state', label: L.SECTIONS.CONTACT.STATE },
  { key: 'postal_code', label: L.SECTIONS.CONTACT.POSTAL_CODE },
  { key: 'country', label: L.SECTIONS.CONTACT.COUNTRY },
];

type EditFormState = Record<ContactFieldKey, string> & {
  identity_document: '' | 0 | 1; // '' = never set
  // Always starts blank; the masked current value ("••••1234") is shown as a
  // placeholder and NEVER round-tripped — sent only when the user types anew.
  identity_document_number: string;
};

// Same 0/1 mapping as the admin create-user form; GET returns the mapped label.
const IDENTITY_LABEL_TO_CODE: Record<string, 0 | 1> = {
  Aadhaar: 0,
  "Driver's License": 1,
};

const EMPTY_FORM: EditFormState = {
  first_name: '',
  last_name: '',
  mobile: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  identity_document: '',
  identity_document_number: '',
};

const toFormState = (profile: Profile): EditFormState => ({
  first_name: profile.first_name ?? '',
  last_name: profile.last_name ?? '',
  mobile: profile.mobile ?? '',
  address_line1: profile.address_line1 ?? '',
  address_line2: profile.address_line2 ?? '',
  city: profile.city ?? '',
  state: profile.state ?? '',
  postal_code: profile.postal_code ?? '',
  country: profile.country ?? '',
  identity_document:
    IDENTITY_LABEL_TO_CODE[profile.identity_document_type ?? ''] ?? '',
  identity_document_number: '',
});

// Client-side pre-checks mirroring POST /api/profile/documents (server stays
// authoritative): PNG/JPEG/PDF, max 50MB.
const ALLOWED_DOC_EXTENSIONS = ['png', 'jpg', 'jpeg', 'pdf'];
const DOC_ACCEPT = '.png,.jpg,.jpeg,.pdf';
const MAX_DOC_BYTES = 50 * 1024 * 1024;

const DOC_TYPES: Array<{ type: ProfileDocumentType; label: string }> = [
  { type: 'id_document', label: L.SECTIONS.DOCUMENTS.ID_DOCUMENT },
  { type: 'pharmacist_certificate', label: L.SECTIONS.DOCUMENTS.PHARMACIST_CERTIFICATE },
];

// Strip path separators / control chars so a malicious filename can't influence
// the saved download path (mirrors HistoricalData.tsx).
const sanitizeFileName = (name: string): string => {
  const base = (name || 'download').split(/[\\/]/).pop() || 'download';
  // eslint-disable-next-line no-control-regex
  return base.replace(/[\u0000-\u001f<>:"|?*]/g, '_').trim() || 'download';
};

const triggerBlobDownload = (blob: Blob, fileName: string): void => {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = sanitizeFileName(fileName);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
};

const UserProfile: React.FC = () => {
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useGetProfileQuery();
  const {
    data: activityData,
    isLoading: activityLoading,
    isError: activityError,
  } = useGetProfileActivityQuery();

  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [uploadDocuments] = useUploadProfileDocumentsMutation();
  const [triggerDocumentLink] = useLazyGetProfileDocumentDownloadLinkQuery();
  const [triggerDocumentBlob] = useLazyGetProfileDocumentBlobQuery();

  const [isEditing, setIsEditing] = React.useState(false);
  const [form, setForm] = React.useState<EditFormState>(EMPTY_FORM);
  const [uploadingDoc, setUploadingDoc] = React.useState<ProfileDocumentType | null>(null);
  const [downloadingDoc, setDownloadingDoc] = React.useState<ProfileDocumentType | null>(null);
  const docInputRef = React.useRef<HTMLInputElement>(null);
  const pendingDocRef = React.useRef<ProfileDocumentType | null>(null);
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const startEdit = () => {
    if (profile) {
      setForm(toFormState(profile));
      setIsEditing(true);
    }
  };

  const handleFieldChange = (key: ContactFieldKey | 'identity_document_number') =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleIdentityTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setForm((prev) => ({
      ...prev,
      identity_document: raw === '' ? '' : (Number(raw) as 0 | 1),
    }));
  };

  const handleSave = async () => {
    // Send ONLY the PUT whitelist: the contact fields, plus the identity fields
    // when actually set. email/username/role/status are never sent, and the
    // masked identity number is never round-tripped (only a newly typed value).
    const body: UpdateProfileRequest = {
      first_name: form.first_name,
      last_name: form.last_name,
      mobile: form.mobile,
      address_line1: form.address_line1,
      address_line2: form.address_line2,
      city: form.city,
      state: form.state,
      postal_code: form.postal_code,
      country: form.country,
    };
    if (form.identity_document !== '') {
      body.identity_document = form.identity_document;
    }
    const newIdentityNumber = form.identity_document_number.trim();
    if (newIdentityNumber) {
      body.identity_document_number = newIdentityNumber;
    }
    try {
      await updateProfile(body).unwrap();
      setIsEditing(false);
      setSnackbar({ open: true, message: L.EDIT.SUCCESS, severity: 'success' });
    } catch (error: unknown) {
      logError(error, 'UserProfile.updateProfile');
      setSnackbar({
        open: true,
        message: extractErrorMessage(error, L.EDIT.ERROR),
        severity: 'error',
      });
    }
  };

  const handlePickDocument = (docType: ProfileDocumentType) => {
    pendingDocRef.current = docType;
    docInputRef.current?.click();
  };

  const handleDocumentSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so selecting the same file again re-triggers onChange.
    e.target.value = '';
    const docType = pendingDocRef.current;
    pendingDocRef.current = null;
    if (!file || !docType) return;

    // Friendly client-side pre-checks; the server remains authoritative.
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_DOC_EXTENSIONS.includes(ext)) {
      setSnackbar({
        open: true,
        message: L.SECTIONS.DOCUMENTS.UNSUPPORTED_TYPE,
        severity: 'error',
      });
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setSnackbar({
        open: true,
        message: L.SECTIONS.DOCUMENTS.FILE_TOO_LARGE,
        severity: 'error',
      });
      return;
    }

    setUploadingDoc(docType);
    try {
      // Response carries the updated profile; invalidating 'Profile' refreshes
      // the cached profile (documents presence) and the activity list.
      await uploadDocuments({ [docType]: file }).unwrap();
      setSnackbar({
        open: true,
        message: L.SECTIONS.DOCUMENTS.UPLOAD_SUCCESS,
        severity: 'success',
      });
    } catch (error: unknown) {
      logError(error, 'UserProfile.uploadDocuments');
      setSnackbar({
        open: true,
        message: extractErrorMessage(error, L.SECTIONS.DOCUMENTS.UPLOAD_ERROR),
        severity: 'error',
      });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDocumentDownload = async (docType: ProfileDocumentType) => {
    setDownloadingDoc(docType);
    try {
      // 1. Resolve a (presigned) link first.
      const link = await triggerDocumentLink(docType).unwrap();
      if (link?.url) {
        // Presigned S3 URL — self-authenticating, safe to open directly.
        window.open(link.url, '_blank', 'noopener,noreferrer');
        return;
      }
      // 2. Disk-driver fallback (url null) → authenticated blob fetch of
      // GET profile/documents/:type (Bearer header via baseQueryWithReauth).
      const blob = await triggerDocumentBlob(docType).unwrap();
      triggerBlobDownload(blob, link?.file_name || docType);
    } catch (error: unknown) {
      logError(error, 'UserProfile.downloadDocument');
      setSnackbar({
        open: true,
        message: extractErrorMessage(error, L.SECTIONS.DOCUMENTS.DOWNLOAD_ERROR),
        severity: 'error',
      });
    } finally {
      setDownloadingDoc(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3, maxWidth: '900px' }}>
      <Typography
        sx={{ fontSize: '32px', color: '#1A212B', fontFamily: "'Lexend', sans-serif", fontWeight: 600 }}
      >
        {L.PAGE_TITLE}
      </Typography>

      {profileLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!profileLoading && profileError && <Alert severity="error">{L.ERROR.PROFILE}</Alert>}

      {!profileLoading && !profileError && profile && (
        <>
          {/* a) Header */}
          <Header profile={profile} />

          {/* b) Account */}
          <Box sx={sectionSx}>
            <Typography sx={sectionTitleSx}>{L.SECTIONS.ACCOUNT.TITLE}</Typography>
            <Box sx={fieldGridSx}>
              <Field
                label={L.SECTIONS.ACCOUNT.EMAIL}
                value={dash(profile.email)}
                hint={L.SECTIONS.ACCOUNT.EMAIL_HINT}
              />
              <Field label={L.SECTIONS.ACCOUNT.MEMBER_SINCE} value={formatDate(profile.created_at)} />
              <Field label={L.SECTIONS.ACCOUNT.LAST_LOGIN} value={formatDateTime(profile.last_login)} />
            </Box>
          </Box>

          {/* c) Contact (editable) */}
          <Box sx={sectionSx}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
              }}
            >
              <Typography sx={{ ...sectionTitleSx, mb: 0 }}>
                {L.SECTIONS.CONTACT.TITLE}
              </Typography>
              {!isEditing && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={startEdit}
                  sx={{ textTransform: 'none', borderColor: PRIMARY, color: PRIMARY }}
                >
                  {L.EDIT.BUTTON}
                </Button>
              )}
            </Box>

            {isEditing ? (
              <>
                <Box sx={fieldGridSx}>
                  {EDIT_FIELDS.map(({ key, label }) => (
                    <TextField
                      key={key}
                      label={label}
                      value={form[key]}
                      onChange={handleFieldChange(key)}
                      size="small"
                      fullWidth
                      disabled={isSaving}
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={isSaving}
                    sx={{ textTransform: 'none', backgroundColor: PRIMARY }}
                  >
                    {isSaving ? L.EDIT.SAVING : L.EDIT.SAVE}
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    sx={{ textTransform: 'none', color: '#6B7280' }}
                  >
                    {L.EDIT.CANCEL}
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={fieldGridSx}>
                <Field label={L.SECTIONS.CONTACT.MOBILE} value={dash(profile.mobile)} />
                <Field label={L.SECTIONS.CONTACT.ADDRESS_LINE1} value={dash(profile.address_line1)} />
                <Field label={L.SECTIONS.CONTACT.ADDRESS_LINE2} value={dash(profile.address_line2)} />
                <Field label={L.SECTIONS.CONTACT.CITY} value={dash(profile.city)} />
                <Field label={L.SECTIONS.CONTACT.STATE} value={dash(profile.state)} />
                <Field label={L.SECTIONS.CONTACT.POSTAL_CODE} value={dash(profile.postal_code)} />
                <Field label={L.SECTIONS.CONTACT.COUNTRY} value={dash(profile.country)} />
              </Box>
            )}
          </Box>

          {/* d) Identity document */}
          <Box sx={sectionSx}>
            <Typography sx={sectionTitleSx}>{L.SECTIONS.IDENTITY.TITLE}</Typography>
            {isEditing ? (
              <Box sx={fieldGridSx}>
                <TextField
                  select
                  label={L.SECTIONS.IDENTITY.DOCUMENT_TYPE}
                  value={String(form.identity_document)}
                  onChange={handleIdentityTypeChange}
                  size="small"
                  fullWidth
                  disabled={isSaving}
                >
                  {form.identity_document === '' && (
                    <MenuItem value="" disabled>
                      <em>{L.EDIT.IDENTITY_SELECT_PLACEHOLDER}</em>
                    </MenuItem>
                  )}
                  <MenuItem value="0">{L.EDIT.IDENTITY_OPTION_AADHAAR}</MenuItem>
                  <MenuItem value="1">{L.EDIT.IDENTITY_OPTION_DRIVING_LICENCE}</MenuItem>
                </TextField>
                <TextField
                  label={L.SECTIONS.IDENTITY.DOCUMENT_NUMBER}
                  value={form.identity_document_number}
                  onChange={handleFieldChange('identity_document_number')}
                  placeholder={profile.identity_document_number_masked ?? ''}
                  helperText={L.EDIT.IDENTITY_NUMBER_HINT}
                  size="small"
                  fullWidth
                  disabled={isSaving}
                />
              </Box>
            ) : (
              <Box sx={fieldGridSx}>
                <Field
                  label={L.SECTIONS.IDENTITY.DOCUMENT_TYPE}
                  value={dash(profile.identity_document_type)}
                />
                <Field
                  label={L.SECTIONS.IDENTITY.DOCUMENT_NUMBER}
                  value={dash(profile.identity_document_number_masked)}
                />
              </Box>
            )}
          </Box>

          {/* e) Documents */}
          <Box sx={sectionSx}>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ ...sectionTitleSx, mb: 0.5 }}>
                {L.SECTIONS.DOCUMENTS.TITLE}
              </Typography>
              <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                {L.SECTIONS.DOCUMENTS.ALLOWED_HINT}
              </Typography>
            </Box>
            {/* Hidden native file input — shared by both upload controls. */}
            <input
              ref={docInputRef}
              type="file"
              accept={DOC_ACCEPT}
              style={{ display: 'none' }}
              onChange={handleDocumentSelected}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {DOC_TYPES.map(({ type, label }) => {
                const info = profile.documents?.[type];
                const uploaded = info?.uploaded ?? false;
                return (
                  <Box
                    key={type}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      flexWrap: 'wrap',
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      p: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                        {label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '15px',
                          fontWeight: 500,
                          color: uploaded ? '#1A212B' : '#9CA3AF',
                        }}
                      >
                        {uploaded
                          ? info?.filename ?? L.DASH
                          : L.SECTIONS.DOCUMENTS.NOT_UPLOADED}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {uploaded && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleDocumentDownload(type)}
                          disabled={downloadingDoc === type}
                          startIcon={
                            downloadingDoc === type ? <CircularProgress size={14} /> : undefined
                          }
                          sx={{ textTransform: 'none', borderColor: PRIMARY, color: PRIMARY }}
                        >
                          {L.SECTIONS.DOCUMENTS.VIEW}
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handlePickDocument(type)}
                        disabled={uploadingDoc !== null}
                        startIcon={
                          uploadingDoc === type ? <CircularProgress size={14} /> : undefined
                        }
                        sx={{ textTransform: 'none', borderColor: PRIMARY, color: PRIMARY }}
                      >
                        {uploadingDoc === type
                          ? L.SECTIONS.DOCUMENTS.UPLOADING
                          : uploaded
                            ? L.SECTIONS.DOCUMENTS.REPLACE
                            : L.SECTIONS.DOCUMENTS.UPLOAD}
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </>
      )}

      {/* f) Recent activity */}
      <Box sx={sectionSx}>
        <Typography sx={sectionTitleSx}>{L.SECTIONS.RECENT_ACTIVITY.TITLE}</Typography>

        {activityLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!activityLoading && activityError && (
          <Alert severity="error">{L.ERROR.ACTIVITY}</Alert>
        )}

        {!activityLoading && !activityError && activityData && (
          activityData.activity.length === 0 ? (
            <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
              {L.SECTIONS.RECENT_ACTIVITY.EMPTY}
            </Typography>
          ) : (
            <TableContainer sx={{ backgroundColor: 'white', borderRadius: '8px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {L.SECTIONS.RECENT_ACTIVITY.COL_MODULE}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {L.SECTIONS.RECENT_ACTIVITY.COL_EVENT_TYPE}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {L.SECTIONS.RECENT_ACTIVITY.COL_EVENT_TIME}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {L.SECTIONS.RECENT_ACTIVITY.COL_EVENT_DETAILS}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activityData.activity.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{dash(row.module)}</TableCell>
                      <TableCell>{dash(row.event_type)}</TableCell>
                      <TableCell>{formatDateTime(row.event_time)}</TableCell>
                      <TableCell>{dash(row.event_details)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
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

export default UserProfile;
