// One-time drug-schedule attribution popup — shared by the Sales cart and the
// Receive (receipt) workflows. Fires only when a product's schedule is NULL.
export const SCHEDULE_ATTRIBUTION_MODAL_LABELS = {
  TITLE: 'Assign Drug Schedule',
  DESCRIPTION:
    '"{product}" has no drug schedule assigned yet. Pick one (or "No Schedule") — it is saved on the product and you won\'t be asked again.',
  FIELD_LABEL: 'Schedule',
  CANCEL_BUTTON: 'Skip for now',
  SAVE_BUTTON: 'Save & Add',
} as const;
