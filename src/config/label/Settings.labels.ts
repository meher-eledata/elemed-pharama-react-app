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
      SEND_NOW_BUTTON: 'Send now',
      LOADING: 'Loading recipients...',
      EMPTY: 'No recipients yet. Add an email below.',
      LOAD_ERROR: 'Could not load recipients.',
      INVALID_EMAIL: 'Please enter a valid email address.',
      ADD_SUCCESS: 'Recipient added.',
      ADD_ERROR: 'Could not add recipient.',
      REMOVE_SUCCESS: 'Recipient removed.',
      REMOVE_ERROR: 'Could not remove recipient.',
      SEND_ERROR: 'Could not send the daily report.',
      SEND_SUCCESS: (sent: number) => `Sent to ${sent} recipient(s).`,
      SEND_SUCCESS_WITH_FAILED: (sent: number, failed: number) =>
        `Sent to ${sent} recipient(s), ${failed} failed.`,
    },
  },
  SAVE_BUTTON: 'Save Changes',
} as const;

export type SettingsLabels = typeof SETTINGS_LABELS;

