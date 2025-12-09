export const ADMIN_LABELS = {
  PAGE_TITLE: 'Hello, Guest!',
  SUBTITLE: 'Access key administrative functions and system insights..',
  SECTIONS: {
    DASHBOARD: {
      TITLE: 'Main Dashboard',
      DESC: 'Access the overall application dashboard with comprehensive insights and metrics.',
      ACTION: 'Go to Dashboard',
    },
    USER_MGMT: {
      TITLE: 'User Account Management',
      DESC: 'Oversee user profiles, roles, permissions, s controls within the system.',
      ACTION: 'Manage Users',
    },
    REPORTS: {
      TITLE: 'System Performance Reports',
      DESC: 'Access detailed analytics on system usage, p e metrics, and activity trends.',
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


