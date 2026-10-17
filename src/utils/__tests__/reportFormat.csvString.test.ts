import { csvString } from '../reportFormat';

describe('csvString', () => {
  it('renders null/undefined as empty and leaves ordinary text and numbers alone', () => {
    expect(csvString(null)).toBe('');
    expect(csvString(undefined)).toBe('');
    expect(csvString('Amoxicillin 500mg')).toBe('Amoxicillin 500mg');
    expect(csvString(12)).toBe('12');
    expect(csvString('a=b')).toBe('a=b');
  });

  it.each(['=HYPERLINK("http://x","y")', '+1+1', '-1+cmd', '@SUM(A1)', '\tdata', '\rdata', '-', '--', '-4,000.00'])(
    'prefixes an apostrophe to formula-like text %j',
    (val) => {
      expect(csvString(val)).toBe(`'${val}`);
    }
  );

  it.each(['-4.00', '-12', '0', '42.5', -4, -0.5])('keeps the plain number %j unchanged', (val) => {
    expect(csvString(val)).toBe(String(val));
  });
});
