import {
  NOTIFICATION_CONSTANTS,
  getNotificationRoute,
  notificationTypeFilters,
} from '../Notifications.constants';
import type { NotificationItem } from '../../../redux/slices/notificationsApi';

// The FRONTEND owns the notification `type` -> react-router destination map: the
// backend deliberately stores no routes in `payload` (api-contract.md, Notifications
// section), so this pure function IS the contract for deep-linking the bell.
// It is asserted byte-for-byte here because the targets must stay identical to the
// dashboard inventory cards and to the `location.state` keys InventoryModule.tsx reads
// (`tab` / `nearExpiryMonths`) — a silent rename there breaks navigation with no type error.

const item = (over: Partial<NotificationItem> = {}): NotificationItem =>
  ({
    id: 1,
    module: 'pharmacy',
    type: 'NEAR_EXPIRY',
    severity: 'HIGH',
    title: 'Amoxicillin expires in 20 day(s)',
    body: 'Batch B-1M — 25 unit(s) in stock',
    payload: {},
    status: 'ACTIVE',
    first_seen_at: '2026-08-17T00:00:00.000Z',
    last_seen_at: '2026-08-17T00:00:00.000Z',
    read_at: null,
    dismissed_at: null,
    resolved_at: null,
    ...over,
  }) as NotificationItem;

describe('getNotificationRoute — type -> inventory deep link', () => {
  it('LOW_STOCK -> /inventory with { tab: "low" } and NO nearExpiryMonths', () => {
    expect(getNotificationRoute(item({ type: 'LOW_STOCK' }))).toEqual({
      path: '/inventory',
      state: { tab: 'low' },
    });
  });

  it('EXCESS_STOCK -> /inventory with { tab: "excess" }', () => {
    expect(getNotificationRoute(item({ type: 'EXCESS_STOCK' }))).toEqual({
      path: '/inventory',
      state: { tab: 'excess' },
    });
  });

  it('EXPIRED -> /inventory with { tab: "expired" }', () => {
    expect(getNotificationRoute(item({ type: 'EXPIRED' }))).toEqual({
      path: '/inventory',
      state: { tab: 'expired' },
    });
  });

  it("NEAR_EXPIRY with payload.window === '1month' -> nearExpiryMonths 1", () => {
    expect(
      getNotificationRoute(item({ type: 'NEAR_EXPIRY', payload: { window: '1month' } })),
    ).toEqual({
      path: '/inventory',
      state: { tab: 'nearExpiry', nearExpiryMonths: 1 },
    });
  });

  it("NEAR_EXPIRY with payload.window === '3month' -> nearExpiryMonths 3", () => {
    expect(
      getNotificationRoute(item({ type: 'NEAR_EXPIRY', payload: { window: '3month' } })),
    ).toEqual({
      path: '/inventory',
      state: { tab: 'nearExpiry', nearExpiryMonths: 3 },
    });
  });

  // The window literal is the ONLY thing that selects the 1-month view. Anything
  // that is not exactly '1month' — including a missing payload key — must fall back
  // to the wider 3-month view rather than under-showing batches.
  it.each([
    ['an absent window key', {}],
    ['an explicitly undefined window', { window: undefined }],
    ['an unexpected window value', { window: '6month' }],
  ])('NEAR_EXPIRY with %s falls back to nearExpiryMonths 3', (_name, payload) => {
    expect(
      getNotificationRoute(
        item({ type: 'NEAR_EXPIRY', payload: payload as NotificationItem['payload'] }),
      ),
    ).toEqual({
      path: '/inventory',
      state: { tab: 'nearExpiry', nearExpiryMonths: 3 },
    });
  });

  it('NEAR_EXPIRY with NO payload object at all still resolves (optional chaining) to 3 months', () => {
    const noPayload = item({ type: 'NEAR_EXPIRY' });
    // The server always sends a payload (JSONB NOT NULL DEFAULT '{}'), but the
    // component reads it through `?.` — prove that contract holds.
    delete (noPayload as unknown as Record<string, unknown>).payload;
    expect(getNotificationRoute(noPayload)).toEqual({
      path: '/inventory',
      state: { tab: 'nearExpiry', nearExpiryMonths: 3 },
    });
  });

  // `module`/`type` are open VARCHARs server-side — a new registry entry ships with
  // ZERO DDL, so an unknown type must be inert (TopBar renders it without a link),
  // never a thrown error or a guessed destination.
  it.each([['FUTURE_TYPE'], ['']])('an unknown type (%s) returns null', (type) => {
    expect(getNotificationRoute(item({ type }))).toBeNull();
  });

  it('returns a NEW object each call (no shared mutable state between rows)', () => {
    const a = getNotificationRoute(item({ type: 'LOW_STOCK' }));
    const b = getNotificationRoute(item({ type: 'LOW_STOCK' }));
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});

describe('NOTIFICATION_CONSTANTS', () => {
  it('LIST_LIMIT is an integer inside the server-accepted 1..200 range', () => {
    // The controller 400s a non-integer or out-of-range limit
    // ("limit must be an integer between 1 and 200").
    expect(Number.isInteger(NOTIFICATION_CONSTANTS.LIST_LIMIT)).toBe(true);
    expect(NOTIFICATION_CONSTANTS.LIST_LIMIT).toBeGreaterThanOrEqual(1);
    expect(NOTIFICATION_CONSTANTS.LIST_LIMIT).toBeLessThanOrEqual(200);
  });

  it('LIST_LIMIT_MAX is the server ceiling and an exact number of "load more" steps', () => {
    expect(NOTIFICATION_CONSTANTS.LIST_LIMIT_MAX).toBe(200);
    expect(NOTIFICATION_CONSTANTS.LIST_LIMIT_MAX % NOTIFICATION_CONSTANTS.LIST_LIMIT).toBe(0);
  });
});

// The panel's type filter must be derived, never enumerated: `byType` is
// zero-filled from a server registry that gains entries with no DDL, so a fifth
// type has to become reachable without a frontend release.
describe('notificationTypeFilters', () => {
  it('returns one entry per byType key, including a type this build has never seen', () => {
    expect(
      notificationTypeFilters(
        { NEAR_EXPIRY: 3, EXPIRED: 2, LOW_STOCK: 72, EXCESS_STOCK: 10, FUTURE_TYPE: 1 },
        [],
      ),
    ).toEqual([
      { type: 'NEAR_EXPIRY', count: 3 },
      { type: 'EXPIRED', count: 2 },
      { type: 'LOW_STOCK', count: 72 },
      { type: 'EXCESS_STOCK', count: 10 },
      { type: 'FUTURE_TYPE', count: 1 },
    ]);
  });

  it('keeps zero-count types — byType counts UNREAD rows, which "mark all read" zeroes', () => {
    expect(notificationTypeFilters({ NEAR_EXPIRY: 0, LOW_STOCK: 0 }, [])).toEqual([
      { type: 'NEAR_EXPIRY', count: 0 },
      { type: 'LOW_STOCK', count: 0 },
    ]);
  });

  it('adds a type that is on the page but missing from byType (read rows only)', () => {
    const filters = notificationTypeFilters({ LOW_STOCK: 1 }, [
      item({ type: 'EXCESS_STOCK', read_at: '2026-08-17T06:00:00.000Z' }),
    ]);
    expect(filters).toEqual([
      { type: 'LOW_STOCK', count: 1 },
      { type: 'EXCESS_STOCK', count: 0 },
    ]);
  });

  it('does not double-count a type present in both inputs, and tolerates no summary', () => {
    expect(notificationTypeFilters({ LOW_STOCK: 4 }, [item({ type: 'LOW_STOCK' })])).toEqual([
      { type: 'LOW_STOCK', count: 4 },
    ]);
    expect(notificationTypeFilters(undefined, [])).toEqual([]);
  });
});
