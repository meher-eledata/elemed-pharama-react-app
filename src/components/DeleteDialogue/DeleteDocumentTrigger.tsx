import React from 'react';
import { Typography } from '@mui/material';

export interface DeleteDocumentTriggerProps {
  /** Sentence-case action text, e.g. "Delete Invoice" or "Delete Receipt". */
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * The "delete this document" affordance on an edit screen — red text, not a filled button.
 *
 * Deliberately understated: deleting is the rare, destructive path, so it should not compete
 * visually with Save. The receipts screen originally used a large filled red button reading
 * "Delete the full receipt", which shouted louder than the primary action; this matches the
 * sales screen's quieter treatment.
 *
 * No busy/success state here on purpose — the confirmation dialog owns "Deleting…" and the
 * page owns the success snackbar, so the trigger never has to duplicate either.
 *
 * Keyboard-operable because it is a Typography rather than a real <button>.
 */
const DeleteDocumentTrigger: React.FC<DeleteDocumentTriggerProps> = ({
  label,
  onClick,
  disabled = false,
}) => (
  <Typography
    onClick={disabled ? undefined : onClick}
    role="button"
    tabIndex={disabled ? -1 : 0}
    aria-disabled={disabled}
    onKeyDown={(e) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
    sx={{
      color: disabled ? '#9CA3AF' : '#DC2626',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 600,
      fontSize: '0.875rem',
      fontFamily: "'Lexend', sans-serif",
      userSelect: 'none',
      '&:hover': disabled
        ? {}
        : {
            color: '#B91C1C',
            textDecoration: 'underline',
          },
    }}
  >
    {label}
  </Typography>
);

export default DeleteDocumentTrigger;
