export const HISTORICAL_DATA_LABELS = {
  PAGE_TITLE: 'Historical Data',
  SUBTITLE:
    'Upload, browse, and download historical data files for the pharmacy.',
  UPLOAD_BUTTON: 'Upload File',
  UPLOADING: 'Uploading…',
  ALLOWED_HINT:
    'Allowed types: PDF, CSV, Excel (xls/xlsx), JPG, PNG. Maximum size 50MB.',
  BACK_BUTTON: 'Back to Admin',
  TABLE: {
    NAME: 'File Name',
    TYPE: 'Type',
    SIZE: 'Size',
    UPLOADED_AT: 'Uploaded',
    ACTIONS: 'Actions',
    DOWNLOAD: 'Download',
  },
  MESSAGES: {
    LOADING: 'Loading files…',
    EMPTY: 'No historical files uploaded yet.',
    ERROR: 'Failed to load historical files.',
    UPLOAD_SUCCESS: 'File uploaded successfully.',
    UPLOAD_ERROR: 'Failed to upload file. Please try again.',
    DOWNLOAD_ERROR: 'Failed to download file. Please try again.',
    FILE_TOO_LARGE: 'File is too large. Maximum allowed size is 50MB.',
    UNSUPPORTED_TYPE:
      'Unsupported file type. Allowed: PDF, CSV, Excel (xls/xlsx), JPG, PNG.',
  },
} as const;

export type HistoricalDataLabels = typeof HISTORICAL_DATA_LABELS;
