export const ORG_LABELS = {
  DASHBOARD: {
    PAGE_TITLE: 'Org Management',
    SUBTITLE: 'Manage roles, modules and your organization profile.',
    SECTIONS: {
      ROLES: {
        TITLE: 'Role Management',
        DESC: 'Assign org and per-module roles to your team members.',
        ACTION: 'Manage Roles',
      },
      MODULES: {
        TITLE: 'Modules',
        DESC: 'Enable or disable optional product modules for your organization.',
        ACTION: 'Manage Modules',
      },
      SETTINGS: {
        TITLE: 'Organization Settings',
        DESC: 'Update your organization name, country, timezone and currency.',
        ACTION: 'Open Settings',
      },
    },
  },
  MODULES: {
    PAGE_TITLE: 'Modules',
    SUBTITLE: 'Enable or disable optional product modules for your organization.',
    CORE_TAG: 'Core',
    LOADING: 'Loading modules…',
    LOAD_ERROR: 'Failed to load modules.',
    TOGGLE_ERROR: 'Failed to update module.',
    ENABLED_SUCCESS: (label: string) => `${label} enabled.`,
    DISABLED_SUCCESS: (label: string) => `${label} disabled.`,
  },
  SETTINGS: {
    PAGE_TITLE: 'Organization Settings',
    SUBTITLE: 'Your organization profile.',
    LOADING: 'Loading organization…',
    LOAD_ERROR: 'Failed to load organization.',
    SAVE_SUCCESS: 'Organization updated.',
    SAVE_ERROR: 'Failed to update organization.',
    READ_ONLY_NOTE: 'Only a superadmin can edit organization settings.',
    FIELDS: {
      NAME: 'Organization Name',
      SLUG: 'Slug',
      STATUS: 'Status',
      COUNTRY: 'Country',
      TIMEZONE: 'Timezone',
      CURRENCY: 'Currency',
    },
    SAVE_BUTTON: 'Save Changes',
  },
} as const;
