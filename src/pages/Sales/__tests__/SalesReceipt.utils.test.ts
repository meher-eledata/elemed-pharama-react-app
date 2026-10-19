import { formatReceiptMrp, generatePrintHTML } from '../SalesReceipt.utils';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';

// Minimal valid input for the print-HTML builder. invoiceNumber is now admin-influenced
// (a custom scheme template's literal text flows into it), so it MUST be escaped at the
// HTML sink like the sibling org fields.
const baseData = {
  customerName: 'John Doe',
  customerMobile: '9998887776',
  customerCity: '',
  doctorName: 'Dr. Smith',
  doctorMobile: '',
  doctorEmail: '',
  paymentMode: 'Cash',
  insuranceCompany: '',
  invoiceNumber: 'SI-EL-26-002296',
  invoiceDate: '2026-01-10',
  salesItems: [],
  totalValue: '0',
  totalDiscount: '0',
  taxAmount: '0',
  totalPayableAmount: '0',
  labels: SALES_RECEIPT_LABELS,
};

describe('generatePrintHTML — invoice_number XSS escaping', () => {
  it('escapes HTML in a malicious invoice number so the markup is inert', () => {
    const html = generatePrintHTML({
      ...baseData,
      invoiceNumber: '<img src=x onerror=alert(1)>',
    });

    // The raw <img ...> must NOT appear as live markup.
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    // It appears only in its escaped, inert form.
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('renders a normal schemed invoice number verbatim (no false escaping)', () => {
    const html = generatePrintHTML(baseData);
    expect(html).toContain('SI-EL-26-002296');
  });
});

describe('formatReceiptMrp', () => {
  it('shows a stored 4-decimal MRP with 2 decimals (no wrapping "300.0000")', () => {
    expect(formatReceiptMrp('300.0000')).toBe('300.00');
    expect(formatReceiptMrp('12.5')).toBe('12.50');
    expect(formatReceiptMrp(100)).toBe('100.00');
  });

  it('falls back to N/A when there is no MRP', () => {
    expect(formatReceiptMrp(undefined)).toBe('N/A');
    expect(formatReceiptMrp(null)).toBe('N/A');
    expect(formatReceiptMrp('N/A')).toBe('N/A');
    expect(formatReceiptMrp('')).toBe('N/A');
  });

  it('formats the MRP cell of the printed receipt', () => {
    const html = generatePrintHTML({
      ...baseData,
      salesItems: [{ id: '1', productName: 'Strip10', batch: 'B1', quantity: '3', unitPrice: '10', mrp: '100.0000', amount: '30.00' } as any],
    });
    expect(html).toContain('"mrp":"100.00"');
    expect(html).not.toContain('100.0000');
  });
});
