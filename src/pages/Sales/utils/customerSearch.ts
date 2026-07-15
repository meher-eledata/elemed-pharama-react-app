/**
 * Shared ranked autocomplete filtering for the Sales page.
 *
 * Name queries rank case-insensitively: exact prefix match first, then word-start
 * matches (any word in the name starting with the query), then substring matches.
 * Digit queries (allowing +, spaces, dashes) match options by phone instead —
 * both sides normalized to digits, prefix matches ranked above substring matches.
 */

/** Strip every non-digit character so phone comparisons are digit-to-digit. */
export const normalizeDigits = (value: string): string => (value || '').replace(/\D/g, '');

/** A query is a phone search when it contains at least one digit and no letters. */
export const isPhoneQuery = (query: string): boolean => {
  const q = (query || '').trim();
  return q.length > 0 && /\d/.test(q) && !/[A-Za-z]/.test(q);
};

/** Rank a name against a query: 0 = exact prefix, 1 = word start, 2 = substring, -1 = no match. */
export const rankName = (name: string | null | undefined, query: string): number => {
  const n = (name || '').toLowerCase();
  const q = (query || '').toLowerCase();
  if (!n || !q) return -1;
  if (n.startsWith(q)) return 0;
  if (n.split(/\s+/).some((word) => word.startsWith(q))) return 1;
  if (n.includes(q)) return 2;
  return -1;
};

/** Rank a phone against a digit query: 0 = prefix, 1 = substring, -1 = no match. */
export const rankPhone = (phone: string | null | undefined, digitQuery: string): number => {
  const p = normalizeDigits(phone || '');
  if (!p || !digitQuery) return -1;
  if (p.startsWith(digitQuery)) return 0;
  return p.includes(digitQuery) ? 1 : -1;
};

export interface RankedFilterAccessors<T> {
  getName: (option: T) => string | null | undefined;
  getPhone?: (option: T) => string | null | undefined;
}

/**
 * Filter + rank options for an Autocomplete. Non-matching options are dropped;
 * matches are ordered by rank (input order preserved within a rank — sort is stable).
 * An empty query returns the options unchanged.
 */
export const filterRanked = <T>(
  options: T[],
  rawQuery: string,
  { getName, getPhone }: RankedFilterAccessors<T>
): T[] => {
  const query = (rawQuery || '').trim();
  if (!query) return options;
  const phoneSearch = isPhoneQuery(query) && !!getPhone;
  const digits = normalizeDigits(query);
  const ranked: Array<{ option: T; rank: number }> = [];
  options.forEach((option) => {
    const rank = phoneSearch
      ? rankPhone(getPhone!(option), digits)
      : rankName(getName(option), query);
    if (rank >= 0) ranked.push({ option, rank });
  });
  return ranked.sort((a, b) => a.rank - b.rank).map((r) => r.option);
};
