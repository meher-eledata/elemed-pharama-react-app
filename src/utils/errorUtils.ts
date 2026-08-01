import { LOCATION_LABELS } from '../config/label/Locations.labels';

interface ApiError {
  data?: {
    message?: string;
    error?: string;
    detail?: string;
    fields?: string[];
    details?: Array<{ field: string; message: string }>;
  } | string;
  message?: string;
  status?: number;
}

export const extractErrorMessage = (
  error: unknown,
  defaultMessage: string = 'An error occurred. Please try again.'
): string => {
  if (!error) {
    return defaultMessage;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    if (import.meta.env.PROD) {
      return defaultMessage;
    }
    return error.message || defaultMessage;
  }

  const apiError = error as ApiError;

  if (apiError?.data) {
    if (typeof apiError.data === 'string') {
      return apiError.data;
    }

    if (typeof apiError.data === 'object') {
      if (apiError.data.message) {
        return apiError.data.message;
      }

      if (apiError.data.error) {
        // Multi-location: the backend rejects pharmacy writes without a
        // location header (400 { error: 'Location required' }). Tell the user
        // exactly what to do rather than echoing the raw error.
        if (apiError.data.error === 'Location required') {
          return LOCATION_LABELS.LOCATION_REQUIRED_TOAST;
        }

        let errorMessage = apiError.data.error;

        if (apiError.data.fields && Array.isArray(apiError.data.fields)) {
          errorMessage += ` Fields: ${apiError.data.fields.join(', ')}`;
        }

        if (apiError.data.details && Array.isArray(apiError.data.details)) {
          const detailMessages = apiError.data.details
            .map((d) => `${d.field}: ${d.message}`)
            .join(', ');
          errorMessage += ` Details: ${detailMessages}`;
        }

        return errorMessage;
      }

      if (apiError.data.detail) {
        return apiError.data.detail;
      }
    }
  }

  if (apiError?.message) {
    return apiError.message;
  }

  if (apiError?.status) {
    switch (apiError.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication failed. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return defaultMessage;
    }
  }

  return defaultMessage;
};

export const logError = (error: unknown, context?: string): void => {
};

