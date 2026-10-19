/**
 * Shared numeric / currency / date helpers for the admin reports.
 *
 * CRITICAL: All money / qty / rate / tax / value fields on the five report
 * endpoints are Postgres `numeric` columns serialized by the pg driver as JSON
 * STRINGS (e.g. "1234.50"), NOT numbers. ALWAYS pass these through `toNum`
 * before arithmetic, formatting, or sort comparison.
 */
import dayjs, { Dayjs } from 'dayjs';
import { ADMIN_REPORTS_CONSTANTS } from '../config/constants/AdminReports.constants';

/** Parse a numeric-string (or number / null / undefined) to a finite number; 0 on failure. */
export const toNum = (val: string | number | null | undefined): number => {
  if (val === null || val === undefined) return 0;
  const parsed = typeof val === 'string' ? parseFloat(val) : val;
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Sign prefix for a money value: '-' before the ₹ (never "₹-"), none when it rounds to zero. */
const moneySign = (amount: number, digits: number): string => (Number(amount.toFixed(digits)) < 0 ? '-' : '');

/** Format a number as en-IN ₹ with 2 decimals (matches Reports.tsx); negatives as "-₹380.00". */
export const formatCurrency = (amount: number): string => {
  const { SYMBOL, LOCALE, FRACTION_DIGITS } = ADMIN_REPORTS_CONSTANTS.CURRENCY;
  return `${moneySign(amount, FRACTION_DIGITS)}${SYMBOL}${Math.abs(amount).toLocaleString(LOCALE, {
    minimumFractionDigits: FRACTION_DIGITS,
    maximumFractionDigits: FRACTION_DIGITS,
  })}`;
};

/**
 * Format a WHOLE-RUPEE amount as en-IN ₹ with no decimals (no ".00" tail).
 * Use for invoice grand totals / their aggregates, which the backend now
 * rounds to whole rupees (2026-07-29 read-layer convention). Line-level and
 * tax-breakdown values stay 2dp via `formatCurrency`.
 */
export const formatWholeCurrency = (amount: number): string => {
  const { SYMBOL, LOCALE } = ADMIN_REPORTS_CONSTANTS.CURRENCY;
  return `${moneySign(amount, 0)}${SYMBOL}${Math.abs(amount).toLocaleString(LOCALE, { maximumFractionDigits: 0 })}`;
};

/**
 * Format a SIGNED ₹ amount with an explicit +/- sign and 2 decimals (paise matter),
 * e.g. +₹0.10 / -₹0.40. Used for round-off adjustments.
 */
export const formatSignedCurrency = (amount: number): string =>
  `${amount < 0 ? '-' : '+'}${formatCurrency(Math.abs(amount))}`;

/** Format a number as en-IN with 2 decimals (no currency symbol). */
export const formatNumber = (amount: number): string => {
  const { LOCALE, FRACTION_DIGITS } = ADMIN_REPORTS_CONSTANTS.CURRENCY;
  return amount.toLocaleString(LOCALE, {
    minimumFractionDigits: FRACTION_DIGITS,
    maximumFractionDigits: FRACTION_DIGITS,
  });
};

/** Format a count / integer with en-IN grouping, no decimals. */
export const formatCount = (amount: number): string =>
  amount.toLocaleString(ADMIN_REPORTS_CONSTANTS.CURRENCY.LOCALE, {
    maximumFractionDigits: 0,
  });

/**
 * Unit quantities are whole numbers in practice but arrive as numeric(14,2) strings: show no
 * decimals for integers, yet keep a genuine fraction visible (never round it away).
 * Rounding first also turns -0 / -0.001 into a plain "0".
 */
const QTY_FRACTION = { minimumFractionDigits: 0, maximumFractionDigits: 2 } as const;
const roundQty = (qty: number): number => Number(qty.toFixed(2)) + 0;

/** Format a unit quantity with en-IN grouping, e.g. 16543 => "16,543", 2.5 => "2.5", -4 => "-4". */
export const formatQuantity = (qty: number): string =>
  roundQty(qty).toLocaleString(ADMIN_REPORTS_CONSTANTS.CURRENCY.LOCALE, QTY_FRACTION);

/** CSV form of `formatQuantity`: no grouping, e.g. 16543 => "16543", 2.5 => "2.5". */
export const csvQuantity = (qty: number): string =>
  roundQty(qty).toLocaleString(ADMIN_REPORTS_CONSTANTS.CURRENCY.LOCALE, { ...QTY_FRACTION, useGrouping: false });

/** Format a percentage value (already a percent number, e.g. 12.5 => "12.50%"). */
export const formatPercent = (pct: number): string => `${pct.toFixed(2)}%`;

/** Convenience: parse a numeric-string then ₹-format in one call. */
export const currencyFromString = (val: string | number | null | undefined): string =>
  formatCurrency(toNum(val));

/** Display a "YYYY-MM-DD" (or any parseable) date as DD/MM/YYYY; '-' when empty. */
export const formatReportDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  if (dateString.includes('/')) return dateString;
  const d = dayjs(dateString);
  return d.isValid() ? d.format('DD/MM/YYYY') : '-';
};

/**
 * Calendar date ('YYYY-MM-DD') of a timestamp stored at UTC midnight, or null when empty/invalid.
 *
 * Batch expiry dates are written by the backend as `new Date('YYYY-MM-DD')` (UTC midnight)
 * into the timestamptz `inventory_batch.expiry_date` (receiveController / inventoryController),
 * so the API returns e.g. '2026-12-28T00:00:00.000Z'. The date the user entered is the UTC date
 * part. Do NOT format such values with local-time dayjs: west of UTC that shows the day before.
 */
export const utcCalendarDate = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

/** Default report date range = last N days inclusive of today. */
export const defaultDateRange = (): [Dayjs, Dayjs] => {
  const end = dayjs();
  const start = end.subtract(ADMIN_REPORTS_CONSTANTS.DEFAULTS.RANGE_DAYS - 1, 'day');
  return [start, end];
};
