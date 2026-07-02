import { jwtDecode } from 'jwt-decode';
import {
  isTokenExpired,
  getTokenExpirationTime,
  getTimeUntilExpiry,
  willExpireSoon,
} from '../tokenUtils';

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

const mockedJwtDecode = jwtDecode as jest.MockedFunction<typeof jwtDecode>;

// Fix "now" so exp comparisons are deterministic.
const NOW_MS = 1_700_000_000_000;
const NOW_SEC = NOW_MS / 1000;

describe('tokenUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW_MS);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isTokenExpired', () => {
    it('returns true when token is null', () => {
      expect(isTokenExpired(null)).toBe(true);
      expect(mockedJwtDecode).not.toHaveBeenCalled();
    });

    it('returns true when token is empty string', () => {
      expect(isTokenExpired('')).toBe(true);
      expect(mockedJwtDecode).not.toHaveBeenCalled();
    });

    it('returns false for a token whose exp is in the future', () => {
      mockedJwtDecode.mockReturnValue({ exp: NOW_SEC + 3600 } as any);
      expect(isTokenExpired('valid.token')).toBe(false);
    });

    it('returns true for a token whose exp is in the past', () => {
      mockedJwtDecode.mockReturnValue({ exp: NOW_SEC - 3600 } as any);
      expect(isTokenExpired('expired.token')).toBe(true);
    });

    it('returns true when jwtDecode throws (malformed token)', () => {
      mockedJwtDecode.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      expect(isTokenExpired('garbage')).toBe(true);
    });
  });

  describe('getTokenExpirationTime', () => {
    it('returns exp converted to milliseconds', () => {
      const expSec = NOW_SEC + 1000;
      mockedJwtDecode.mockReturnValue({ exp: expSec } as any);
      expect(getTokenExpirationTime('valid.token')).toBe(expSec * 1000);
    });

    it('returns null when jwtDecode throws', () => {
      mockedJwtDecode.mockImplementation(() => {
        throw new Error('boom');
      });
      expect(getTokenExpirationTime('garbage')).toBeNull();
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('returns the remaining milliseconds for a future token', () => {
      const expSec = NOW_SEC + 60; // 60s in the future
      mockedJwtDecode.mockReturnValue({ exp: expSec } as any);
      expect(getTimeUntilExpiry('valid.token')).toBe(60 * 1000);
    });

    it('returns 0 when the token is already expired', () => {
      mockedJwtDecode.mockReturnValue({ exp: NOW_SEC - 60 } as any);
      expect(getTimeUntilExpiry('expired.token')).toBe(0);
    });

    it('returns 0 when expiration time cannot be derived (decode throws)', () => {
      mockedJwtDecode.mockImplementation(() => {
        throw new Error('boom');
      });
      expect(getTimeUntilExpiry('garbage')).toBe(0);
    });
  });

  describe('willExpireSoon', () => {
    it('returns true when remaining time is within the default 5 minute threshold', () => {
      mockedJwtDecode.mockReturnValue({ exp: NOW_SEC + 60 } as any); // 1 min left
      expect(willExpireSoon('valid.token')).toBe(true);
    });

    it('returns false when remaining time exceeds the threshold', () => {
      mockedJwtDecode.mockReturnValue({ exp: NOW_SEC + 3600 } as any); // 1 hour left
      expect(willExpireSoon('valid.token')).toBe(false);
    });

    it('returns false when the token is already expired (no time remaining)', () => {
      mockedJwtDecode.mockReturnValue({ exp: NOW_SEC - 60 } as any);
      expect(willExpireSoon('expired.token')).toBe(false);
    });

    it('honors a custom minutesThreshold', () => {
      mockedJwtDecode.mockReturnValue({ exp: NOW_SEC + 600 } as any); // 10 min left
      expect(willExpireSoon('valid.token', 5)).toBe(false);
      expect(willExpireSoon('valid.token', 15)).toBe(true);
    });
  });
});
