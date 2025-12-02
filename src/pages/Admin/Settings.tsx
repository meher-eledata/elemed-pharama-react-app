import React from 'react';
import { Box, Typography } from '@mui/material';
import { SETTINGS_LABELS } from '../../config/label/Settings.labels';
import { SETTINGS_CONSTANTS } from '../../config/constants/Settings.constants';

const Settings: React.FC = () => {
  return (
    <Box>
      <Typography 
        variant={SETTINGS_CONSTANTS.TYPOGRAPHY.TITLE_VARIANT} 
        fontWeight={SETTINGS_CONSTANTS.TYPOGRAPHY.TITLE_FONT_WEIGHT}
      >
        {SETTINGS_LABELS.PAGE_TITLE}
      </Typography>
    </Box>
  );
};

export default Settings;


