import { configureStore } from '@reduxjs/toolkit';
import { complianceApi } from '../complianceApi';
import { notificationsApi } from '../notificationsApi';
import authReducer from '../authSlice';

// Cross-slice invalidation is MANUAL in RTK Query, and its absence is invisible in
// isolation: both slices look correct on their own, and only a real flow (file a
// document -> the bell still says it is missing) exposes it. This pins the wiring.
const requested: string[] = [];

const respond = (body: unknown) =>
  ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
    text: async () => JSON.stringify(body),
    clone() {
      return this;
    },
  }) as unknown as Response;

beforeEach(() => {
  requested.length = 0;
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    requested.push(url);
    if (url.includes('notifications')) {
      return respond({ notifications: [], unreadCount: 0, byType: {}, byModule: {} });
    }
    return respond({ id: 1, title: 'NDPS Licence' });
  }) as unknown as typeof fetch;
});

const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      [complianceApi.reducerPath]: complianceApi.reducer,
      [notificationsApi.reducerPath]: notificationsApi.reducer,
    },
    middleware: (getDefault) =>
      getDefault().concat(complianceApi.middleware, notificationsApi.middleware),
  });

const notificationCalls = () => requested.filter((url) => url.includes('notifications')).length;

it('a compliance write refetches the bell without a reload', async () => {
  const store = makeStore();
  // The bell is on screen (subscribed), as it is on every authenticated page.
  await store.dispatch(notificationsApi.endpoints.getNotificationSummary.initiate());
  expect(notificationCalls()).toBe(1);

  await store.dispatch(
    complianceApi.endpoints.createComplianceDocument.initiate({
      document_type_id: 1,
      title: 'NDPS Licence',
    }),
  );

  // The subscribed summary refetches, so the chip cannot keep saying "missing"
  // for a document that was just filed.
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(notificationCalls()).toBe(2);
});

// Every mutation in the slice, with a representative argument. A new endpoint that
// writes compliance state but forgets the refresh reintroduces the stale bell, so
// this list is deliberately exhaustive rather than a sample.
const MUTATIONS: Array<[string, unknown]> = [
  ['createComplianceDocumentType', { key: 'ndps_extra', name: 'Extra' }],
  ['updateComplianceDocumentType', { id: 1, name: 'Extra' }],
  ['archiveComplianceDocumentType', 1],
  ['createComplianceDocument', { document_type_id: 1, title: 'NDPS Licence' }],
  ['updateComplianceDocument', { id: 1, title: 'NDPS Licence' }],
  [
    'uploadComplianceVersion',
    { documentId: 1, file: new File(['x'], 'licence.pdf'), valid_from: '2026-01-01' },
  ],
  ['updateComplianceVersion', { documentId: 1, versionId: 2, issued_by: 'Drug Control' }],
  ['makeComplianceVersionCurrent', { documentId: 1, versionId: 2 }],
  ['updateComplianceNotificationSettings', { lead_days: [30] }],
];

it.each(MUTATIONS)('%s refreshes the bell', async (name, arg) => {
  const store = makeStore();
  await store.dispatch(notificationsApi.endpoints.getNotificationSummary.initiate());
  expect(notificationCalls()).toBe(1);

  const endpoints = complianceApi.endpoints as unknown as Record<
    string,
    { initiate: (a: unknown) => never }
  >;
  await store.dispatch(endpoints[name].initiate(arg));

  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(notificationCalls()).toBe(2);
});
