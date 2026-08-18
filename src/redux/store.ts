
import { configureStore } from "@reduxjs/toolkit";
import type { Middleware } from "@reduxjs/toolkit";
import authReducer, { authApi, logout } from "./slices/authSlice";
import { inventoryApi } from "./slices/inventoryApi";
import { dashboardApi } from "./slices/dashboardApi";
import { receiveApi } from "./slices/receiveApi";
import { salesApi } from "./slices/salesApi";
import { adminApi } from "./slices/adminSlice";
import { masterApi } from "./slices/masterApi";
import { reportsApi } from "./slices/reportsApi";
import { historicalFilesApi } from "./slices/historicalFilesApi";
import { activityApi } from "./slices/activityApi";
import { profileApi } from "./slices/profileApi";
import { notificationsApi } from "./slices/notificationsApi";
import { adminCreditApi } from "./slices/adminCreditApi";
import { draftsApi } from "./slices/draftsApi";
import { orgApi } from "./slices/orgApi";
import { supplierReturnsApi } from "./slices/supplierReturnsApi";
import cartReducer from "./slices/cartSlice";
import orgReducer from "./slices/orgSlice";
import { clearAllSalesStorage } from "../utils/cartStorage";

// Every RTK Query api in the app — the single source of truth used for BOTH the
// middleware chain and the logout cache purge below, so a future api added here
// is automatically covered by both. The reducer map must list the same apis
// explicitly (a derived map would destroy RootState type inference).
export const allApis = [
  authApi,
  inventoryApi,
  dashboardApi,
  receiveApi,
  salesApi,
  adminApi,
  masterApi,
  reportsApi,
  historicalFilesApi,
  activityApi,
  profileApi,
  notificationsApi,
  adminCreditApi,
  draftsApi,
  orgApi,
  supplierReturnsApi,
] as const;

// On logout (TopBar menu AND baseQuery's 401 handler both dispatch it), purge
// EVERY api slice's cache so a different user logging back in within
// keepUnusedDataFor can never be served the previous org's data (sales rows,
// reports, inventory, /me branding, ...) without a refetch. Also clear the
// browser-global sales storage (localStorage sales history / invoice counter,
// sessionStorage cart artifacts) — SaleHistory merges the locally-saved rows
// into its table, so they too would leak across accounts.
// Done here — not in baseQuery.ts — because importing the apis there would
// create a module-init cycle (each createApi reads baseQueryWithReauth at load
// time).
const resetApiStateOnLogout: Middleware = (storeApi) => (next) => (action) => {
  const result = next(action);
  if (logout.match(action)) {
    allApis.forEach((api) => storeApi.dispatch(api.util.resetApiState()));
    clearAllSalesStorage();
  }
  return result;
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    org: orgReducer,
    // Must mirror `allApis` above (kept explicit for RootState inference).
    [authApi.reducerPath]: authApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [receiveApi.reducerPath]: receiveApi.reducer,
    [salesApi.reducerPath]: salesApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [masterApi.reducerPath]: masterApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    [historicalFilesApi.reducerPath]: historicalFilesApi.reducer,
    [activityApi.reducerPath]: activityApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [adminCreditApi.reducerPath]: adminCreditApi.reducer,
    [draftsApi.reducerPath]: draftsApi.reducer,
    [orgApi.reducerPath]: orgApi.reducer,
    [supplierReturnsApi.reducerPath]: supplierReturnsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(allApis.map((api) => api.middleware as Middleware))
      .concat(resetApiStateOnLogout),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
