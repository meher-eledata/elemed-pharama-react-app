import { generatePrintHTML } from '../SalesReceipt.utils';
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
