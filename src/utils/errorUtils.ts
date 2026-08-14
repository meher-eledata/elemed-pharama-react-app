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

// The 409 duplicate-document-number backstops raised by the org-scoped unique indexes on
// invoice_number / return_number / receipt_number. All four share one shape —
// { error: '<CODE>', message } — and one remedy: submit again, because the number is
// server-assigned and a retry allocates a fresh one. Discriminated on the CODE, never the
// message (the supplier-return wording differs from the other three).
const DUPLICATE_DOCUMENT_NUMBER_CODES = [
  'DUPLICATE_INVOICE_NUMBER',
  'DUPLICATE_RETURN_NUMBER',
  'DUPLICATE_RECEIPT_NUMBER',
];

// Returns the message to show for a duplicate-document-number 409, or null when the error
// is something else (so the caller falls through to its normal handling).
export const duplicateDocumentNumberMessage = (
  error: unknown,
  fallback: string = 'That document number is already used in this pharmacy. Please submit again — a new number will be issued.',
): string | null => {
  const data = (error as ApiError | undefined)?.data;
  if (!data || typeof data === 'string' || !data.error) return null;
  if (!DUPLICATE_DOCUMENT_NUMBER_CODES.includes(data.error)) return null;
  return data.message || fallback;
};

