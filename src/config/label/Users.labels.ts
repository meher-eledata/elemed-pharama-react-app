export const USERS_LABELS = {
  PAGE_TITLE: 'User Account Management',
  SUBTITLE: 'View, add, edit, and manage all user accounts within the system.',
  SEARCH_PLACEHOLDER: 'Search users...',
  ADD_BUTTON: 'Add New User',
  TABLE: {
    USER: 'USER',
    ROLE: 'ROLE',
    STATUS: 'STATUS',
    LAST_LOGIN: 'LAST LOGIN',
    ACTIONS: 'ACTIONS',
  },
  STATUS: {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    PENDING: 'Pending',
  },
  ROLES: {
    ADMIN: 'Admin',
    PHARMACIST: 'Pharmacist',
  },
  LAST_LOGIN: {
    NEVER: 'Never',
  },
  MESSAGES: {
    LOADING: 'Loading users...',
    ERROR: 'Failed to load users. Please try again.',
  },
  ACCOUNT_STATUS: {
    DISABLE_TITLE: 'Disable account',
    ENABLE_TITLE: 'Enable account',
    DISABLE_CONFIRM: 'Are you sure you want to disable this account',
    ENABLE_CONFIRM: 'Are you sure you want to enable this account',
    YES: 'Yes',
    NO: 'No',
    DISABLE_TOOLTIP: 'Disable account',
    ENABLE_TOOLTIP: 'Enable account',
    DISABLE_SUCCESS: 'Account disabled.',
    ENABLE_SUCCESS: 'Account enabled.',
    DISABLE_ERROR: 'Failed to disable account. Please try again.',
    ENABLE_ERROR: 'Failed to enable account. Please try again.',
  },
} as const;

export type UsersLabels = typeof USERS_LABELS;

// Normalizes a raw backend role (integer 0/1, the strings '0'/'1', or 'admin'/'pharmacist' in any
// case) to its canonical display label so role chips match the adjacent edit dropdown. Unknown
// values fall back to title-case.
export const getRoleLabel = (raw: unknown): string => {
  const key = String(raw ?? '').toLowerCase();
  const map: Record<string, string> = {
    '0': USERS_LABELS.ROLES.ADMIN,
    admin: USERS_LABELS.ROLES.ADMIN,
    '1': USERS_LABELS.ROLES.PHARMACIST,
    pharmacist: USERS_LABELS.ROLES.PHARMACIST,
  };
  return map[key] ?? (key ? key.charAt(0).toUpperCase() + key.slice(1) : '');
};

