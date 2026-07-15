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
