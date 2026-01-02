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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import SaveIcon from '@mui/icons-material/Save';
import { SETTINGS_LABELS } from '../../config/label/Settings.labels';
import { SETTINGS_CONSTANTS } from '../../config/constants/Settings.constants';
import { StandardButton } from '../../components/Common';

const Settings: React.FC = () => {
  const [expanded, setExpanded] = useState<string | false>(false);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([
    'susan.jones@example.com',
    'david.lee@example.com',
    'anna.kim@example.com',
  ]);
  const [newEmail, setNewEmail] = useState<string>('');

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleAddEmail = () => {
    if (newEmail.trim() && !emailRecipients.includes(newEmail.trim())) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(newEmail.trim())) {
        setEmailRecipients([...emailRecipients, newEmail.trim()]);
        setNewEmail('');
      }
    }
  };

  const handleDeleteEmail = (emailToDelete: string) => {
    setEmailRecipients(emailRecipients.filter(email => email !== emailToDelete));
  };

  const handleSaveChanges = () => {
    // TODO: Implement save functionality
    console.log('Saving settings...', { emailRecipients });
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
        margin: '0 auto',
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
              {emailRecipients.map((email, index) => (
                <Box
                  key={index}
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
                    {email}
                  </Typography>
                  <IconButton
                    onClick={() => handleDeleteEmail(email)}
                    size="small"
                    sx={{
                      color: SETTINGS_CONSTANTS.DELETE_ICON.COLOR,
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      },
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: SETTINGS_CONSTANTS.DELETE_ICON.SIZE }} />
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
                variant="primary"
                size="medium"
                sx={{
                  minWidth: '140px',
                  height: SETTINGS_CONSTANTS.EMAIL_INPUT.HEIGHT,
                  whiteSpace: 'nowrap',
                }}
              >
                {SETTINGS_LABELS.SECTIONS.DAILY_REPORTS.ADD_BUTTON}
              </StandardButton>
            </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Save Changes Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
        <StandardButton
          onClick={handleSaveChanges}
          variant="primary"
          size="large"
          startIcon={<SaveIcon />}
          sx={{
            height: SETTINGS_CONSTANTS.SAVE_BUTTON.HEIGHT,
            minWidth: SETTINGS_CONSTANTS.SAVE_BUTTON.MIN_WIDTH,
            borderRadius: SETTINGS_CONSTANTS.SAVE_BUTTON.RADIUS,
          }}
        >
          {SETTINGS_LABELS.SAVE_BUTTON}
        </StandardButton>
      </Box>
      </Box>
    </Box>
  );
};

export default Settings;


