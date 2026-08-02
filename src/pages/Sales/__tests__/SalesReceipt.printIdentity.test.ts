import { buildPrintIdentity, generatePrintHTML } from '../SalesReceipt.utils';
import { SALES_RECEIPT_LABELS } from '../../../config/label/SalesReceipt.labels';
import type { Location } from '../../../redux/slices/orgApi';

const location: Location = {
  id: 1,
  name: 'Health City Pharmacy',
  code: 'HC',
  type: 'pharmacy',
  gstin: '22AAAAA0000A1Z5',
  drug_license_1: 'DL-20-1111',
  drug_license_2: 'DL-21-2222',
  address: '12 Main Road, Springfield, 530001',
  phone: '040-1234567',
  status: 1,
};

describe('buildPrintIdentity', () => {
  it('builds the header from the current location, with the org name as subtitle', () => {
    const identity = buildPrintIdentity(location, 'Acme Health Org');

    expect(identity.name).toBe('Health City Pharmacy');
    expect(identity.subtitle).toBe('Acme Health Org');
    expect(identity.addressLines).toEqual([
      '12 Main Road, Springfield, 530001',
      'DL No: DL-20-1111, DL-21-2222',
      'GSTIN No: 22AAAAA0000A1Z5',
      '(M): 040-1234567',
    ]);
  });

  it('falls back to the organization name with blank fields when no location', () => {
    const identity = buildPrintIdentity(null, 'Acme Health Org');

    expect(identity).toEqual({ name: 'Acme Health Org', subtitle: '', addressLines: [] });
  });

  it('omits absent detail lines and a single missing drug license', () => {
    const identity = buildPrintIdentity(
      { ...location, gstin: null, phone: null, drug_license_2: null },
      'Acme Health Org'
    );

    expect(identity.addressLines).toEqual([
      '12 Main Road, Springfield, 530001',
      'DL No: DL-20-1111',
    ]);
  });

  it('drops the subtitle when the location and org share a name, or no org name', () => {
    expect(buildPrintIdentity({ ...location, name: 'Acme Health Org' }, 'Acme Health Org').subtitle).toBe('');
    expect(buildPrintIdentity(location, null).subtitle).toBe('');
  });

  it('is fully blank with neither a location nor an organization', () => {
    expect(buildPrintIdentity(null, null)).toEqual({ name: '', subtitle: '', addressLines: [] });
  });
});

describe('generatePrintHTML header identity', () => {
  const baseData = {
    customerName: 'John Doe',
    customerMobile: '1234567890',
    customerCity: '',
    doctorName: 'Dr. Smith',
    doctorMobile: '',
    doctorEmail: '',
    paymentMode: 'Cash',
    insuranceCompany: '',
    invoiceNumber: 'INV001',
    invoiceDate: '01/01/2026',
    salesItems: [],
    totalValue: '0.00',
    totalDiscount: '0.00',
    taxAmount: '0.00',
    totalPayableAmount: '0',
    labels: SALES_RECEIPT_LABELS,
  };

  it('prints the location identity and contains no hardcoded pharmacy', () => {
    const html = generatePrintHTML({
      ...baseData,
      identity: buildPrintIdentity(location, 'Acme Health Org'),
    });

    expect(html).toContain('Health City Pharmacy');
    expect(html).toContain('(Acme Health Org)');
    expect(html).toContain('12 Main Road, Springfield, 530001');
    expect(html).toContain('DL No: DL-20-1111, DL-21-2222');
    expect(html).toContain('GSTIN No: 22AAAAA0000A1Z5');
    expect(html).toContain('(M): 040-1234567');
    expect(html).not.toMatch(/ELITE PHARMACY|SUSRUTA|37AAQCS3213C2ZH/i);
  });

  it('renders only the org name when no location identity exists', () => {
    const html = generatePrintHTML({
      ...baseData,
      identity: buildPrintIdentity(null, 'Acme Health Org'),
    });

    expect(html).toContain('Acme Health Org');
    expect(html).not.toContain('GSTIN No:');
    expect(html).not.toContain('DL No:');
  });
});
