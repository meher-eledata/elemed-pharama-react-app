import { createListenerMiddleware } from '@reduxjs/toolkit';
import { setCurrentLocation } from './slices/orgSlice';
import { salesApi } from './slices/salesApi';
import { inventoryApi } from './slices/inventoryApi';
import { dashboardApi } from './slices/dashboardApi';
import { receiveApi } from './slices/receiveApi';
import { reportsApi } from './slices/reportsApi';
import { alertsApi } from './slices/alertsApi';
import { adminCreditApi } from './slices/adminCreditApi';

// RTK Query caches are keyed by endpoint+args only — the `x-location-id` header
// is NOT part of the cache key, so after a branch switch every location-scoped
// cache still holds the PREVIOUS branch's data. This listener resets those API
// caches whenever the working location actually changes, forcing subscribed
// components to refetch under the new header. Org-level APIs (orgApi,
// locationsApi, authApi, adminApi, masterApi, profileApi, activityApi,
// historicalFilesApi) are deliberately NOT reset — their data is not scoped to
// a location.
const LOCATION_SCOPED_APIS = [
  salesApi,
  inventoryApi,
  dashboardApi,
  receiveApi,
  reportsApi,
  alertsApi,
  adminCreditApi,
];

type OrgStateSlice = { org?: { currentLocationId: number | null } };

export const locationChangeListener = createListenerMiddleware();

locationChangeListener.startListening({
  predicate: (action, currentState, previousState) => {
    if (!setCurrentLocation.match(action)) return false;
    const curr = (currentState as OrgStateSlice).org?.currentLocationId ?? null;
    const prev = (previousState as OrgStateSlice).org?.currentLocationId ?? null;
    return curr !== prev;
  },
  effect: (_action, listenerApi) => {
    LOCATION_SCOPED_APIS.forEach((api) => {
      listenerApi.dispatch(api.util.resetApiState());
    });
  },
});
