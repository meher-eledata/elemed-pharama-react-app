// Faithful client-side mirror of the backend
// `services/documentNumber/renderTemplate.js` (renderTemplate + validateTemplate).
// DOC-TYPE AGNOSTIC: the same grammar, bounds and reject reasons drive all four series
// (sales_invoice | sales_return | receipt | purchase_return) — the backend shares one
// validator across them and, like `validateTemplate(template, field)`, names the CALLER'S
// request field in every message (default `template`, this endpoint's own field name).
// Used ONLY for the Settings live preview and instant client-side validation — the
// server remains the source of truth and its 400 { error } messages are still surfaced.
// Keep the token rules / bounds identical to the backend; see the API contract
// (Document numbering) before changing either side.
//
// Tokens (everything else is a literal):
//   {YY}     2-digit year   (of the RESET PERIOD — see renderInvoiceNumberPreview)
//   {YYYY}   4-digit year   (of the RESET PERIOD)
//   {MM}     2-digit zero-padded month (of the RESET PERIOD)
//   {SEQ:n}  the sequence zero-padded to width n (1..18)
//   {SEQ}    the sequence with no padding
// Exactly ONE SEQ token is required; any other {...} is an unknown token.

export const MAX_TEMPLATE_LENGTH = 64;
export const MAX_SEQ_WIDTH = 18;

// Matches a single {...} token with NO nested braces.
const TOKEN_RE = /\{([^{}]*)\}/g;

const two = (n: number): string => (n < 10 ? `0${n}` : String(n));

const padSeq = (seq: number | string, width: number): string => {
  const s = String(seq);
  return s.length >= width ? s : '0'.repeat(width - s.length) + s;
};

export interface TemplateValidation {
  valid: boolean;
  error?: string;
}

// Mirror of backend validateTemplate(template, field) — returns the same reasons, in the
// same order and naming the same request field, so the inline message matches what the
// server would reject with.
export function validateInvoiceTemplate(
  template: string,
  field: string = 'template',
): TemplateValidation {
  if (typeof template !== 'string' || template.trim() === '') {
    return { valid: false, error: `${field} must be a non-empty string` };
  }
  if (template.length > MAX_TEMPLATE_LENGTH) {
    return { valid: false, error: `${field} must be at most ${MAX_TEMPLATE_LENGTH} characters` };
  }
  // Defense-in-depth mirror of the backend: the template's literal text flows into
  // printed HTML. Escaping at the sink is the primary control, but rejecting
  // HTML-significant characters here guarantees no render path can ever emit `<...>`.
  if (template.includes('<') || template.includes('>')) {
    return { valid: false, error: `${field} must not contain < or >` };
  }

  let seqCount = 0;
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(template)) !== null) {
    const token = match[1];
    if (token === 'YY' || token === 'YYYY' || token === 'MM') continue;
    if (token === 'SEQ') {
      seqCount += 1;
      continue;
    }
    const seqWidth = /^SEQ:(\d+)$/.exec(token);
    if (seqWidth) {
      const width = Number(seqWidth[1]);
      if (!Number.isInteger(width) || width < 1 || width > MAX_SEQ_WIDTH) {
        return { valid: false, error: `SEQ width must be an integer between 1 and ${MAX_SEQ_WIDTH}` };
      }
      seqCount += 1;
      continue;
    }
    return { valid: false, error: `unknown token {${token}} in ${field}` };
  }

  const leftover = template.replace(TOKEN_RE, '');
  if (leftover.includes('{') || leftover.includes('}')) {
    return { valid: false, error: `${field} has an unbalanced { or }` };
  }

  if (seqCount !== 1) {
    return { valid: false, error: `${field} must contain exactly one SEQ token` };
  }

  return { valid: true };
}

// The scheme's reset-period context — the same values that decide the counter bucket
// server-side. Mirrors the backend `period` argument of renderDocumentNumber.
export interface PeriodContext {
  cycle?: string | null;
  anchorMonth?: number | string | null;
  anchorDay?: number | string | null;
}

// Indian financial year: 1 April (backend DEFAULT_ANCHOR_MONTH / DEFAULT_ANCHOR_DAY).
const DEFAULT_ANCHOR_MONTH = 4;
const DEFAULT_ANCHOR_DAY = 1;

// Mirror of backend `periodTokensFor`: the year/month the tokens must render for a
// document drawing its number from THIS cycle's bucket — the PERIOD's year, not the
// document's calendar year. Under the default 'annual' cycle anchored 1 April,
// 2026-02-15 buckets to FY2025 while its calendar year is 2026; rendering {YY} from
// the calendar year made two independent counters emit the same '26' prefix. Anchored
// 1 January the bucket year IS the calendar year, so output is byte-identical to the
// legacy rendering. All getters are LOCAL-time (never UTC), exactly like the backend.
function periodTokens(d: Date, period?: PeriodContext): { year: number; month: number } {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  // 'monthly' and 'none' both render the document's own year/month.
  if (!period || period.cycle !== 'annual') return { year, month };

  const m = Number(period.anchorMonth);
  const day = Number(period.anchorDay);
  const aMonth = Number.isInteger(m) && m >= 1 && m <= 12 ? m : DEFAULT_ANCHOR_MONTH;
  const aDay = Number.isInteger(day) && day >= 1 && day <= 31 ? day : DEFAULT_ANCHOR_DAY;
  const onOrAfterAnchor = month > aMonth || (month === aMonth && d.getDate() >= aDay);
  return { year: onOrAfterAnchor ? year : year - 1, month };
}

// Mirror of the backend renderer, for any doc type. `seq` is the sequence value; `date`
// is the DOCUMENT date. `period` is the scheme's reset-period context — omit it (no
// bucket, e.g. settings-time validation) and the tokens render from the document date,
// which is what the backend does for an absent `period`.
export function renderInvoiceNumberPreview(
  template: string,
  seq: number | string,
  date: Date = new Date(),
  period?: PeriodContext,
): string {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const { year, month } = periodTokens(d, period);

  return template.replace(TOKEN_RE, (whole, token: string) => {
    if (token === 'YY') return two(year % 100);
    if (token === 'YYYY') return String(year);
    if (token === 'MM') return two(month);
    if (token === 'SEQ') return String(seq);
    const seqWidth = /^SEQ:(\d+)$/.exec(token);
    if (seqWidth) return padSeq(seq, Number(seqWidth[1]));
    return whole;
  });
}

// A DECORATED legacy invoice number: the cosmetic "INV"/"RB" prefix on an otherwise BARE
// NUMBER ("INV947", "RB-12"). Anchored on digits on purpose — an imported/historical
// invoice_number such as "INV-2026-000007" is a REAL stored value, not a decoration, so it
// is neither re-decorated nor stripped. decorateInvoiceNumber and invoiceLookupKey both gate
// on this shape, which makes them exact inverses: what is DISPLAYED always maps back to what
// is STORED (search terms and edit-mode lookups included).
const DECORATED_INVOICE_RE = /^(?:INV|RB)-?(\d+)$/i;

// Legacy "INV" cosmetic for DISPLAY: when the org's custom scheme is OFF a bare numeric
// invoice_number is shown as `INV<n>`; a stored value that is not a bare number (schemed, or
// legacy data that already carries its own prefix) is shown verbatim — never "INVINV-...".
// Empty/nullish → ''.
export function decorateInvoiceNumber(n: unknown, schemeEnabled: boolean): string {
  if (n === null || n === undefined || n === '') return '';
  const value = String(n);
  if (schemeEnabled) return value;
  return /^\d+$/.test(value) ? `INV${value}` : value;
}

// Prepare a DISPLAYED invoice number for the edit-mode LOOKUP / server search — the inverse
// of decorateInvoiceNumber. Only the cosmetic prefix added to a bare number is stripped; a
// schemed number, and any stored value carrying its own prefix, is looked up verbatim.
export function invoiceLookupKey(raw: string, schemeEnabled: boolean): string {
  const full = raw.trim();
  if (schemeEnabled) return full;
  const decorated = DECORATED_INVOICE_RE.exec(full);
  return decorated ? decorated[1] : full;
}
