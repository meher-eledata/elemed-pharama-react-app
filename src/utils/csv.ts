/**
 * The ONE CSV path for every export in the app.
 *
 * react-csv is deliberately not used: it wraps cells in quotes but never doubles embedded
 * quotes (a product named `Crepe Bandage 4"` broke the row, and `x","=1+2` smuggled an
 * unguarded formula into its own cell). Here every cell is RFC 4180-escaped and text cells
 * are guarded against spreadsheet formula injection.
 */

export type CsvCell = string | number | null | undefined;
export type CsvRecord = Record<string, CsvCell>;

// Spreadsheet apps evaluate a cell starting with one of these as a formula.
const FORMULA_START = /^[=+\-@\t\r]/;
// ...but plain numbers ("-4.00", "-12") and the lone "-" placeholder are not formulas.
const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

/** Prefix an apostrophe to text a spreadsheet would run as a formula (it then shows as text). */
export const guardCsvText = (text: string): string =>
  FORMULA_START.test(text) && text !== '-' && !PLAIN_NUMBER.test(text) ? `'${text}` : text;

const escapeCell = (cell: CsvCell): string => {
  const text = cell === null || cell === undefined ? '' : typeof cell === 'number' ? String(cell) : guardCsvText(cell);
  return `"${text.replace(/"/g, '""')}"`;
};

/**
 * RFC 4180 CSV text (every cell quoted, quotes doubled, CRLF rows). Columns are `headers`
 * in order, defaulting to every key seen across the records in first-seen order (so a short
 * totals row is fine); a record's missing key is an empty cell.
 */
export const toCsv = (
  records: CsvRecord[],
  headers: string[] = [...new Set(records.flatMap((r) => Object.keys(r)))]
): string =>
  [headers, ...records.map((r) => headers.map((h) => r[h]))]
    .map((row) => row.map(escapeCell).join(','))
    .join('\r\n');

const REVOKE_DELAY_MS = 60_000;

/** Build the CSV and save it as `filename` (UTF-8 with BOM so Excel keeps ₹ and non-ASCII names). */
export const downloadCsv = (filename: string, records: CsvRecord[], headers?: string[]): void => {
  const blob = new Blob(['\uFEFF', toCsv(records, headers)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke late: Safari reads the blob asynchronously after click() and an early revoke can
  // fail or empty the download. 60 s matches FileSaver.js / SheetJS.
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
};
