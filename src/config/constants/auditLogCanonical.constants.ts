// Canonical, fixed dropdown lists + raw→canonical display maps for the Audit / Activity Log
// (src/pages/Admin/AuditLog.tsx). These replace the old data-derived getUnique* memos so the
// filter options are stable and the visible (mapped) values agree with what the filters match.
//
// NOTE on the filename: the task asked for `auditLog.constants.ts`, but this repo already has
// `AuditLog.constants.ts` (page styling/layout tokens). On a case-insensitive filesystem those two
// names collide, so this canonical config lives in a distinctly-named file instead.
//
// Mapping rule for modules/event types: unknown/unmapped raw values fall back to the RAW value
// (via mapModule / mapEventType) so nothing silently disappears from the table.

// ── Module ────────────────────────────────────────────────────────────────────
export const CANONICAL_MODULES = [
  'Sales',
  'Receive',
  'Master',
  'Inventory',
  'Admin',
  'Reports',
  'Historical Files',
  'System Settings',
  'Authentication',
] as const;

// Raw backend `module` → canonical display label.
export const MODULE_DISPLAY_MAP: Record<string, string> = {
  Sale: 'Sales',
  Receipt: 'Receive',
  Supplier: 'Master',
  Doctor: 'Master',
  Customer: 'Master',
  Product: 'Master',
  'Master Data': 'Master',
  Inventory: 'Inventory',
  Admin: 'Admin',
  Report: 'Reports',
  'Historical File': 'Historical Files',
  'System Settings': 'System Settings',
  Authentication: 'Authentication',
};

// ── Event type ────────────────────────────────────────────────────────────────
export const CANONICAL_EVENT_TYPES = [
  'Create',
  'Edit/Update',
  'Submit',
  'Delete',
  'Download',
  'Upload',
  'Disable',
  'Enable',
  'Login',
  'Logout',
  'Return',
  'Role Change',
  'Activate',
  'Adjustment',
  'Payment',
] as const;

// Raw backend `event_type` → canonical display label.
export const EVENT_TYPE_DISPLAY_MAP: Record<string, string> = {
  Create: 'Create',
  'User Creation': 'Create',
  Edit: 'Edit/Update',
  Submit: 'Submit',
  Delete: 'Delete',
  Download: 'Download',
  Upload: 'Upload',
  'User Disabled': 'Disable',
  'User Enabled': 'Enable',
  Login: 'Login',
  Logout: 'Logout',
  Return: 'Return',
  'User Role Changed': 'Role Change',
  'User Activation': 'Activate',
  'Inventory Adjustment': 'Adjustment',
  'Payment Added': 'Payment',
  'Payment Updated': 'Payment',
  'Payment Voided': 'Payment',
};

// ── Role ──────────────────────────────────────────────────────────────────────
// Backend `role` is an INTEGER (0=Admin, 1=Pharmacist) or null for system/unmatched rows.
export const ROLE_FILTER_OPTIONS: string[] = ['Admin', 'Pharmacist'];

const ROLE_BY_KEY: Record<string, string> = {
  '0': 'Admin',
  '1': 'Pharmacist',
};

// Fixed Module/Event-type dropdown option arrays (mutable copies for MUI props).
export const MODULE_FILTER_OPTIONS: string[] = [...CANONICAL_MODULES];
export const EVENT_TYPE_FILTER_OPTIONS: string[] = [...CANONICAL_EVENT_TYPES];

/** Map a raw backend module to its canonical label; unknown → raw value (empty → ''). */
export const mapModule = (raw: unknown): string => {
  const key = String(raw ?? '');
  return MODULE_DISPLAY_MAP[key] ?? key;
};

/** Map a raw backend event_type to its canonical label; unknown → raw value (empty → ''). */
export const mapEventType = (raw: unknown): string => {
  const key = String(raw ?? '');
  return EVENT_TYPE_DISPLAY_MAP[key] ?? key;
};

/**
 * Map a raw role (integer 0/1, the strings '0'/'1', or null/undefined) to a display label.
 * null/undefined/unmatched → 'System'.
 */
export const mapRole = (raw: unknown): string => {
  if (raw === null || raw === undefined || raw === '') return 'System';
  return ROLE_BY_KEY[String(raw)] ?? 'System';
};
