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

/** Format a number as en-IN ₹ with 2 decimals (matches Reports.tsx). */
export const formatCurrency = (amount: number): string => {
  const { SYMBOL, LOCALE, FRACTION_DIGITS } = ADMIN_REPORTS_CONSTANTS.CURRENCY;
  return `${SYMBOL}${amount.toLocaleString(LOCALE, {
    minimumFractionDigits: FRACTION_DIGITS,
    maximumFractionDigits: FRACTION_DIGITS,
  })}`;
};

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

/** Default report date range = last N days inclusive of today. */
export const defaultDateRange = (): [Dayjs, Dayjs] => {
  const end = dayjs();
  const start = end.subtract(ADMIN_REPORTS_CONSTANTS.DEFAULTS.RANGE_DAYS - 1, 'day');
  return [start, end];
};

/** Stringify a value safely for CSV cells. */
export const csvString = (val: string | number | null | undefined): string =>
  val === null || val === undefined ? '' : String(val);
