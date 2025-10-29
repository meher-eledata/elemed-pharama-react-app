import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debouncing API calls
 * @param apiCall - The API function to call
 * @param params - Parameters for the API call
 * @param delay - Delay in milliseconds
 * @returns Object with loading state, data, error, and refetch function
 */
export function useDebouncedApiCall<TParams, TResponse>(
  apiCall: (params: TParams) => Promise<TResponse>,
  params: TParams | null,
  delay: number = 500
) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debouncedParams = useDebounce(params, delay);

  useEffect(() => {
    if (!debouncedParams) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const callApi = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await apiCall(debouncedParams);
        setData(result);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    callApi();
  }, [debouncedParams, apiCall]);

  const refetch = async () => {
    if (!debouncedParams) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall(debouncedParams);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return { loading, data, error, refetch };
}
