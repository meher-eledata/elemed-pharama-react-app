import type { AppointmentStatus, AppointmentType, AppointmentSource } from '../../redux/slices/outpatientApi';

// Shared constants for the Outpatient (OPD) module: option lists, chip colors,
// date formats and layout tokens. Theme primary is #5C17E5.
export const OPD_CONSTANTS = {
  THEME: { PRIMARY: '#5C17E5', PRIMARY_HOVER: '#4C14CC' },
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
  API_DATE_FORMAT: 'YYYY-MM-DD',
  PAGINATION: { ROWS_PER_PAGE: 10 },
  LAYOUT: { PAGE_PADDING: 3, PAGE_GAP: 2 },
  // Live-queue polling cadence (ms) — keeps the queue feeling real-time.
  QUEUE_POLL_MS: 12000,
  AVAILABILITY: { DEFAULT_SLOT_MIN: 15, DEFAULT_START: '09:00', DEFAULT_END: '17:00' },
  WEEKDAY_OPTIONS: [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ],
  STATUS_OPTIONS: [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'checked_in', label: 'Checked in' },
    { value: 'in_consultation', label: 'In consultation' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no_show', label: 'No show' },
  ] as { value: AppointmentStatus; label: string }[],
  TYPE_OPTIONS: [
    { value: 'consultation', label: 'Consultation' },
    { value: 'service', label: 'Service' },
  ] as { value: AppointmentType; label: string }[],
  SOURCE_OPTIONS: [
    { value: 'booked', label: 'Booked' },
    { value: 'walk_in', label: 'Walk-in' },
  ] as { value: AppointmentSource; label: string }[],
  GENDER_OPTIONS: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ],
  // Allowed status transitions FROM each status (mirror of the backend whitelist).
  STATUS_TRANSITIONS: {
    scheduled: ['checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show'],
    checked_in: ['scheduled', 'in_consultation', 'completed', 'cancelled', 'no_show'],
    in_consultation: ['checked_in', 'completed', 'cancelled', 'no_show'],
    completed: ['in_consultation'],
    cancelled: ['scheduled'],
    no_show: ['scheduled'],
  } as Record<AppointmentStatus, AppointmentStatus[]>,
  // Chip palette keyed by appointment status.
  STATUS_CHIP: {
    scheduled: { bg: '#EDE9FE', color: '#5C17E5' },
    checked_in: { bg: '#DBEAFE', color: '#1D4ED8' },
    in_consultation: { bg: '#FEF3C7', color: '#B45309' },
    completed: { bg: '#DCFCE7', color: '#15803D' },
    cancelled: { bg: '#FEE2E2', color: '#B91C1C' },
    no_show: { bg: '#F3F4F6', color: '#6B7280' },
  } as Record<string, { bg: string; color: string }>,
};
