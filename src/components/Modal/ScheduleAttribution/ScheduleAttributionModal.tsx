import React, { useEffect, useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StandardButton } from '../../Common';
import { PRODUCT_SCHEDULE_OPTIONS } from '../../../config/constants/product.constants';
import { SCHEDULE_ATTRIBUTION_MODAL_LABELS } from '../../../config/label/ScheduleAttributionModal.labels';

interface ScheduleAttributionModalProps {
  open: boolean;
  productName: string;
  saving: boolean;
  // Receives the chosen allowlist value (a code or the explicit 'NONE').
  onSelect: (schedule: string) => void;
  // Skipping never blocks the sale — the caller adds to cart without a schedule.
  onCancel: () => void;
}

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: '420px' },
  bgcolor: 'background.paper',
  borderRadius: '12px',
  border: '1px solid',
  borderColor: 'divider',
  p: 3,
  fontFamily: "'Lexend', sans-serif",
};

const L = SCHEDULE_ATTRIBUTION_MODAL_LABELS;

// One-time attribution popup: shown when a product with schedule NULL (never
// attributed) is added to the sale cart OR to a receipt in the Receive flow.
// An explicit choice — including "No Schedule" ('NONE') — is persisted on the
// product and never asked again.
const ScheduleAttributionModal: React.FC<ScheduleAttributionModalProps> = ({
  open,
  productName,
  saving,
  onSelect,
  onCancel,
}) => {
  const [choice, setChoice] = useState('');

  useEffect(() => {
    if (open) setChoice('');
  }, [open]);

  return (
    <Modal open={open} onClose={onCancel}>
      <Box sx={modalStyle}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '18px', color: '#1A212B' }}>
            {L.TITLE}
          </Typography>
          <IconButton onClick={onCancel} size="small" aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>

        <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 2 }}>
          {L.DESCRIPTION.replace('{product}', productName)}
        </Typography>

        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <InputLabel id="schedule-attribution-label">{L.FIELD_LABEL}</InputLabel>
          <Select
            labelId="schedule-attribution-label"
            label={L.FIELD_LABEL}
            value={choice}
            onChange={(e) => setChoice(String(e.target.value))}
          >
            {PRODUCT_SCHEDULE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
          <StandardButton variant="secondary" size="medium" onClick={onCancel} disabled={saving}>
            {L.CANCEL_BUTTON}
          </StandardButton>
          <StandardButton
            variant="primary"
            size="medium"
            onClick={() => choice && onSelect(choice)}
            disabled={!choice || saving}
          >
            {L.SAVE_BUTTON}
          </StandardButton>
        </Box>
      </Box>
    </Modal>
  );
};

export default ScheduleAttributionModal;
