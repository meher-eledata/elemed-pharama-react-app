import React from 'react';
import { Box, Typography } from '@mui/material';
import { OPD_CONSTANTS } from '../../config/constants/Outpatient.constants';

// Placeholder — the live queue UI is built in PHASE B2b (queue/call-next/skip/
// no-show/reorder hooks are already defined in outpatientApi).
const LiveQueue: React.FC = () => (
  <Box sx={{ p: OPD_CONSTANTS.LAYOUT.PAGE_PADDING }}>
    <Typography variant="h5" fontWeight={700}>
      Live Queue
    </Typography>
    <Typography sx={{ color: '#6B7280', fontSize: 14, mt: 1 }}>Coming soon.</Typography>
  </Box>
);

export default LiveQueue;
