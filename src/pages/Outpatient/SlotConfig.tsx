import React from 'react';
import { Box, Typography } from '@mui/material';
import { OPD_CONSTANTS } from '../../config/constants/Outpatient.constants';

// Placeholder — the slot/availability configuration UI is built in PHASE B2b
// (availability + service write hooks are already defined in outpatientApi).
const SlotConfig: React.FC = () => (
  <Box sx={{ p: OPD_CONSTANTS.LAYOUT.PAGE_PADDING }}>
    <Typography variant="h5" fontWeight={700}>
      Slot Config
    </Typography>
    <Typography sx={{ color: '#6B7280', fontSize: 14, mt: 1 }}>Coming soon.</Typography>
  </Box>
);

export default SlotConfig;
