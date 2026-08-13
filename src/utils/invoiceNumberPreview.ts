// Faithful client-side mirror of the backend
// `services/invoiceNumber/renderTemplate.js` (renderInvoiceNumber + validateTemplate).
// Used ONLY for the Settings live preview and instant client-side validation — the
// server remains the source of truth and its 400 { error } messages are still surfaced.
// Keep the token rules / bounds identical to the backend; see the API contract
// (CUSTOM INVOICE NUMBERING) before changing either side.
//
// Tokens (everything else is a literal):
//   {YY}     2-digit year   (from the invoice date)
//   {YYYY}   4-digit year   (from the invoice date)
//   {MM}     2-digit zero-padded month (from the invoice date)
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

// Mirror of backend validateTemplate — returns the same reasons/order so the inline
// message matches what the server would reject with.
export function validateInvoiceTemplate(template: string): TemplateValidation {
  if (typeof template !== 'string' || template.trim() === '') {
    return { valid: false, error: 'invoice_number_template must be a non-empty string' };
  }
  if (template.length > MAX_TEMPLATE_LENGTH) {
    return { valid: false, error: `invoice_number_template must be at most ${MAX_TEMPLATE_LENGTH} characters` };
  }
  // Defense-in-depth mirror of the backend: the template's literal text flows into
  // printed HTML. Escaping at the sink is the primary control, but rejecting
  // HTML-significant characters here guarantees no render path can ever emit `<...>`.
  if (template.includes('<') || template.includes('>')) {
    return { valid: false, error: 'invoice_number_template must not contain < or >' };
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
    return { valid: false, error: `unknown token {${token}} in invoice_number_template` };
  }

  const leftover = template.replace(TOKEN_RE, '');
  if (leftover.includes('{') || leftover.includes('}')) {
    return { valid: false, error: 'invoice_number_template has an unbalanced { or }' };
  }

  if (seqCount !== 1) {
    return { valid: false, error: 'invoice_number_template must contain exactly one SEQ token' };
  }

  return { valid: true };
}

// Mirror of backend renderInvoiceNumber. `seq` is the sequence value; `date` is the
// invoice date, from which {YY}/{YYYY}/{MM} are derived.
export function renderInvoiceNumberPreview(
  template: string,
  seq: number | string,
  date: Date = new Date(),
): string {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

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
