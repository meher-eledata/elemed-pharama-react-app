import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: number;
  username: string;
  exp: number; 
  iat: number; 
}

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

export const getTokenExpirationTime = (token: string): number | null => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.exp * 1000;
  } catch (error) {
    return null;
  }
};

export const getTimeUntilExpiry = (token: string): number => {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return 0;
  
  const timeRemaining = expirationTime - Date.now();
  return timeRemaining > 0 ? timeRemaining : 0;
};

export const willExpireSoon = (token: string, minutesThreshold: number = 5): boolean => {
  const timeRemaining = getTimeUntilExpiry(token);
  const thresholdMs = minutesThreshold * 60 * 1000;
  return timeRemaining > 0 && timeRemaining <= thresholdMs;
};

