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
    ADMINISTRATOR: 'Administrator',
    PHARMACIST: 'Pharmacist',
    EDITOR: 'Editor',
    VIEWER: 'Viewer',
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

