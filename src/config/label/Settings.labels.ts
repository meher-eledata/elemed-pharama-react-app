export const SETTINGS_LABELS = {
  PAGE_TITLE: 'System Settings',
  SECTIONS: {
    GENERAL: {
      TITLE: 'General Settings',
      DESC: 'Configure basic application preferences.',
    },
    USER_PRIVILEGE: {
      TITLE: 'User privilege mapping',
      DESC: 'Manage permissions for users',
    },
    DATA_PRIVACY: {
      TITLE: 'Data & Privacy',
      DESC: 'Manage your data and privacy settings.',
    },
    DAILY_REPORTS: {
      TITLE: 'Daily Report Recipients',
      DESC: 'Manage who receives automated daily activity reports.',
      ADD_PLACEHOLDER: 'Add new recipient email',
      ADD_BUTTON: 'Add Recipient',
    },
  },
  SAVE_BUTTON: 'Save Changes',
} as const;

export type SettingsLabels = typeof SETTINGS_LABELS;

