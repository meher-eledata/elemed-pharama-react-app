import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  COMPLIANCE_CONSTANTS,
  type ComplianceDocumentState,
} from '../../config/constants/Compliance.constants';
import { COMPLIANCE_LABELS } from '../../config/label/Compliance.labels';
import type { ComplianceVersion } from '../../redux/slices/complianceApi';

// Explicit-format parsing so a DATEONLY 'YYYY-MM-DD' is read in LOCAL time — the
// native Date parser reads it as UTC and shifts the day back for us (the invoice
// one-day-shift bug).
dayjs.extend(customParseFormat);

const L = COMPLIANCE_LABELS;
const C = COMPLIANCE_CONSTANTS;

export const parseApiDate = (value: string | null | undefined): Dayjs | null => {
  if (!value) return null;
  const parsed = dayjs(value, C.API_DATE_FORMAT, true);
  return parsed.isValid() ? parsed : null;
};

export const toApiDate = (value: Dayjs | null): string | null =>
  value && value.isValid() ? value.format(C.API_DATE_FORMAT) : null;

export const formatApiDate = (value: string | null | undefined): string => {
  const parsed = parseApiDate(value);
  return parsed ? parsed.format(C.DISPLAY_DATE_FORMAT) : L.DASH;
};

export const formatTimestamp = (value: string | null | undefined): string => {
  if (!value) return L.DASH;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(C.DISPLAY_DATETIME_FORMAT) : L.DASH;
};

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return L.DASH;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export interface DerivedComplianceState {
  state: ComplianceDocumentState;
  label: string;
  // Days until expiry (>= 0; 0 = expires TODAY) or null when there is no date.
  daysUntilExpiry: number | null;
}

/**
 * Lifecycle state of a document, derived from its CURRENT version only.
 *
 * Mirrors the backend's state machine (services/notifications/complianceSources):
 * no version -> no expiry (valid_to NULL means never expires) -> expired (STRICTLY
 * past; valid THROUGH today is not expired) -> expiring (within the org's lead
 * days) -> valid. `daysUntilExpiry === 0` is the most urgent non-expired value, so
 * it is never truthiness-checked.
 */
export const deriveComplianceState = (
  currentVersion: ComplianceVersion | null | undefined,
  leadDays: number[] = [...C.DEFAULT_LEAD_DAYS],
): DerivedComplianceState => {
  if (!currentVersion) {
    return { state: 'NO_VERSION', label: L.STATE.NO_VERSION, daysUntilExpiry: null };
  }
  const validTo = parseApiDate(currentVersion.valid_to);
  if (!validTo) {
    return { state: 'NO_EXPIRY', label: L.STATE.NO_EXPIRY, daysUntilExpiry: null };
  }

  const days = validTo.startOf('day').diff(dayjs().startOf('day'), 'day');
  if (days < 0) {
    return { state: 'EXPIRED', label: L.STATE.EXPIRED(-days), daysUntilExpiry: null };
  }

  const label = days === 0 ? L.STATE.EXPIRES_TODAY : L.STATE.EXPIRES_IN(days);
  const effective = leadDays.length ? leadDays : [...C.DEFAULT_LEAD_DAYS];
  const outermost = Math.max(...effective);
  const innermost = Math.min(...effective);
  if (days <= innermost) return { state: 'EXPIRING_INNER', label, daysUntilExpiry: days };
  if (days <= outermost) return { state: 'EXPIRING', label, daysUntilExpiry: days };
  return { state: 'VALID', label, daysUntilExpiry: days };
};

// Client-side pre-check mirroring the server's mime-AND-extension rule. Returns an
// error message, or null when the file is acceptable.
export const validateComplianceFile = (file: File): string | null => {
  if (file.size > C.UPLOAD.MAX_BYTES) return L.VALIDATION.FILE_TOO_LARGE;
  const extension = (file.name.split('.').pop() ?? '').toLowerCase();
  const extensionOk = (C.UPLOAD.EXTENSIONS as readonly string[]).includes(extension);
  // An empty type is left to the server (some browsers omit it); a WRONG one is rejected here.
  const mimeOk = !file.type || (C.UPLOAD.MIME_TYPES as readonly string[]).includes(file.type);
  return extensionOk && mimeOk ? null : L.VALIDATION.FILE_TYPE;
};

// Strip path separators / control chars so a filename from the API can't influence
// the saved download path (same guard as UserProfile / HistoricalData).
export const sanitizeFileName = (name: string): string => {
  const base = (name || 'download').split(/[\\/]/).pop() || 'download';
  // eslint-disable-next-line no-control-regex
  return base.replace(/[\u0000-\u001f<>:\"|?*]/g, '_').trim() || 'download';
};

export const triggerBlobDownload = (blob: Blob, fileName: string): void => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = sanitizeFileName(fileName);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};
