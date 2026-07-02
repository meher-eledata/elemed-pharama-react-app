export const USER_PROFILE_LABELS = {
  PAGE_TITLE: 'User Profile',
  DASH: '—',
  HEADER: {
    USERNAME_PREFIX: '@',
  },
  ERROR: {
    PROFILE: 'Unable to load your profile. Please try again later.',
    ACTIVITY: 'Unable to load recent activity. Please try again later.',
  },
  EDIT: {
    BUTTON: 'Edit profile',
    SAVE: 'Save',
    CANCEL: 'Cancel',
    SAVING: 'Saving…',
    SUCCESS: 'Profile updated successfully.',
    ERROR: 'Failed to update profile. Please try again.',
    FIRST_NAME: 'First name',
    LAST_NAME: 'Last name',
    MOBILE: 'Mobile',
  },
  SECTIONS: {
    ACCOUNT: {
      TITLE: 'Account',
      EMAIL: 'Email',
      MEMBER_SINCE: 'Member since',
      LAST_LOGIN: 'Last login',
    },
    CONTACT: {
      TITLE: 'Contact',
      MOBILE: 'Mobile',
      ADDRESS_LINE1: 'Address line 1',
      ADDRESS_LINE2: 'Address line 2',
      CITY: 'City',
      STATE: 'State',
      POSTAL_CODE: 'Postal code',
      COUNTRY: 'Country',
    },
    IDENTITY: {
      TITLE: 'Identity Document',
      DOCUMENT_TYPE: 'Document type',
      DOCUMENT_NUMBER: 'Document number',
    },
    RECENT_ACTIVITY: {
      TITLE: 'Recent Activity',
      EMPTY: 'No recent activity.',
      COL_MODULE: 'Module',
      COL_EVENT_TYPE: 'Event',
      COL_EVENT_TIME: 'Time',
      COL_EVENT_DETAILS: 'Details',
    },
  },
} as const;

export type UserProfileLabels = typeof USER_PROFILE_LABELS;
