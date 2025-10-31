export const ADMIN_LABELS = {
  PAGE_TITLE: 'Welcome',
  SUBTITLE: 'Access key administrative functions and system insights.',
  SECTIONS: {
    USER_MGMT: {
      TITLE: 'User Account Management',
      DESC: 'Oversee user profiles, roles, permissions, and access controls within the system.',
      ACTION: 'Manage Users',
    },
    REPORTS: {
      TITLE: 'System Performance Reports',
      DESC: 'Access detailed analytics on system usage, performance metrics, and activity trends.',
      ACTION: 'View Reports',
    },
    AUDIT: {
      TITLE: 'User Activity Log',
      DESC: 'Review a comprehensive log of all changes and activities related to user accounts.',
      ACTION: 'View Log',
    },
    SETTINGS: {
      TITLE: 'System Settings',
      DESC: 'Configure application-wide parameters, default preferences, and operational controls.',
      ACTION: 'Adjust Settings',
    },
  },
} as const;

export type AdminLabels = typeof ADMIN_LABELS;


