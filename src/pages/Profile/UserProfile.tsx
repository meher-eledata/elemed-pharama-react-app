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
  type Profile,
  type UpdateProfileRequest,
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

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
    <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>{label}</Typography>
    <Typography sx={{ fontSize: '15px', color: '#1A212B', fontWeight: 500 }}>{value}</Typography>
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

// Editable contact whitelist (matches PUT /api/profile). Keys map 1:1 to UpdateProfileRequest.
const EDIT_FIELDS: Array<{ key: keyof UpdateProfileRequest; label: string }> = [
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

const toFormState = (profile: Profile): Required<UpdateProfileRequest> => ({
  first_name: profile.first_name ?? '',
  last_name: profile.last_name ?? '',
  mobile: profile.mobile ?? '',
  address_line1: profile.address_line1 ?? '',
  address_line2: profile.address_line2 ?? '',
  city: profile.city ?? '',
  state: profile.state ?? '',
  postal_code: profile.postal_code ?? '',
  country: profile.country ?? '',
});

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

  const [isEditing, setIsEditing] = React.useState(false);
  const [form, setForm] = React.useState<Required<UpdateProfileRequest>>({
    first_name: '',
    last_name: '',
    mobile: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });
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

  const handleFieldChange = (key: keyof UpdateProfileRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    try {
      await updateProfile(form).unwrap();
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
              <Field label={L.SECTIONS.ACCOUNT.EMAIL} value={dash(profile.email)} />
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
          </Box>
        </>
      )}

      {/* e) Recent activity */}
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
