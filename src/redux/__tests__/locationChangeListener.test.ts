import { configureStore, Middleware } from '@reduxjs/toolkit';
import orgReducer, { setCurrentLocation } from '../slices/orgSlice';
import { locationChangeListener } from '../locationChangeListener';
import { salesApi } from '../slices/salesApi';
import { inventoryApi } from '../slices/inventoryApi';
import { dashboardApi } from '../slices/dashboardApi';
import { receiveApi } from '../slices/receiveApi';
import { reportsApi } from '../slices/reportsApi';
import { alertsApi } from '../slices/alertsApi';
import { adminCreditApi } from '../slices/adminCreditApi';
import { orgApi } from '../slices/orgApi';
import { locationsApi } from '../slices/locationsApi';
import { adminApi } from '../slices/adminSlice';
import { masterApi } from '../slices/masterApi';
import { profileApi } from '../slices/profileApi';
import { activityApi } from '../slices/activityApi';
import { historicalFilesApi } from '../slices/historicalFilesApi';

// APIs whose caches are location-scoped and MUST be reset on a branch switch.
const LOCATION_SCOPED = [
  salesApi,
  inventoryApi,
  dashboardApi,
  receiveApi,
  reportsApi,
  alertsApi,
  adminCreditApi,
];

// Org-level APIs that must NOT be reset (their data is not per-location).
const ORG_LEVEL = [
  orgApi,
  locationsApi,
  adminApi,
  masterApi,
  profileApi,
  activityApi,
  historicalFilesApi,
];

// Record every dispatched action type; the listener's resetApiState dispatches
// flow through the full middleware chain, so the recorder sees them.
const makeStore = () => {
  const recorded: string[] = [];
  const recorder: Middleware = () => (next) => (action) => {
    recorded.push((action as { type: string }).type);
    return next(action);
  };
  const store = configureStore({
    reducer: { org: orgReducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(locationChangeListener.middleware).concat(recorder),
  });
  return { store, recorded };
};

// Listener effects start synchronously but flush on a microtask to be safe.
const flush = () => Promise.resolve();

describe('locationChangeListener', () => {
  it('resets exactly the location-scoped API caches when the location changes', async () => {
    const { store, recorded } = makeStore();

    store.dispatch(setCurrentLocation(2));
    await flush();

    LOCATION_SCOPED.forEach((api) => {
      expect(recorded).toContain(api.util.resetApiState().type);
    });
    ORG_LEVEL.forEach((api) => {
      expect(recorded).not.toContain(api.util.resetApiState().type);
    });
  });

  it('does not reset anything when setCurrentLocation re-selects the same id', async () => {
    const { store, recorded } = makeStore();

    store.dispatch(setCurrentLocation(2));
    await flush();
    recorded.length = 0;

    store.dispatch(setCurrentLocation(2));
    await flush();

    expect(recorded.filter((t) => t.endsWith('/resetApiState'))).toEqual([]);
  });

  it('also resets when the location is cleared (stale-location repair path)', async () => {
    const { store, recorded } = makeStore();

    store.dispatch(setCurrentLocation(3));
    await flush();
    recorded.length = 0;

    store.dispatch(setCurrentLocation(null));
    await flush();

    LOCATION_SCOPED.forEach((api) => {
      expect(recorded).toContain(api.util.resetApiState().type);
    });
  });
});
