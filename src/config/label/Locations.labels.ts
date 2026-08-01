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
} as const;
