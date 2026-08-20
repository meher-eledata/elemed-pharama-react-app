import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  COMPLIANCE_CONSTANTS,
  type ComplianceDocumentState,
} from '../../config/constants/Compliance.constants';
import { COMPLIANCE_LABELS } from '../../config/label/Compliance.labels';
import type {
  ComplianceCalendarItem,
  ComplianceVersion,
} from '../../redux/slices/complianceApi';

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

// --- Calendar helpers -------------------------------------------------------

// Maps a server CalendarItem state onto the same chip palette the documents page
// uses, so one document reads identically on both screens. EXPIRING splits on the
// item's own innermost lead day (the threshold at which the bell escalates).
export const calendarStateChipKey = (item: ComplianceCalendarItem): ComplianceDocumentState => {
  switch (item.state) {
    case 'EXPIRED':
      return 'EXPIRED';
    case 'EXPIRING':
      return item.daysUntilExpiry !== null && item.daysUntilExpiry <= item.innermost_lead_day
        ? 'EXPIRING_INNER'
        : 'EXPIRING';
    case 'VALID':
      return 'VALID';
    case 'NO_EXPIRY':
      return 'NO_EXPIRY';
    default:
      // MISSING / NO_VERSION — nothing filed, which is an action, not a date.
      return 'NO_VERSION';
  }
};

export const calendarStateLabel = (item: ComplianceCalendarItem): string => {
  switch (item.state) {
    case 'EXPIRED':
      return L.STATE.EXPIRED(item.daysPastExpiry ?? 0);
    case 'MISSING':
      return L.CALENDAR.NOT_FILED;
    case 'NO_VERSION':
      return L.STATE.NO_VERSION;
    case 'NO_EXPIRY':
      return L.CALENDAR.NO_EXPIRY_STATE;
    default:
      // daysUntilExpiry === 0 is "expires today" — the most urgent non-expired
      // value, so it is compared explicitly and never truthiness-checked.
      if (item.daysUntilExpiry === null) return L.DASH;
      return item.daysUntilExpiry === 0
        ? L.STATE.EXPIRES_TODAY
        : L.STATE.EXPIRES_IN(item.daysUntilExpiry);
  }
};

// A calendar row's display name: a type-only MISSING row has no title.
export const calendarItemTitle = (item: ComplianceCalendarItem): string =>
  item.title || item.type_name;

// Dated events keyed by 'YYYY-MM-DD' for the month grid's day slot.
export const groupByValidTo = (
  items: ComplianceCalendarItem[],
): Map<string, ComplianceCalendarItem[]> => {
  const map = new Map<string, ComplianceCalendarItem[]>();
  items.forEach((item) => {
    if (!item.valid_to) return;
    const bucket = map.get(item.valid_to);
    if (bucket) bucket.push(item);
    else map.set(item.valid_to, [item]);
  });
  return map;
};
