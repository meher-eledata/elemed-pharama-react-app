// Predefined option lists for the product `type` (dosage form) and `unit_of_measure`
// selects. Backend stores both as free-text STRING columns (no enum/FK), so these are a
// FRONTEND-ONLY convenience list. They are merged with the dynamic distinct values from
// getProductFieldOptions (see mergeProductOptions) so no legacy DB value is ever lost.

export const PRODUCT_TYPES = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Suspension',
  'Injection',
  'Infusion',
  'Drops',
  'Eye Drops',
  'Ear Drops',
  'Nasal Spray',
  'Inhaler',
  'Respule',
  'Ointment',
  'Cream',
  'Gel',
  'Lotion',
  'Powder',
  'Sachet',
  'Solution',
  'Suppository',
  'Patch',
  'Lozenge',
  'Spray',
  'Soap',
  'Shampoo',
  'Balm',
  'Kit',
] as const;

export const PRODUCT_UNITS = [
  'Strip',
  'Tablet',
  'Capsule',
  'Bottle',
  'Vial',
  'Ampoule',
  'Tube',
  'Sachet',
  'Box',
  'Piece',
  'Pack',
  'Jar',
  'Roll',
  'ml',
  'L',
  'mg',
  'g',
  'kg',
  'Drops',
  'Unit',
] as const;

// Indian drug schedules — a FIXED statutory list (do NOT merge with / fetch from the
// get-product-field-options endpoint). Backend allowlist: G, H, H1, X, C, C1, K, NONE.
// SEMANTICS (see api-contract.md, GET /api/receive/get-products): NULL = "not yet
// attributed" (the sale-cart popup prompts once); 'NONE' = "explicitly no schedule"
// (never prompts). BOTH display blank — use formatSchedule below.
export const PRODUCT_SCHEDULE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'NONE', label: 'No Schedule' },
  { value: 'G', label: 'G' },
  { value: 'H', label: 'H' },
  { value: 'H1', label: 'H1' },
  { value: 'X', label: 'X' },
  { value: 'C', label: 'C' },
  { value: 'C1', label: 'C1' },
  { value: 'K', label: 'K' },
];

// Display helper: null/undefined (not yet attributed) and 'NONE' (explicitly none)
// BOTH render blank; real codes render as-is.
export const formatSchedule = (schedule?: string | null): string =>
  !schedule || schedule === 'NONE' ? '' : schedule;

// Merge the predefined list (shown first, in order) with dynamic distinct values from the
// DB, appending only those not already present. Dedup is case-insensitive so e.g. a stored
// "tablet" does not duplicate the predefined "Tablet".
export const mergeProductOptions = (
  predefined: readonly string[],
  dynamic: readonly string[] = []
): string[] => {
  const seen = new Set(predefined.map((o) => o.toLowerCase()));
  const merged: string[] = [...predefined];
  for (const opt of dynamic) {
    const key = opt?.toLowerCase();
    if (opt && !seen.has(key)) {
      seen.add(key);
      merged.push(opt);
    }
  }
  return merged;
};
