import {
  formatCurrency,
  formatWholeCurrency,
  formatSignedCurrency,
  formatQuantity,
  csvQuantity,
  utcCalendarDate,
} from '../reportFormat';

describe('money formatting', () => {
  it('puts the minus sign before the rupee symbol', () => {
    expect(formatCurrency(-380)).toBe('-₹380.00');
    expect(formatCurrency(-123456.5)).toBe('-₹1,23,456.50');
    expect(formatWholeCurrency(-1500)).toBe('-₹1,500');
  });

  it('leaves positives unchanged and never shows "-₹0.00" for values that round to zero', () => {
    expect(formatCurrency(1008)).toBe('₹1,008.00');
    expect(formatCurrency(-0.004)).toBe('₹0.00');
    expect(formatWholeCurrency(-0.4)).toBe('₹0');
  });

  it('keeps the explicit sign of formatSignedCurrency', () => {
    expect(formatSignedCurrency(-0.4)).toBe('-₹0.40');
    expect(formatSignedCurrency(0.1)).toBe('+₹0.10');
  });
});

describe('quantity formatting', () => {
  it('shows whole quantities without decimals, with en-IN grouping on screen and none in CSV', () => {
    expect(formatQuantity(16543)).toBe('16,543');
    expect(formatQuantity(1234567)).toBe('12,34,567');
    expect(csvQuantity(16543)).toBe('16543');
    expect(formatQuantity(0)).toBe('0');
    expect(csvQuantity(0)).toBe('0');
  });

  it('keeps negatives (a data-problem signal) and never shows "-0"', () => {
    expect(formatQuantity(-1250)).toBe('-1,250');
    expect(csvQuantity(-4)).toBe('-4');
    expect(formatQuantity(-0)).toBe('0');
    expect(csvQuantity(-0.001)).toBe('0');
  });

  it('keeps a genuine fraction visible (up to 2 decimals) instead of rounding it away', () => {
    expect(formatQuantity(2.5)).toBe('2.5');
    expect(formatQuantity(1234.25)).toBe('1,234.25');
    expect(csvQuantity(1234.25)).toBe('1234.25');
    expect(csvQuantity(0.004)).toBe('0');
  });
});

describe('utcCalendarDate', () => {
  it('returns the UTC calendar date of a UTC-midnight timestamp, whatever the local zone', () => {
    expect(utcCalendarDate('2026-12-28T00:00:00.000Z')).toBe('2026-12-28');
    expect(utcCalendarDate('2026-12-28')).toBe('2026-12-28');
  });

  it('returns null for empty or invalid values', () => {
    expect(utcCalendarDate(null)).toBeNull();
    expect(utcCalendarDate('')).toBeNull();
    expect(utcCalendarDate('not a date')).toBeNull();
  });
});
