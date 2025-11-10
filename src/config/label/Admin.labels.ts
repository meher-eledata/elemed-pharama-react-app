export const ADMIN_LABELS = {
  PAGE_TITLE: 'Hello, Guest!',
  SUBTITLE: 'Access your system insights.',
  SECTIONS: {
    USER_MGMT: {
      TITLE: 'User Accounts',
      DESC: 'Oversee user profiles, roles, permissions controls within system.',
      ACTION: 'Manage Users',
    },
    REPORTS: {
      TITLE: 'Performance',
      DESC: 'Access detailed analytics on perform usage on activity trends.',
      ACTION: 'View Reports',
    },
    AUDIT: {
      TITLE: 'Activity Log',
      DESC: 'Access comprehensive log of all changes, activities, and activity trends.',
      ACTION: 'Manage Users',
    },
    SETTINGS: {
      TITLE: 'System Settings',
      DESC: 'Access detailed analytics on system usage, parameters, and activity trends.',
      ACTION: 'View Reports',
    },
  },
} as const;

export type AdminLabels = typeof ADMIN_LABELS;


