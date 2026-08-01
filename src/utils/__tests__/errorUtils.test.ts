import { extractErrorMessage, logError } from '../errorUtils';

// NOTE: In this jest setup `import.meta.env` is rewritten to `process.env`
// by jest.preprocessor.cjs, so `import.meta.env.PROD` reads `process.env.PROD`.
// It is undefined (falsy) by default, meaning the Error branch returns the
// real error message unless we explicitly set PROD.

const DEFAULT_MESSAGE = 'An error occurred. Please try again.';

describe('errorUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (process.env as any).PROD;
  });

  describe('extractErrorMessage', () => {
    it('returns the default message for null/undefined', () => {
      expect(extractErrorMessage(null)).toBe(DEFAULT_MESSAGE);
      expect(extractErrorMessage(undefined)).toBe(DEFAULT_MESSAGE);
    });

    it('returns a custom default message when provided for falsy errors', () => {
      expect(extractErrorMessage(undefined, 'Custom default')).toBe('Custom default');
    });

    it('returns the string itself when error is a string', () => {
      expect(extractErrorMessage('something broke')).toBe('something broke');
    });

    it('returns the message of an Error instance (non-prod)', () => {
      expect(extractErrorMessage(new Error('explicit failure'))).toBe('explicit failure');
    });

    it('falls back to default for an Error instance with empty message (non-prod)', () => {
      expect(extractErrorMessage(new Error(''))).toBe(DEFAULT_MESSAGE);
    });

    it('hides the Error message and returns default when PROD is truthy', () => {
      (process.env as any).PROD = 'true';
      expect(extractErrorMessage(new Error('sensitive detail'))).toBe(DEFAULT_MESSAGE);
    });

    it('returns data when data is a string', () => {
      expect(extractErrorMessage({ data: 'plain string error' })).toBe('plain string error');
    });

    it('returns data.message when present (FetchBaseQueryError shape)', () => {
      expect(
        extractErrorMessage({ status: 400, data: { message: 'Validation failed' } })
      ).toBe('Validation failed');
    });

    it('returns data.error alone when no fields/details', () => {
      expect(extractErrorMessage({ data: { error: 'Bad thing happened' } })).toBe(
        'Bad thing happened'
      );
    });

    it('appends fields to data.error when fields array is present', () => {
      expect(
        extractErrorMessage({ data: { error: 'Missing inputs', fields: ['name', 'email'] } })
      ).toBe('Missing inputs Fields: name, email');
    });

    it('appends details to data.error when details array is present', () => {
      expect(
        extractErrorMessage({
          data: {
            error: 'Invalid',
            details: [
              { field: 'name', message: 'required' },
              { field: 'age', message: 'must be a number' },
            ],
          },
        })
      ).toBe('Invalid Details: name: required, age: must be a number');
    });

    it('appends both fields and details to data.error', () => {
      expect(
        extractErrorMessage({
          data: {
            error: 'Invalid',
            fields: ['name'],
            details: [{ field: 'name', message: 'required' }],
          },
        })
      ).toBe('Invalid Fields: name Details: name: required');
    });

    it('returns data.detail when only detail is present', () => {
      expect(extractErrorMessage({ data: { detail: 'Detailed reason' } })).toBe(
        'Detailed reason'
      );
    });

    it('prefers data.message over data.error and data.detail', () => {
      expect(
        extractErrorMessage({
          data: { message: 'msg', error: 'err', detail: 'det' },
        })
      ).toBe('msg');
    });

    it('returns top-level message (SerializedError shape) when no data', () => {
      expect(extractErrorMessage({ message: 'serialized error' })).toBe('serialized error');
    });

    it('maps known status codes to friendly messages', () => {
      expect(extractErrorMessage({ status: 400 })).toBe(
        'Invalid request. Please check your input.'
      );
      expect(extractErrorMessage({ status: 401 })).toBe(
        'Authentication failed. Please log in again.'
      );
      expect(extractErrorMessage({ status: 403 })).toBe(
        'You do not have permission to perform this action.'
      );
      expect(extractErrorMessage({ status: 404 })).toBe(
        'The requested resource was not found.'
      );
      expect(extractErrorMessage({ status: 500 })).toBe(
        'Server error. Please try again later.'
      );
    });

    it('returns the default message for an unknown status code', () => {
      expect(extractErrorMessage({ status: 418 })).toBe(DEFAULT_MESSAGE);
      expect(extractErrorMessage({ status: 418 }, 'fallback')).toBe('fallback');
    });

    it('returns the default message for an object with no recognized shape', () => {
      expect(extractErrorMessage({})).toBe(DEFAULT_MESSAGE);
      expect(extractErrorMessage({ foo: 'bar' }, 'fallback')).toBe('fallback');
    });

    it("maps the multi-location 400 'Location required' to a top-bar hint", () => {
      expect(
        extractErrorMessage({ status: 400, data: { error: 'Location required' } })
      ).toBe('Please select a location from the switcher in the top bar, then try again.');
    });
  });

  describe('logError', () => {
    it('is a no-op that returns undefined and does not throw', () => {
      expect(logError(new Error('x'), 'ctx')).toBeUndefined();
      expect(() => logError('anything')).not.toThrow();
    });
  });
});
