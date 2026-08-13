import {
  renderInvoiceNumberPreview,
  validateInvoiceTemplate,
  decorateInvoiceNumber,
  invoiceLookupKey,
} from '../invoiceNumberPreview';

// A fixed date so {YY}/{YYYY}/{MM} assertions are deterministic (July 2026).
const D = new Date(2026, 6, 4);

describe('renderInvoiceNumberPreview — faithful mirror of backend renderInvoiceNumber', () => {
  it('renders the contract example: SI-EL-{YY}-{SEQ:6} + 2296 → SI-EL-26-002296', () => {
    expect(renderInvoiceNumberPreview('SI-EL-{YY}-{SEQ:6}', 2296, D)).toBe('SI-EL-26-002296');
  });

  it('expands {YYYY} and {MM} from the invoice date', () => {
    expect(renderInvoiceNumberPreview('ELMD/{YYYY}/{MM}/{SEQ:5}', 100, D)).toBe('ELMD/2026/07/00100');
  });

  it('{SEQ} renders with no padding', () => {
    expect(renderInvoiceNumberPreview('INV-{SEQ}', 42, D)).toBe('INV-42');
  });

  it('does not truncate a sequence wider than the pad width', () => {
    expect(renderInvoiceNumberPreview('{SEQ:3}', 123456, D)).toBe('123456');
  });

  it('treats non-token text as literal', () => {
    expect(renderInvoiceNumberPreview('ACME{SEQ}', 7, D)).toBe('ACME7');
  });
});

describe('validateInvoiceTemplate — mirrors backend validateTemplate messages', () => {
  it('accepts a valid single-SEQ template', () => {
    expect(validateInvoiceTemplate('SI-EL-{YY}-{SEQ:6}')).toEqual({ valid: true });
  });

  it('rejects an empty template', () => {
    expect(validateInvoiceTemplate('').valid).toBe(false);
  });

  it('rejects an unknown token with the backend message', () => {
    expect(validateInvoiceTemplate('{DD}-{SEQ}')).toEqual({
      valid: false,
      error: 'unknown token {DD} in invoice_number_template',
    });
  });

  it('rejects zero SEQ tokens', () => {
    expect(validateInvoiceTemplate('NO-SEQ-{YY}')).toEqual({
      valid: false,
      error: 'invoice_number_template must contain exactly one SEQ token',
    });
  });

  it('rejects multiple SEQ tokens', () => {
    expect(validateInvoiceTemplate('{SEQ}-{SEQ}')).toEqual({
      valid: false,
      error: 'invoice_number_template must contain exactly one SEQ token',
    });
  });

  it('rejects an out-of-range SEQ width', () => {
    expect(validateInvoiceTemplate('{SEQ:19}').valid).toBe(false);
  });

  it('rejects an unbalanced brace', () => {
    expect(validateInvoiceTemplate('{SEQ}-{').valid).toBe(false);
  });

  it('rejects a template containing < or > with the backend message', () => {
    expect(validateInvoiceTemplate('<img>-{SEQ}')).toEqual({
      valid: false,
      error: 'invoice_number_template must not contain < or >',
    });
    expect(validateInvoiceTemplate('{SEQ}>')).toEqual({
      valid: false,
      error: 'invoice_number_template must not contain < or >',
    });
  });
});

describe('decorateInvoiceNumber — INV cosmetic gating for display', () => {
  it('prepends INV to a BARE NUMBER when the scheme is OFF (legacy)', () => {
    expect(decorateInvoiceNumber('947', false)).toBe('INV947');
    expect(decorateInvoiceNumber(947, false)).toBe('INV947');
  });

  it('shows the value verbatim when the scheme is ON', () => {
    expect(decorateInvoiceNumber('SI-EL-26-002296', true)).toBe('SI-EL-26-002296');
  });

  // Imported/historical rows store the prefix as part of invoice_number. Re-prefixing them
  // produced "INVINV-2026-000007", which matched nothing when pasted into a search box.
  it('never double-prefixes a stored value that already carries one (scheme OFF)', () => {
    expect(decorateInvoiceNumber('INV-2026-000007', false)).toBe('INV-2026-000007');
    expect(decorateInvoiceNumber('RB-2026-01', false)).toBe('RB-2026-01');
  });

  it('leaves any other non-numeric stored value alone (scheme OFF)', () => {
    expect(decorateInvoiceNumber('EM/26-27/000100', false)).toBe('EM/26-27/000100');
  });

  it('returns empty string for nullish/empty regardless of scheme', () => {
    expect(decorateInvoiceNumber(null, false)).toBe('');
    expect(decorateInvoiceNumber(undefined, true)).toBe('');
    expect(decorateInvoiceNumber('', true)).toBe('');
  });
});

describe('invoiceLookupKey — edit-mode lookup gating', () => {
  it('strips the legacy INV/RB prefix off a decorated BARE NUMBER when the scheme is OFF', () => {
    expect(invoiceLookupKey('INV947', false)).toBe('947');
    expect(invoiceLookupKey('inv-947', false)).toBe('947');
    expect(invoiceLookupKey('RB-12', false)).toBe('12');
  });

  it('looks a schemed number up verbatim when the scheme is ON', () => {
    // Even a prefix that LOOKS like the legacy cosmetic is preserved when schemed.
    expect(invoiceLookupKey('INV-2026-01', true)).toBe('INV-2026-01');
    expect(invoiceLookupKey('SI-EL-26-002296', true)).toBe('SI-EL-26-002296');
  });

  it('keeps a stored prefix that is NOT a decoration (scheme OFF)', () => {
    expect(invoiceLookupKey('INV-2026-000007', false)).toBe('INV-2026-000007');
    expect(invoiceLookupKey('Invicta Health', false)).toBe('Invicta Health');
    expect(invoiceLookupKey('RB Pharma', false)).toBe('RB Pharma');
  });

  it('falls back to the original when stripping would empty the value', () => {
    expect(invoiceLookupKey('INV', false)).toBe('INV');
  });

  // The load-bearing invariant: what is DISPLAYED always maps back to what is STORED.
  it('is the exact inverse of decorateInvoiceNumber for BOTH stored shapes', () => {
    for (const stored of ['1005', '947', 'INV-2026-000007', 'EM/26-27/000100']) {
      expect(invoiceLookupKey(decorateInvoiceNumber(stored, false), false)).toBe(stored);
    }
  });
});
