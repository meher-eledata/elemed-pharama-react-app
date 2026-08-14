import { useCallback, useMemo, useRef } from 'react';

/**
 * Client-side idempotency key for money/stock-moving submits.
 *
 * The backend accepts an optional `idempotency_key` (string, <=64 chars) in the
 * request body; a duplicate submit with the same key returns 200 with the stored
 * outcome of the first attempt instead of committing twice.
 *
 * Lifecycle (one key per pending logical submission):
 * - `getKey(fingerprint)` lazily creates a key on the first submit attempt and
 *   REUSES it while the payload fingerprint is unchanged (i.e. the user retries
 *   the same failed submission).
 * - A different fingerprint (materially changed payload) regenerates the key.
 * - Call `reset()` after a successful submit so the next submission gets a new key.
 */
export const useIdempotencyKey = () => {
  const keyRef = useRef<string | null>(null);
  const fingerprintRef = useRef<string | null>(null);

  const getKey = useCallback((fingerprint: string): string => {
    if (keyRef.current === null || fingerprint !== fingerprintRef.current) {
      keyRef.current = crypto.randomUUID();
      fingerprintRef.current = fingerprint;
    }
    return keyRef.current;
  }, []);

  const reset = useCallback(() => {
    keyRef.current = null;
    fingerprintRef.current = null;
  }, []);

  // Stable identity so callers can safely list the handle in hook deps.
  return useMemo(() => ({ getKey, reset }), [getKey, reset]);
};
