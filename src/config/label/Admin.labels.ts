export const ADMIN_LABELS = {
  PAGE_TITLE: 'Hello, Guest!',
  SUBTITLE: 'Access key administrative functions and system insights.',
  SECTIONS: {
    DASHBOARD: {
      TITLE: 'Pharmacist access',
      DESC: 'Switch to pharmacist access and operate pharmacy functions directly',
      ACTION: 'Go to Pharmacist access',
    },
    USER_MGMT: {
      TITLE: 'User Account Management',
      DESC: 'Manage user profiles, roles & permissions',
      ACTION: 'Manage Users',
    },
    REPORTS: {
      TITLE: 'Reports',
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
    SUPPLIER_CREDIT: {
      TITLE: 'Supplier Credit',
      DESC: 'Review supplier credit transactions and post manual adjustments.',
      ACTION: 'Manage Supplier Credit',
    },
    LOCATIONS: {
      TITLE: 'Locations',
      DESC: 'Create and manage the pharmacy locations of your organization.',
      ACTION: 'Manage Locations',
    },
  },
} as const;

export type AdminLabels = typeof ADMIN_LABELS;


