import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: number;
  username: string;
  exp: number; // Expiration timestamp in seconds
  iat: number; // Issued at timestamp in seconds
}

/**
 * Check if a JWT token is expired
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000; // Convert to seconds
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

/**
 * Get token expiration time in milliseconds
 */
export const getTokenExpirationTime = (token: string): number | null => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

/**
 * Get time remaining until token expires in milliseconds
 */
export const getTimeUntilExpiry = (token: string): number => {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return 0;
  
  const timeRemaining = expirationTime - Date.now();
  return timeRemaining > 0 ? timeRemaining : 0;
};

/**
 * Check if token will expire soon (within specified minutes)
 */
export const willExpireSoon = (token: string, minutesThreshold: number = 5): boolean => {
  const timeRemaining = getTimeUntilExpiry(token);
  const thresholdMs = minutesThreshold * 60 * 1000;
  return timeRemaining > 0 && timeRemaining <= thresholdMs;
};

