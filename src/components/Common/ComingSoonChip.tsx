import React from 'react';
import { Chip } from '@mui/material';
import { COMING_SOON_LABELS } from '../../config/label/ComingSoon.labels';

/**
 * Small, consistent "Coming Soon" tag used wherever a module/area is shown but
 * cannot be selected yet (Signup module picker, org module management, area
 * switchers).
 */
const ComingSoonChip: React.FC = () => (
  <Chip
    label={COMING_SOON_LABELS.TAG}
    size="small"
    sx={{
      height: 20,
      fontSize: '0.625rem',
      fontWeight: 600,
      color: '#B45309',
      backgroundColor: '#FEF3C7',
      borderRadius: '0.5rem',
      fontFamily: "'Lexend', sans-serif",
    }}
  />
);

export default ComingSoonChip;
