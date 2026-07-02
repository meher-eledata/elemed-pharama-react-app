export const HISTORICAL_DATA_CONSTANTS = {
  ROUTE: '/admin/historical-data',
  // Max upload size enforced by the backend (50MB). Mirrored client-side for a
  // friendly pre-check; the server remains the source of truth (400 on >50MB).
  MAX_FILE_BYTES: 50 * 1024 * 1024,
  // Accepted extensions / MIME hint for the file picker. Server canonicalizes
  // file_type from the extension; this only constrains the native dialog.
  ACCEPT:
    '.pdf,.csv,.xls,.xlsx,.jpg,.jpeg,.png,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png',
  ALLOWED_EXTENSIONS: ['pdf', 'csv', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'] as const,
  DATE_FORMAT: 'DD/MM/YYYY HH:mm',
} as const;

export type HistoricalDataConstants = typeof HISTORICAL_DATA_CONSTANTS;
