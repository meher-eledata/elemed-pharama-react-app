export const LOCATION_LABELS = {
  SWITCHER: {
    // Shown on the top-bar switcher while no location is selected.
    PLACEHOLDER: 'Select location',
    DIALOG_TITLE: 'Select a location',
    DIALOG_SUBTITLE:
      'Your organization has multiple locations. Pick the one you are working at.',
  },
  // Friendly surface for the backend 400 { error: 'Location required' }.
  LOCATION_REQUIRED_TOAST:
    'Please select a location from the switcher in the top bar, then try again.',
  ADMIN: {
    PAGE_TITLE: 'Locations',
    SUBTITLE: 'Manage the pharmacy locations of your organization.',
    ADD_BUTTON: 'Add Location',
    TABLE: {
      NAME: 'Name',
      CODE: 'Code',
      GSTIN: 'GSTIN',
      PHONE: 'Phone',
      STATUS: 'Status',
      ACTIONS: 'Actions',
    },
    STATUS: {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
    },
    EDIT_BUTTON: 'Edit',
    DIALOG: {
      CREATE_TITLE: 'Add Location',
      EDIT_TITLE: 'Edit Location',
      FIELDS: {
        NAME: 'Name',
        CODE: 'Code',
        TYPE: 'Type',
        GSTIN: 'GSTIN',
        DRUG_LICENSE_1: 'Drug License 1',
        DRUG_LICENSE_2: 'Drug License 2',
        ADDRESS: 'Address',
        PHONE: 'Phone',
        ACTIVE: 'Active',
      },
      VALIDATION: {
        NAME_REQUIRED: 'Name is required.',
      },
      CANCEL: 'Cancel',
      SAVE: 'Save',
    },
    MESSAGES: {
      LOADING: 'Loading locations…',
      ERROR: 'Failed to load locations.',
      SAVE_ERROR: 'Failed to save location.',
      EMPTY: 'No locations found.',
      CREATE_SUCCESS: 'Location created.',
      UPDATE_SUCCESS: 'Location updated.',
    },
  },
} as const;
