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
    ADMINISTRATOR: 'Administrator',
    EDITOR: 'Editor',
    VIEWER: 'Viewer',
  },
} as const;

export type UsersLabels = typeof USERS_LABELS;

