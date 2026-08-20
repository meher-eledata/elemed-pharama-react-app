import React from 'react';
import { Box, Tooltip } from '@mui/material';

export interface DeletedRecordBadgeProps {
  /** Lower-case noun for the retired document, e.g. "invoice" or "receipt". */
  documentLabel: string;
  deletedBy?: string | null;
  /** ISO timestamp; rendered in the viewer's locale. */
  deletedAt?: string | null;
  deletionReason?: string | null;
}

/** Shared copy so the sales and receive screens never drift apart on wording. */
export const deletedRecordTooltip = (
  documentLabel: string,
  deletedBy?: string | null,
  deletedAt?: string | null,
  deletionReason?: string | null
): string => {
  const who = deletedBy ? ` by ${deletedBy}` : '';
  const when = deletedAt ? ` on ${new Date(deletedAt).toLocaleString()}` : '';
  const why = deletionReason ? ` — ${deletionReason}` : '';
  // Falls back to a bare statement when the audit fields are missing (legacy rows
  // deleted before the columns existed).
  return who || when || why
    ? `Deleted${who}${when}${why}`
    : `This ${documentLabel} has been deleted`;
};

/** Greyed-out styling for an action a retired record cannot perform. */
export const DELETED_ACTION_SX = {
  color: '#9CA3AF',
  cursor: 'not-allowed',
  opacity: 0.5,
  pointerEvents: 'auto' as const,
};

/**
 * "Deleted" chip for a soft-deleted document.
 *
 * Both sales invoices and goods receipts are RETIRED rather than destroyed, and both stay
 * listed so the history remains auditable — which makes it the list's job to say the row is
 * retired, identically on both screens.
 *
 * A text chip rather than an icon: "DELETED" needs no decoding, and the sales side's previous
 * red block-icon carried no explanation at all. The tooltip carries who / when / why, which
 * the backend records on both documents.
 */
const DeletedRecordBadge: React.FC<DeletedRecordBadgeProps> = ({
  documentLabel,
  deletedBy,
  deletedAt,
  deletionReason,
}) => (
  <Tooltip
    title={deletedRecordTooltip(documentLabel, deletedBy, deletedAt, deletionReason)}
    arrow
    placement="top"
  >
    <Box
      component="span"
      sx={{
        flexShrink: 0,
        px: '0.375rem',
        py: '0.0625rem',
        borderRadius: '0.25rem',
        backgroundColor: '#FEE2E2',
        color: '#B91C1C',
        border: '1px solid #FCA5A5',
        fontSize: '0.625rem',
        fontWeight: 600,
        lineHeight: 1.6,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        cursor: 'default',
        whiteSpace: 'nowrap',
      }}
    >
      Deleted
    </Box>
  </Tooltip>
);

export default DeletedRecordBadge;
