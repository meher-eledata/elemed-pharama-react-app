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
// get-product-field-options endpoint). The empty value means "No Schedule" and is sent
// as null/omitted so the backend clears/stores NULL. Backend allowlist: G, H, H1, X, C, C1, K.
export const PRODUCT_SCHEDULE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '', label: 'No Schedule' },
  { value: 'G', label: 'G' },
  { value: 'H', label: 'H' },
  { value: 'H1', label: 'H1' },
  { value: 'X', label: 'X' },
  { value: 'C', label: 'C' },
  { value: 'C1', label: 'C1' },
  { value: 'K', label: 'K' },
];

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
