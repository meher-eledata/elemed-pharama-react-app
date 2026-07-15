// Labels for the Inventory Adjustment page — blocked-deletion (sold batch) modal and the
// duplicate-batch pre-submit deletion guard.
export const INVENTORY_ADJUSTMENT_LABELS = {
  blockedModalTitle: 'Batch cannot be deleted',
  batchWord: 'Batch',
  // 409 with last_remaining: true — the row is the LAST remaining row of a sold batch number.
  lastRemainingSoldOn: 'was sold on invoice(s):',
  lastRemainingRule:
    ', and this is the last batch with this number — at least one batch with this number must remain. Delete the other duplicate batches instead, or keep this one.',
  // Old-shape fallback (409 body without last_remaining) — pre-2026-07-15 wording.
  soldFallback: 'cannot be deleted because product from it was sold on invoice(s):',
  // Pre-submit guard: every row of a duplicate batch-number group is marked for deletion.
  allDuplicatesMarkedForDeletion: (batchNumber: string) =>
    `At least one batch with number ${batchNumber} must remain because it appears on invoices — unmark one of them before saving.`,
};
