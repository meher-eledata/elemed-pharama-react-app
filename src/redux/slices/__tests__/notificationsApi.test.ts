import { notificationsApi } from '../notificationsApi';
import type {
  GetNotificationsResponse,
  NotificationSummary,
} from '../notificationsApi';
import { baseQueryWithReauth } from '../../baseQuery';
import { configureStore } from '@reduxjs/toolkit';

// Mock the shared reauth base query so the exact request descriptor RTK Query builds
// (url / method / params / body) is asserted directly — no network, no MSW.
jest.mock('../../baseQuery', () => ({
  baseQueryWithReauth: jest.fn(),
}));

const mockBaseQuery = baseQueryWithReauth as jest.MockedFunction<
  typeof baseQueryWithReauth
>;

const makeStore = () =>
  configureStore({
    reducer: {
      [notificationsApi.reducerPath]: notificationsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(notificationsApi.middleware),
  });

const okMeta = {
  request: new Request('http://localhost:3000/api/notifications'),
  response: { status: 200, statusText: 'OK' } as Response,
};

const expectExtraArgs = expect.objectContaining({
  dispatch: expect.any(Function),
  getState: expect.any(Function),
});

const flush = () => new Promise((r) => setTimeout(r, 0));

const emptyList: GetNotificationsResponse = {
  unreadCount: 0,
  count: 0,
  notifications: [],
};
const emptySummary: NotificationSummary = {
  unreadCount: 0,
  byType: { NEAR_EXPIRY: 0, EXPIRED: 0, LOW_STOCK: 0, EXCESS_STOCK: 0 },
  byModule: { pharmacy: 0 },
};

// The request descriptor of the Nth baseQuery call.
const argsOf = (call: number) =>
  mockBaseQuery.mock.calls[call][0] as {
    url: string;
    method?: string;
    params?: Record<string, unknown>;
    body?: unknown;
  };

describe('notificationsApi — request construction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBaseQuery.mockResolvedValue({ data: emptyList, meta: okMeta });
  });

  describe('getNotifications query params', () => {
    it('sends every param undefined when called with no args (server defaults apply)', async () => {
      const store = makeStore();
      await store.dispatch(notificationsApi.endpoints.getNotifications.initiate());

      expect(mockBaseQuery).toHaveBeenCalledWith(
        {
          url: 'notifications',
          params: {
            status: undefined,
            module: undefined,
            type: undefined,
            limit: undefined,
            includeDismissed: undefined,
          },
        },
        expectExtraArgs,
        undefined,
      );
    });

    it("serialises includeDismissed: true as the STRING 'true' (the literal the controller compares against)", async () => {
      const store = makeStore();
      await store.dispatch(
        notificationsApi.endpoints.getNotifications.initiate({ includeDismissed: true }),
      );

      const params = argsOf(0).params!;
      // notificationsController.js: `includeDismissed === 'true'` — a boolean true
      // would serialise to the same query string, but assert the exact value so a
      // refactor to e.g. `1` is caught here.
      expect(params.includeDismissed).toBe('true');
      expect(typeof params.includeDismissed).toBe('string');
    });

    it.each([
      ['false', { includeDismissed: false }],
      ['omitted', {}],
    ])(
      'OMITS includeDismissed entirely when %s (fetchBaseQuery strips undefined — no includeDismissed=false is ever sent)',
      async (_name, args) => {
        const store = makeStore();
        await store.dispatch(notificationsApi.endpoints.getNotifications.initiate(args));

        expect(argsOf(0).params!.includeDismissed).toBeUndefined();
      },
    );

    it('sends limit as an INTEGER (a non-integer limit is a 400 server-side)', async () => {
      const store = makeStore();
      await store.dispatch(
        notificationsApi.endpoints.getNotifications.initiate({ limit: 50 }),
      );

      const limit = argsOf(0).params!.limit;
      expect(limit).toBe(50);
      expect(typeof limit).toBe('number');
      expect(Number.isInteger(limit as number)).toBe(true);
    });

    it('passes status / module / type through verbatim', async () => {
      const store = makeStore();
      await store.dispatch(
        notificationsApi.endpoints.getNotifications.initiate({
          status: 'all',
          module: 'pharmacy',
          type: 'NEAR_EXPIRY',
          limit: 200,
          includeDismissed: true,
        }),
      );

      expect(argsOf(0)).toEqual({
        url: 'notifications',
        params: {
          status: 'all',
          module: 'pharmacy',
          type: 'NEAR_EXPIRY',
          limit: 200,
          includeDismissed: 'true',
        },
      });
    });

    it('returns the { unreadCount, count, notifications } envelope unchanged (no client-side re-derivation)', async () => {
      const payload: GetNotificationsResponse = {
        // unreadCount deliberately differs from notifications.length — the slice
        // must not recompute the badge from the returned page.
        unreadCount: 7,
        count: 1,
        notifications: [
          {
            id: 1,
            module: 'pharmacy',
            type: 'NEAR_EXPIRY',
            severity: 'HIGH',
            title: 'Amoxicillin expires in 20 day(s)',
            body: 'Batch B-1M',
            payload: { window: '1month' },
            status: 'ACTIVE',
            first_seen_at: '2026-08-17T00:00:00.000Z',
            last_seen_at: '2026-08-17T00:00:00.000Z',
            read_at: null,
            dismissed_at: null,
            resolved_at: null,
          },
        ],
      };
      mockBaseQuery.mockResolvedValueOnce({ data: payload, meta: okMeta });

      const store = makeStore();
      const result = await store.dispatch(
        notificationsApi.endpoints.getNotifications.initiate({ limit: 50 }),
      );

      expect(result.data).toEqual(payload);
    });

    it('surfaces a 400 (bad limit) as an error rather than throwing', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        error: { status: 400, data: { error: 'limit must be an integer between 1 and 200' } },
        meta: okMeta,
      });

      const store = makeStore();
      const result = await store.dispatch(
        notificationsApi.endpoints.getNotifications.initiate({ limit: 500 }),
      );

      expect((result.error as { status: number }).status).toBe(400);
    });
  });

  describe('the other four endpoints', () => {
    it('getNotificationSummary is a plain GET of notifications/summary (no params)', async () => {
      mockBaseQuery.mockResolvedValueOnce({ data: emptySummary, meta: okMeta });
      const store = makeStore();
      await store.dispatch(notificationsApi.endpoints.getNotificationSummary.initiate());

      expect(mockBaseQuery).toHaveBeenCalledWith(
        'notifications/summary',
        expectExtraArgs,
        undefined,
      );
    });

    it('markNotificationRead POSTs notifications/:id/read with no body', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        data: { id: 12, read_at: '2026-08-17T10:00:00.000Z' },
        meta: okMeta,
      });
      const store = makeStore();
      await store.dispatch(notificationsApi.endpoints.markNotificationRead.initiate(12));

      expect(argsOf(0)).toEqual({ url: 'notifications/12/read', method: 'POST' });
    });

    it('dismissNotification POSTs notifications/:id/dismiss with no body', async () => {
      mockBaseQuery.mockResolvedValueOnce({
        data: { id: 12, dismissed_at: '2026-08-17T10:00:00.000Z' },
        meta: okMeta,
      });
      const store = makeStore();
      await store.dispatch(notificationsApi.endpoints.dismissNotification.initiate(12));

      expect(argsOf(0)).toEqual({ url: 'notifications/12/dismiss', method: 'POST' });
    });

    it('markAllNotificationsRead with no argument sends a body whose keys are undefined (serialises to {})', async () => {
      mockBaseQuery.mockResolvedValueOnce({ data: { updated: 3 }, meta: okMeta });
      const store = makeStore();
      await store.dispatch(notificationsApi.endpoints.markAllNotificationsRead.initiate());

      const args = argsOf(0);
      expect(args.url).toBe('notifications/read-all');
      expect(args.method).toBe('POST');
      // Both keys undefined -> JSON.stringify drops them -> `{}` on the wire, which
      // is the controller's "mark everything read" case.
      expect(args.body).toEqual({ module: undefined, type: undefined });
      expect(JSON.stringify(args.body)).toBe('{}');
    });

    it('markAllNotificationsRead forwards module/type filters when given', async () => {
      mockBaseQuery.mockResolvedValueOnce({ data: { updated: 1 }, meta: okMeta });
      const store = makeStore();
      await store.dispatch(
        notificationsApi.endpoints.markAllNotificationsRead.initiate({
          module: 'pharmacy',
          type: 'LOW_STOCK',
        }),
      );

      expect(argsOf(0).body).toEqual({ module: 'pharmacy', type: 'LOW_STOCK' });
    });
  });
});

describe('notificationsApi — Notification tag invalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // One shared 'Notification' tag is provided by BOTH GETs, so every mutation must
  // refetch the list AND the summary — otherwise the badge and the rows disagree
  // (the bell would keep showing an item the user just dismissed).
  const primeBothQueries = async (store: ReturnType<typeof makeStore>) => {
    mockBaseQuery.mockResolvedValueOnce({ data: emptyList, meta: okMeta });
    const listSub = store.dispatch(
      notificationsApi.endpoints.getNotifications.initiate({ limit: 50 }),
    );
    await listSub;

    mockBaseQuery.mockResolvedValueOnce({ data: emptySummary, meta: okMeta });
    const summarySub = store.dispatch(
      notificationsApi.endpoints.getNotificationSummary.initiate(),
    );
    await summarySub;

    return { listSub, summarySub };
  };

  const urlOf = (arg: unknown) =>
    typeof arg === 'string' ? arg : (arg as { url: string }).url;

  it.each([
    ['markNotificationRead', () => notificationsApi.endpoints.markNotificationRead.initiate(1), { id: 1, read_at: 'x' }],
    ['dismissNotification', () => notificationsApi.endpoints.dismissNotification.initiate(1), { id: 1, dismissed_at: 'x' }],
    ['markAllNotificationsRead', () => notificationsApi.endpoints.markAllNotificationsRead.initiate(), { updated: 2 }],
  ])('%s invalidates Notification, refetching BOTH the list and the summary', async (_name, initiate, data) => {
    const store = makeStore();
    const { listSub, summarySub } = await primeBothQueries(store);

    const callsBefore = mockBaseQuery.mock.calls.length;

    mockBaseQuery.mockResolvedValueOnce({ data, meta: okMeta });
    // The two invalidated queries then refetch.
    mockBaseQuery.mockResolvedValue({ data: emptyList, meta: okMeta });

    await store.dispatch(initiate() as never);
    await flush();

    const urlsAfter = mockBaseQuery.mock.calls.slice(callsBefore).map((c) => urlOf(c[0]));

    expect(urlsAfter).toContain('notifications');
    expect(urlsAfter).toContain('notifications/summary');

    listSub.unsubscribe();
    summarySub.unsubscribe();
  });

  // Documented RTK Query behaviour: a plain `invalidatesTags: ['Notification']`
  // array invalidates on BOTH fulfilled and rejected. That is the right outcome for
  // this feature — a 404 dismiss means the row is gone/foreign, so re-reading the
  // server (the sole source of read/dismiss truth) is exactly what should happen.
  // Pinned here so switching to the callback form (which could skip invalidation on
  // error) is a conscious, visible change rather than a silent one.
  it('a FAILED mutation still invalidates, so the bell re-syncs with the server', async () => {
    const store = makeStore();
    const { listSub, summarySub } = await primeBothQueries(store);

    const callsBefore = mockBaseQuery.mock.calls.length;

    mockBaseQuery.mockResolvedValueOnce({
      error: { status: 404, data: { error: 'Notification not found' } },
      meta: okMeta,
    });
    mockBaseQuery.mockResolvedValue({ data: emptyList, meta: okMeta });

    const result = await store.dispatch(
      notificationsApi.endpoints.dismissNotification.initiate(999),
    );
    await flush();

    expect(((result as { error?: { status: number } }).error || {}).status).toBe(404);

    const urlsAfter = mockBaseQuery.mock.calls.slice(callsBefore).map((c) => urlOf(c[0]));
    expect(urlsAfter[0]).toBe('notifications/999/dismiss');
    expect(urlsAfter).toContain('notifications');
    expect(urlsAfter).toContain('notifications/summary');

    listSub.unsubscribe();
    summarySub.unsubscribe();
  });
});

describe('notificationsApi — configuration', () => {
  it('declares the Notification tag and all five endpoints + hooks', () => {
    expect(notificationsApi.reducerPath).toBe('notificationsApi');

    expect(notificationsApi.endpoints.getNotifications).toBeDefined();
    expect(notificationsApi.endpoints.getNotificationSummary).toBeDefined();
    expect(notificationsApi.endpoints.markNotificationRead).toBeDefined();
    expect(notificationsApi.endpoints.markAllNotificationsRead).toBeDefined();
    expect(notificationsApi.endpoints.dismissNotification).toBeDefined();

    expect(notificationsApi.useGetNotificationsQuery).toBeDefined();
    expect(notificationsApi.useGetNotificationSummaryQuery).toBeDefined();
    expect(notificationsApi.useMarkNotificationReadMutation).toBeDefined();
    expect(notificationsApi.useMarkAllNotificationsReadMutation).toBeDefined();
    expect(notificationsApi.useDismissNotificationMutation).toBeDefined();
  });
});
