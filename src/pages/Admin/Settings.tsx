import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Switch,
  MenuItem,
  FormControlLabel,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import { useDispatch } from 'react-redux';
import { SETTINGS_LABELS } from '../../config/label/Settings.labels';
import { SETTINGS_CONSTANTS } from '../../config/constants/Settings.constants';
import { StandardButton } from '../../components/Common';
import {
  useGetDailyReportRecipientsQuery,
  useAddDailyReportRecipientMutation,
  useRemoveDailyReportRecipientMutation,
  useSendDailyReportNowMutation,
} from '../../redux/slices/adminSlice';
import {
  useGetMeQuery,
  useToggleModuleMutation,
  useGetOrgQuery,
  useUpdateOrgMutation,
  useUpdateOrgLogoMutation,
  useDeleteOrgLogoMutation,
} from '../../redux/slices/orgApi';
import { setOrgContext } from '../../redux/slices/orgSlice';
import { MODULES, ALL_MODULE_KEYS } from '../../config/modules.config';
import ConfirmationDialog from '../../components/DeleteDialogue/ConfirmationDialog';
import { extractErrorMessage, logError } from '../../utils/errorUtils';
import {
  renderInvoiceNumberPreview,
  validateInvoiceTemplate,
} from '../../utils/invoiceNumberPreview';
import elemedLogo from '../../assets/ElemedLogo.svg';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAILY = SETTINGS_LABELS.SECTIONS.DAILY_REPORTS;
const MODULES_LABELS = SETTINGS_LABELS.SECTIONS.MODULES;
const PROFILE = SETTINGS_LABELS.SECTIONS.PHARMACY_PROFILE;
const INVOICE = SETTINGS_LABELS.SECTIONS.INVOICE_NUMBERING;

// Editable invoice-numbering scheme fields (seq_start kept as text for the input).
interface SchemeForm {
  invoice_number_enabled: boolean;
  invoice_number_template: string;
  invoice_seq_start: string;
  invoice_number_reset: 'none' | 'yearly';
}

const EMPTY_SCHEME: SchemeForm = {
  invoice_number_enabled: false,
  invoice_number_template: '',
  invoice_seq_start: '',
  invoice_number_reset: 'none',
};

// Editable org profile fields (branding fields are nullable server-side).
interface ProfileForm {
  name: string;
  legal_name: string;
  address: string;
  dl_numbers: string;
  gstin: string;
  phone: string;
}

const EMPTY_PROFILE: ProfileForm = {
  name: '',
  legal_name: '',
  address: '',
  dl_numbers: '',
  gstin: '',
  phone: '',
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
// pharmacy is the core app — its switch is always-on and disabled so an admin can
// never zero-out the base product. Only optional modules (e.g. inpatient) toggle.
const CORE_MODULE_KEY = 'pharmacy';

const Settings: React.FC = () => {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState<string | false>(false);
  const [pendingModuleKey, setPendingModuleKey] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState<string>('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const showToast = (message: string, severity: 'success' | 'error' | 'info' = 'success') =>
    setSnackbar({ open: true, message, severity });

  const {
    data: recipientsData,
    isLoading: isLoadingRecipients,
    isError: isRecipientsError,
  } = useGetDailyReportRecipientsQuery();
  const [addRecipient, { isLoading: isAdding }] = useAddDailyReportRecipientMutation();
  const [removeRecipient] = useRemoveDailyReportRecipientMutation();
  const [sendNow, { isLoading: isSending }] = useSendDailyReportNowMutation();

  const {
    data: meData,
    isLoading: isLoadingModules,
    isError: isModulesError,
  } = useGetMeQuery();
  const [toggleModule] = useToggleModuleMutation();

  // Skip until /me resolves — legacy/no-org admins would otherwise fire a
  // guaranteed-failing GET /api/org during the bootstrap window.
  const {
    data: orgData,
    isLoading: isLoadingOrg,
    isError: isOrgError,
  } = useGetOrgQuery(undefined, { skip: !meData?.organization });
  const [updateOrg, { isLoading: isSavingProfile }] = useUpdateOrgMutation();
  const [updateOrgLogo, { isLoading: isSavingLogo }] = useUpdateOrgLogoMutation();
  const [deleteOrgLogo, { isLoading: isRemovingLogo }] = useDeleteOrgLogoMutation();

  const [profileForm, setProfileForm] = useState<ProfileForm>(EMPTY_PROFILE);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Data URL of a logo the user picked but has not saved yet.
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);
  const [logoConfirmOpen, setLogoConfirmOpen] = useState(false);

  const organization = orgData?.organization;

  // Seed the form whenever the org profile (re)loads.
  useEffect(() => {
    if (organization) {
      setProfileForm({
        name: organization.name ?? '',
        legal_name: organization.legal_name ?? '',
        address: organization.address ?? '',
        dl_numbers: organization.dl_numbers ?? '',
        gstin: organization.gstin ?? '',
        phone: organization.phone ?? '',
      });
    }
  }, [organization]);

  const [schemeForm, setSchemeForm] = useState<SchemeForm>(EMPTY_SCHEME);

  // Seed the scheme form whenever the org profile (re)loads.
  useEffect(() => {
    if (organization) {
      setSchemeForm({
        invoice_number_enabled: !!organization.invoice_number_enabled,
        invoice_number_template: organization.invoice_number_template ?? '',
        invoice_seq_start:
          organization.invoice_seq_start === null || organization.invoice_seq_start === undefined
            ? ''
            : String(organization.invoice_seq_start),
        invoice_number_reset: organization.invoice_number_reset ?? 'none',
      });
    }
  }, [organization]);

  // The page is admin-gated; org_role additionally restricts edits to owner/admin.
  const orgRole = meData?.user?.org_role;
  const canEditProfile = orgRole === 'owner' || orgRole === 'admin';

  // Live preview: sequence = the configured starting number (0 when blank), today's date.
  const schemeStartNum = schemeForm.invoice_seq_start.trim() === ''
    ? 0
    : Number(schemeForm.invoice_seq_start);
  const schemePreview =
    schemeForm.invoice_number_template.trim() &&
    validateInvoiceTemplate(schemeForm.invoice_number_template).valid
      ? renderInvoiceNumberPreview(
          schemeForm.invoice_number_template,
          Number.isFinite(schemeStartNum) ? schemeStartNum : 0,
          new Date(),
        )
      : null;

  const handleSaveScheme = async () => {
    const template = schemeForm.invoice_number_template.trim();
    const startRaw = schemeForm.invoice_seq_start.trim();
    const startNum = startRaw === '' ? null : Number(startRaw);

    // Instant client-side feedback (server still validates and its 400s are surfaced).
    if (startRaw !== '' && (!Number.isInteger(startNum) || (startNum as number) < 0)) {
      showToast(INVOICE.START_INVALID, 'error');
      return;
    }
    if (schemeForm.invoice_number_enabled && !template) {
      showToast(INVOICE.TEMPLATE_REQUIRED, 'error');
      return;
    }
    if (template) {
      const check = validateInvoiceTemplate(template);
      if (!check.valid) {
        showToast(check.error ?? INVOICE.SAVE_ERROR, 'error');
        return;
      }
    }

    try {
      await updateOrg({
        invoice_number_enabled: schemeForm.invoice_number_enabled,
        invoice_number_template: template || null,
        invoice_number_reset: schemeForm.invoice_number_reset,
        invoice_seq_start: startNum,
      }).unwrap();
      showToast(INVOICE.SAVE_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'Settings.updateOrgScheme');
      showToast(extractErrorMessage(err, INVOICE.SAVE_ERROR), 'error');
    }
  };

  const recipients = recipientsData?.recipients ?? [];
  const activeModules = meData?.activeModules ?? [];

  const handleToggleModule = async (moduleKey: string, label: string, enabled: boolean) => {
    setPendingModuleKey(moduleKey);
    try {
      const result = await toggleModule({ module_key: moduleKey, enabled }).unwrap();
      // toggleModule invalidates the 'Me' tag, so OrgBootstrap's getMe refetch will
      // re-seed orgSlice and update the sidebar. Dispatch here too so the change is
      // immediate (no wait for the refetch round-trip).
      dispatch(
        setOrgContext({
          organization: meData?.organization ?? null,
          activeModules: result.activeModules,
        }),
      );
      showToast(
        enabled ? MODULES_LABELS.ENABLED_SUCCESS(label) : MODULES_LABELS.DISABLED_SUCCESS(label),
        'success',
      );
    } catch (err) {
      showToast(extractErrorMessage(err, MODULES_LABELS.TOGGLE_ERROR), 'error');
    } finally {
      setPendingModuleKey(null);
    }
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleProfileField = (key: keyof ProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setProfileForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSaveProfile = async () => {
    const name = profileForm.name.trim();
    if (!name) {
      showToast(PROFILE.NAME_REQUIRED, 'error');
      return;
    }
    try {
      await updateOrg({
        name,
        legal_name: profileForm.legal_name.trim() || null,
        address: profileForm.address.trim() || null,
        dl_numbers: profileForm.dl_numbers.trim() || null,
        gstin: profileForm.gstin.trim() || null,
        phone: profileForm.phone.trim() || null,
      }).unwrap();
      showToast(PROFILE.SAVE_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'Settings.updateOrg');
      showToast(extractErrorMessage(err, PROFILE.SAVE_ERROR), 'error');
    }
  };

  const handleChooseLogo = () => fileInputRef.current?.click();

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again re-triggers change.
    e.target.value = '';
    if (!file) return;

    if (!(SETTINGS_CONSTANTS.LOGO.ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
      showToast(PROFILE.LOGO.INVALID_TYPE, 'error');
      return;
    }
    if (file.size > SETTINGS_CONSTANTS.LOGO.MAX_BYTES) {
      showToast(PROFILE.LOGO.OVERSIZE, 'error');
      return;
    }
    try {
      setPendingLogo(await readFileAsDataUrl(file));
    } catch (err) {
      logError(err, 'Settings.readLogoFile');
      showToast(PROFILE.LOGO.READ_ERROR, 'error');
    }
  };

  const handleSaveLogo = async () => {
    if (!pendingLogo) return;
    try {
      await updateOrgLogo({ image: pendingLogo }).unwrap();
      setPendingLogo(null);
      showToast(PROFILE.LOGO.UPLOAD_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'Settings.updateOrgLogo');
      showToast(extractErrorMessage(err, PROFILE.LOGO.UPLOAD_ERROR), 'error');
    }
  };

  const handleRemoveLogo = async () => {
    setLogoConfirmOpen(false);
    try {
      await deleteOrgLogo().unwrap();
      setPendingLogo(null);
      showToast(PROFILE.LOGO.REMOVE_SUCCESS, 'success');
    } catch (err) {
      logError(err, 'Settings.deleteOrgLogo');
      showToast(extractErrorMessage(err, PROFILE.LOGO.REMOVE_ERROR), 'error');
    }
  };

  const handleAddEmail = async () => {
    const email = newEmail.trim();
    if (!EMAIL_REGEX.test(email)) {
      showToast(DAILY.INVALID_EMAIL, 'error');
      return;
    }
    try {
      await addRecipient({ email }).unwrap();
      setNewEmail('');
      showToast(DAILY.ADD_SUCCESS, 'success');
    } catch (err) {
      showToast(extractErrorMessage(err, DAILY.ADD_ERROR), 'error');
    }
  };

  const handleDeleteEmail = async (id: string) => {
    setPendingDeleteId(id);
    try {
      await removeRecipient(id).unwrap();
      showToast(DAILY.REMOVE_SUCCESS, 'success');
    } catch (err) {
      showToast(extractErrorMessage(err, DAILY.REMOVE_ERROR), 'error');
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleSendNow = async () => {
    try {
      const result = await sendNow().unwrap();
      showToast(
        result.failed > 0
          ? DAILY.SEND_SUCCESS_WITH_FAILED(result.sent, result.failed)
          : DAILY.SEND_SUCCESS(result.sent),
        result.failed > 0 ? 'info' : 'success',
      );
    } catch (err) {
      showToast(extractErrorMessage(err, DAILY.SEND_ERROR), 'error');
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 3, 
      padding: '24px',
    }}>
      <Typography 
        variant={SETTINGS_CONSTANTS.TYPOGRAPHY.TITLE_VARIANT} 
        fontWeight={SETTINGS_CONSTANTS.TYPOGRAPHY.TITLE_FONT_WEIGHT}
        sx={{
          fontSize: '32px',
          color: '#1A212B',
          fontFamily: "'Lexend', sans-serif",
          mb: 1,
        }}
      >
        {SETTINGS_LABELS.PAGE_TITLE}
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 3, 
        maxWidth: '900px',
        margin: 0,
        width: '100%',
      }}>
      {/* General Settings */}
      <Accordion
        expanded={expanded === 'general'}
        onChange={handleAccordionChange('general')}
        sx={{
          borderRadius: SETTINGS_CONSTANTS.ACCORDION.RADIUS,
          boxShadow: SETTINGS_CONSTANTS.ACCORDION.SHADOW,
          backgroundColor: SETTINGS_CONSTANTS.ACCORDION.BG,
          '&:before': { display: 'none' },
          '&.Mui-expanded': {
            margin: 0,
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: '#1A212B' }} />}
          sx={{
            padding: SETTINGS_CONSTANTS.ACCORDION.PADDING,
            '&.Mui-expanded': {
              minHeight: '48px',
            },
            '& .MuiAccordionSummary-content': {
              margin: 0,
              '&.Mui-expanded': {
                margin: 0,
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '18px',
                color: '#1A212B',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {SETTINGS_LABELS.SECTIONS.GENERAL.TITLE}
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {SETTINGS_LABELS.SECTIONS.GENERAL.DESC}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: `0 ${SETTINGS_CONSTANTS.ACCORDION.PADDING} ${SETTINGS_CONSTANTS.ACCORDION.PADDING}` }}>
          <Typography sx={{ color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
            General settings content will be added here.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* User Privilege Mapping */}
      <Accordion
        expanded={expanded === 'user-privilege'}
        onChange={handleAccordionChange('user-privilege')}
        sx={{
          borderRadius: SETTINGS_CONSTANTS.ACCORDION.RADIUS,
          boxShadow: SETTINGS_CONSTANTS.ACCORDION.SHADOW,
          backgroundColor: SETTINGS_CONSTANTS.ACCORDION.BG,
          '&:before': { display: 'none' },
          '&.Mui-expanded': {
            margin: 0,
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: '#1A212B' }} />}
          sx={{
            padding: SETTINGS_CONSTANTS.ACCORDION.PADDING,
            '&.Mui-expanded': {
              minHeight: '48px',
            },
            '& .MuiAccordionSummary-content': {
              margin: 0,
              '&.Mui-expanded': {
                margin: 0,
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '18px',
                color: '#1A212B',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {SETTINGS_LABELS.SECTIONS.USER_PRIVILEGE.TITLE}
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {SETTINGS_LABELS.SECTIONS.USER_PRIVILEGE.DESC}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: `0 ${SETTINGS_CONSTANTS.ACCORDION.PADDING} ${SETTINGS_CONSTANTS.ACCORDION.PADDING}` }}>
          <Typography sx={{ color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
            User privilege mapping content will be added here.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Data & Privacy */}
      <Accordion
        expanded={expanded === 'data-privacy'}
        onChange={handleAccordionChange('data-privacy')}
        sx={{
          borderRadius: SETTINGS_CONSTANTS.ACCORDION.RADIUS,
          boxShadow: SETTINGS_CONSTANTS.ACCORDION.SHADOW,
          backgroundColor: SETTINGS_CONSTANTS.ACCORDION.BG,
          '&:before': { display: 'none' },
          '&.Mui-expanded': {
            margin: 0,
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: '#1A212B' }} />}
          sx={{
            padding: SETTINGS_CONSTANTS.ACCORDION.PADDING,
            '&.Mui-expanded': {
              minHeight: '48px',
            },
            '& .MuiAccordionSummary-content': {
              margin: 0,
              '&.Mui-expanded': {
                margin: 0,
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '18px',
                color: '#1A212B',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {SETTINGS_LABELS.SECTIONS.DATA_PRIVACY.TITLE}
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {SETTINGS_LABELS.SECTIONS.DATA_PRIVACY.DESC}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: `0 ${SETTINGS_CONSTANTS.ACCORDION.PADDING} ${SETTINGS_CONSTANTS.ACCORDION.PADDING}` }}>
          <Typography sx={{ color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
            Data & Privacy settings content will be added here.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Modules */}
      <Accordion
        expanded={expanded === 'modules'}
        onChange={handleAccordionChange('modules')}
        sx={{
          borderRadius: SETTINGS_CONSTANTS.ACCORDION.RADIUS,
          boxShadow: SETTINGS_CONSTANTS.ACCORDION.SHADOW,
          backgroundColor: SETTINGS_CONSTANTS.ACCORDION.BG,
          '&:before': { display: 'none' },
          '&.Mui-expanded': {
            margin: 0,
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: '#1A212B' }} />}
          sx={{
            padding: SETTINGS_CONSTANTS.ACCORDION.PADDING,
            '&.Mui-expanded': {
              minHeight: '48px',
            },
            '& .MuiAccordionSummary-content': {
              margin: 0,
              '&.Mui-expanded': {
                margin: 0,
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '18px',
                color: '#1A212B',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {MODULES_LABELS.TITLE}
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {MODULES_LABELS.DESC}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: `0 ${SETTINGS_CONSTANTS.ACCORDION.PADDING} ${SETTINGS_CONSTANTS.ACCORDION.PADDING}` }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {isLoadingModules && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#6B7280' }}>
                <CircularProgress size={18} />
                <Typography sx={{ fontSize: '14px', fontFamily: "'Lexend', sans-serif" }}>
                  {MODULES_LABELS.LOADING}
                </Typography>
              </Box>
            )}
            {!isLoadingModules && isModulesError && (
              <Typography sx={{ fontSize: '14px', color: '#EF4444', fontFamily: "'Lexend', sans-serif" }}>
                {MODULES_LABELS.LOAD_ERROR}
              </Typography>
            )}
            {!isLoadingModules && !isModulesError && ALL_MODULE_KEYS.map((key) => {
              const mod = MODULES[key];
              const isCore = key === CORE_MODULE_KEY;
              const isEnabled = isCore || activeModules.includes(key);
              return (
                <Box
                  key={key}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    padding: '12px 16px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#1A212B',
                          fontFamily: "'Lexend', sans-serif",
                        }}
                      >
                        {mod.label}
                      </Typography>
                      {isCore && (
                        <Typography
                          sx={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#5C17E5',
                            backgroundColor: 'rgba(92, 23, 229, 0.1)',
                            borderRadius: '6px',
                            px: 1,
                            py: '2px',
                            fontFamily: "'Lexend', sans-serif",
                          }}
                        >
                          {MODULES_LABELS.CORE_TAG}
                        </Typography>
                      )}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '13px',
                        color: '#6B7280',
                        fontFamily: "'Lexend', sans-serif",
                        mt: '2px',
                      }}
                    >
                      {mod.description}
                    </Typography>
                  </Box>
                  <Switch
                    checked={isEnabled}
                    // pharmacy stays on permanently; also block while a toggle is in flight.
                    disabled={isCore || pendingModuleKey === key}
                    onChange={(e) => handleToggleModule(key, mod.label, e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#5C17E5' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#5C17E5',
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Pharmacy Profile */}
      <Accordion
        expanded={expanded === 'pharmacy-profile'}
        onChange={handleAccordionChange('pharmacy-profile')}
        sx={{
          borderRadius: SETTINGS_CONSTANTS.ACCORDION.RADIUS,
          boxShadow: SETTINGS_CONSTANTS.ACCORDION.SHADOW,
          backgroundColor: SETTINGS_CONSTANTS.ACCORDION.BG,
          '&:before': { display: 'none' },
          '&.Mui-expanded': {
            margin: 0,
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: '#1A212B' }} />}
          sx={{
            padding: SETTINGS_CONSTANTS.ACCORDION.PADDING,
            '&.Mui-expanded': {
              minHeight: '48px',
            },
            '& .MuiAccordionSummary-content': {
              margin: 0,
              '&.Mui-expanded': {
                margin: 0,
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '18px',
                color: '#1A212B',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {PROFILE.TITLE}
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {PROFILE.DESC}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: `0 ${SETTINGS_CONSTANTS.ACCORDION.PADDING} ${SETTINGS_CONSTANTS.ACCORDION.PADDING}` }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {meData && !meData.organization ? (
              <Typography sx={{ fontSize: '14px', color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
                {PROFILE.NO_ORG_NOTE}
              </Typography>
            ) : (isLoadingModules || isLoadingOrg) ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#6B7280' }}>
                <CircularProgress size={18} />
                <Typography sx={{ fontSize: '14px', fontFamily: "'Lexend', sans-serif" }}>
                  {PROFILE.LOADING}
                </Typography>
              </Box>
            ) : (isOrgError || !organization) ? (
              <Typography sx={{ fontSize: '14px', color: '#EF4444', fontFamily: "'Lexend', sans-serif" }}>
                {PROFILE.LOAD_ERROR}
              </Typography>
            ) : (
              <>
                {!canEditProfile && (
                  <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
                    {PROFILE.READ_ONLY_NOTE}
                  </Typography>
                )}

                {([
                  { key: 'name', label: PROFILE.FIELDS.NAME, multiline: false },
                  { key: 'legal_name', label: PROFILE.FIELDS.LEGAL_NAME, multiline: false },
                  { key: 'address', label: PROFILE.FIELDS.ADDRESS, multiline: true },
                  { key: 'dl_numbers', label: PROFILE.FIELDS.DL_NUMBERS, multiline: true },
                  { key: 'gstin', label: PROFILE.FIELDS.GSTIN, multiline: false },
                  { key: 'phone', label: PROFILE.FIELDS.PHONE, multiline: false },
                ] as const).map(({ key, label, multiline }) => (
                  <TextField
                    key={key}
                    fullWidth
                    label={label}
                    required={key === 'name'}
                    multiline={multiline}
                    minRows={multiline ? 2 : undefined}
                    value={profileForm[key]}
                    onChange={handleProfileField(key)}
                    disabled={!canEditProfile}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: SETTINGS_CONSTANTS.EMAIL_INPUT.RADIUS,
                        backgroundColor: '#FFFFFF',
                        fontFamily: "'Lexend', sans-serif",
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '14px',
                        color: '#1A212B',
                      },
                    }}
                  />
                ))}

                {canEditProfile && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <StandardButton
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      variant="primary"
                      size="medium"
                      sx={{
                        minWidth: '140px',
                        height: SETTINGS_CONSTANTS.EMAIL_INPUT.HEIGHT,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {PROFILE.SAVE_BUTTON}
                    </StandardButton>
                  </Box>
                )}

                {/* Logo */}
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '15px',
                    color: '#1A212B',
                    fontFamily: "'Lexend', sans-serif",
                    mt: 1,
                  }}
                >
                  {PROFILE.LOGO.HEADING}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                    p: '24px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '16px',
                    backgroundColor: '#F9FAFB',
                  }}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '16px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={pendingLogo || organization.logo_url || elemedLogo}
                      alt="Pharmacy logo"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
                    {pendingLogo
                      ? PROFILE.LOGO.PENDING_CAPTION
                      : organization.logo_url
                        ? PROFILE.LOGO.CURRENT_CAPTION
                        : PROFILE.LOGO.DEFAULT_CAPTION}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
                  {PROFILE.LOGO.HINT}
                </Typography>

                {canEditProfile && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={SETTINGS_CONSTANTS.LOGO.ACCEPT_ATTR}
                      onChange={handleLogoFile}
                      style={{ display: 'none' }}
                    />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                      <StandardButton
                        onClick={handleChooseLogo}
                        variant="secondary"
                        size="medium"
                        sx={{ minWidth: '140px', height: SETTINGS_CONSTANTS.EMAIL_INPUT.HEIGHT }}
                      >
                        {PROFILE.LOGO.CHOOSE_BUTTON}
                      </StandardButton>
                      <StandardButton
                        onClick={handleSaveLogo}
                        disabled={!pendingLogo || isSavingLogo}
                        variant="primary"
                        size="medium"
                        sx={{ minWidth: '140px', height: SETTINGS_CONSTANTS.EMAIL_INPUT.HEIGHT }}
                      >
                        {PROFILE.LOGO.UPLOAD_BUTTON}
                      </StandardButton>
                      {organization.logo_url && (
                        <StandardButton
                          onClick={() => setLogoConfirmOpen(true)}
                          disabled={isRemovingLogo}
                          variant="secondary"
                          size="medium"
                          sx={{ minWidth: '140px', height: SETTINGS_CONSTANTS.EMAIL_INPUT.HEIGHT }}
                        >
                          {PROFILE.LOGO.REMOVE_BUTTON}
                        </StandardButton>
                      )}
                    </Box>
                  </>
                )}
              </>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Invoice Numbering */}
      <Accordion
        expanded={expanded === 'invoice-numbering'}
        onChange={handleAccordionChange('invoice-numbering')}
        sx={{
          borderRadius: SETTINGS_CONSTANTS.ACCORDION.RADIUS,
          boxShadow: SETTINGS_CONSTANTS.ACCORDION.SHADOW,
          backgroundColor: SETTINGS_CONSTANTS.ACCORDION.BG,
          '&:before': { display: 'none' },
          '&.Mui-expanded': {
            margin: 0,
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: '#1A212B' }} />}
          sx={{
            padding: SETTINGS_CONSTANTS.ACCORDION.PADDING,
            '&.Mui-expanded': {
              minHeight: '48px',
            },
            '& .MuiAccordionSummary-content': {
              margin: 0,
              '&.Mui-expanded': {
                margin: 0,
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '18px',
                color: '#1A212B',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {INVOICE.TITLE}
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {INVOICE.DESC}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: `0 ${SETTINGS_CONSTANTS.ACCORDION.PADDING} ${SETTINGS_CONSTANTS.ACCORDION.PADDING}` }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {meData && !meData.organization ? (
              <Typography sx={{ fontSize: '14px', color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
                {PROFILE.NO_ORG_NOTE}
              </Typography>
            ) : (isLoadingModules || isLoadingOrg) ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#6B7280' }}>
                <CircularProgress size={18} />
                <Typography sx={{ fontSize: '14px', fontFamily: "'Lexend', sans-serif" }}>
                  {PROFILE.LOADING}
                </Typography>
              </Box>
            ) : (isOrgError || !organization) ? (
              <Typography sx={{ fontSize: '14px', color: '#EF4444', fontFamily: "'Lexend', sans-serif" }}>
                {PROFILE.LOAD_ERROR}
              </Typography>
            ) : (
              <>
                {!canEditProfile && (
                  <Typography sx={{ fontSize: '13px', color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
                    {INVOICE.READ_ONLY_NOTE}
                  </Typography>
                )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={schemeForm.invoice_number_enabled}
                      disabled={!canEditProfile}
                      onChange={(e) =>
                        setSchemeForm((f) => ({ ...f, invoice_number_enabled: e.target.checked }))
                      }
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#5C17E5' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#5C17E5',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '14px', color: '#1A212B', fontFamily: "'Lexend', sans-serif" }}>
                      {INVOICE.ENABLE_LABEL}
                    </Typography>
                  }
                />

                <TextField
                  fullWidth
                  label={INVOICE.TEMPLATE_LABEL}
                  value={schemeForm.invoice_number_template}
                  onChange={(e) =>
                    setSchemeForm((f) => ({ ...f, invoice_number_template: e.target.value }))
                  }
                  disabled={!canEditProfile}
                  helperText={`${INVOICE.TEMPLATE_HELP} ${INVOICE.TEMPLATE_EXAMPLE}`}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: SETTINGS_CONSTANTS.EMAIL_INPUT.RADIUS,
                      backgroundColor: '#FFFFFF',
                      fontFamily: "'Lexend', sans-serif",
                    },
                    '& .MuiInputBase-input': { fontSize: '14px', color: '#1A212B' },
                  }}
                />

                <TextField
                  fullWidth
                  type="number"
                  label={INVOICE.START_LABEL}
                  value={schemeForm.invoice_seq_start}
                  onChange={(e) =>
                    setSchemeForm((f) => ({ ...f, invoice_seq_start: e.target.value }))
                  }
                  disabled={!canEditProfile}
                  inputProps={{ min: 0, step: 1 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: SETTINGS_CONSTANTS.EMAIL_INPUT.RADIUS,
                      backgroundColor: '#FFFFFF',
                      fontFamily: "'Lexend', sans-serif",
                    },
                    '& .MuiInputBase-input': { fontSize: '14px', color: '#1A212B' },
                  }}
                />

                <TextField
                  select
                  fullWidth
                  label={INVOICE.RESET_LABEL}
                  value={schemeForm.invoice_number_reset}
                  onChange={(e) =>
                    setSchemeForm((f) => ({
                      ...f,
                      invoice_number_reset: e.target.value as 'none' | 'yearly',
                    }))
                  }
                  disabled={!canEditProfile}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: SETTINGS_CONSTANTS.EMAIL_INPUT.RADIUS,
                      backgroundColor: '#FFFFFF',
                      fontFamily: "'Lexend', sans-serif",
                    },
                    '& .MuiInputBase-input': { fontSize: '14px', color: '#1A212B' },
                  }}
                >
                  <MenuItem value="none">{INVOICE.RESET_NONE}</MenuItem>
                  <MenuItem value="yearly">{INVOICE.RESET_YEARLY}</MenuItem>
                </TextField>

                {schemePreview && (
                  <Typography sx={{ fontSize: '14px', color: '#1A212B', fontFamily: "'Lexend', sans-serif" }}>
                    {INVOICE.PREVIEW_PREFIX}
                    <Box component="span" sx={{ fontWeight: 700 }}>{schemePreview}</Box>
                  </Typography>
                )}

                {canEditProfile && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <StandardButton
                      onClick={handleSaveScheme}
                      disabled={isSavingProfile}
                      variant="primary"
                      size="medium"
                      sx={{
                        minWidth: '140px',
                        height: SETTINGS_CONSTANTS.EMAIL_INPUT.HEIGHT,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {INVOICE.SAVE_BUTTON}
                    </StandardButton>
                  </Box>
                )}
              </>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Daily Report Recipients */}
      <Accordion
        expanded={expanded === 'daily-reports'}
        onChange={handleAccordionChange('daily-reports')}
        sx={{
          borderRadius: SETTINGS_CONSTANTS.ACCORDION.RADIUS,
          boxShadow: SETTINGS_CONSTANTS.ACCORDION.SHADOW,
          backgroundColor: SETTINGS_CONSTANTS.ACCORDION.BG,
          '&:before': { display: 'none' },
          '&.Mui-expanded': {
            margin: 0,
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: '#1A212B' }} />}
          sx={{
            padding: SETTINGS_CONSTANTS.ACCORDION.PADDING,
            '&.Mui-expanded': {
              minHeight: '48px',
            },
            '& .MuiAccordionSummary-content': {
              margin: 0,
              '&.Mui-expanded': {
                margin: 0,
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '18px',
                color: '#1A212B',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {SETTINGS_LABELS.SECTIONS.DAILY_REPORTS.TITLE}
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: "'Lexend', sans-serif",
              }}
            >
              {SETTINGS_LABELS.SECTIONS.DAILY_REPORTS.DESC}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: `0 ${SETTINGS_CONSTANTS.ACCORDION.PADDING} ${SETTINGS_CONSTANTS.ACCORDION.PADDING}` }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Email Recipients List */}
            {expanded === 'daily-reports' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {isLoadingRecipients && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#6B7280' }}>
                  <CircularProgress size={18} />
                  <Typography sx={{ fontSize: '14px', fontFamily: "'Lexend', sans-serif" }}>
                    {DAILY.LOADING}
                  </Typography>
                </Box>
              )}
              {!isLoadingRecipients && isRecipientsError && (
                <Typography sx={{ fontSize: '14px', color: '#EF4444', fontFamily: "'Lexend', sans-serif" }}>
                  {DAILY.LOAD_ERROR}
                </Typography>
              )}
              {!isLoadingRecipients && !isRecipientsError && recipients.length === 0 && (
                <Typography sx={{ fontSize: '14px', color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>
                  {DAILY.EMPTY}
                </Typography>
              )}
              {recipients.map((recipient) => (
                <Box
                  key={recipient.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    padding: '12px 16px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <Typography
                    sx={{
                      flex: 1,
                      fontSize: '14px',
                      color: '#1A212B',
                      fontFamily: "'Lexend', sans-serif",
                    }}
                  >
                    {recipient.email}
                  </Typography>
                  <IconButton
                    onClick={() => handleDeleteEmail(recipient.id)}
                    disabled={pendingDeleteId === recipient.id}
                    size="small"
                    sx={{
                      color: SETTINGS_CONSTANTS.DELETE_ICON.COLOR,
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      },
                    }}
                  >
                    {pendingDeleteId === recipient.id ? (
                      <CircularProgress size={SETTINGS_CONSTANTS.DELETE_ICON.SIZE} />
                    ) : (
                      <DeleteIcon sx={{ fontSize: SETTINGS_CONSTANTS.DELETE_ICON.SIZE }} />
                    )}
                  </IconButton>
                </Box>
              ))}
            </Box>
            )}

            {/* Add New Email Input */}
            {expanded === 'daily-reports' && (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder={SETTINGS_LABELS.SECTIONS.DAILY_REPORTS.ADD_PLACEHOLDER}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddEmail();
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#6B7280', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: SETTINGS_CONSTANTS.EMAIL_INPUT.HEIGHT,
                    borderRadius: SETTINGS_CONSTANTS.EMAIL_INPUT.RADIUS,
                    border: SETTINGS_CONSTANTS.EMAIL_INPUT.BORDER,
                    backgroundColor: '#FFFFFF',
                    fontFamily: "'Lexend', sans-serif",
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover fieldset': {
                      border: 'none',
                    },
                    '&.Mui-focused fieldset': {
                      border: `1px solid #5C17E5`,
                    },
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '14px',
                    color: '#1A212B',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#9CA3AF',
                    opacity: 1,
                  },
                }}
              />
              <StandardButton
                onClick={handleAddEmail}
                disabled={isAdding}
                variant="primary"
                size="medium"
                sx={{
                  minWidth: '140px',
                  height: SETTINGS_CONSTANTS.EMAIL_INPUT.HEIGHT,
                  whiteSpace: 'nowrap',
                }}
              >
                {DAILY.ADD_BUTTON}
              </StandardButton>
            </Box>
            )}

            {/* Send Now */}
            {expanded === 'daily-reports' && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <StandardButton
                onClick={handleSendNow}
                disabled={isSending || recipients.length === 0}
                variant="primary"
                size="medium"
                startIcon={<SendIcon />}
                sx={{
                  minWidth: '140px',
                  height: SETTINGS_CONSTANTS.EMAIL_INPUT.HEIGHT,
                  whiteSpace: 'nowrap',
                }}
              >
                {DAILY.SEND_NOW_BUTTON}
              </StandardButton>
            </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
      </Box>

      <ConfirmationDialog
        open={logoConfirmOpen}
        title={PROFILE.LOGO.REMOVE_CONFIRM_TITLE}
        message={PROFILE.LOGO.REMOVE_CONFIRM_MESSAGE}
        confirmLabel={PROFILE.LOGO.REMOVE_BUTTON}
        onClose={() => setLogoConfirmOpen(false)}
        onConfirm={handleRemoveLogo}
      />

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

export default Settings;


