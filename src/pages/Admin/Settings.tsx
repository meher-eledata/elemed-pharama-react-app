import React, { useState } from 'react';
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
import { useGetMeQuery, useToggleModuleMutation } from '../../redux/slices/orgApi';
import { setOrgContext } from '../../redux/slices/orgSlice';
import { MODULES, ALL_MODULE_KEYS } from '../../config/modules.config';
import { extractErrorMessage } from '../../utils/errorUtils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAILY = SETTINGS_LABELS.SECTIONS.DAILY_REPORTS;
const MODULES_LABELS = SETTINGS_LABELS.SECTIONS.MODULES;
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


