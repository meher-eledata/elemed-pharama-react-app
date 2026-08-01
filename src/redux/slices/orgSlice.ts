import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { logout } from './authSlice';
import type { Location, MeOrganization, OrgRole } from './orgApi';

// In-memory org context. NOT persisted to localStorage so it always reflects the
// latest /me (modules can be toggled server-side; persisting would risk staleness).
// Exception: the chosen location id persists under CURRENT_LOCATION_STORAGE_KEY so
// a multi-location user keeps their branch across reloads (revalidated on /me load).
interface OrgState {
  organization: MeOrganization | null;
  activeModules: string[];
  // Per-module RBAC context for the viewer (PHASE A). Drives role-aware gating.
  orgRole: OrgRole | null;
  moduleRoles: Record<string, string>;
  canManageRoles: boolean;
  loaded: boolean;
  // Multi-location: the org's locations (from /me) + the working location. All
  // API requests carry `x-location-id` when currentLocationId != null.
  locations: Location[];
  currentLocationId: number | null;
}

export const CURRENT_LOCATION_STORAGE_KEY = 'pharma_current_location';

const readPersistedLocationId = (): number | null => {
  try {
    const raw = localStorage.getItem(CURRENT_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const id = Number(raw);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
};

const persistLocationId = (id: number | null): void => {
  try {
    if (id == null) localStorage.removeItem(CURRENT_LOCATION_STORAGE_KEY);
    else localStorage.setItem(CURRENT_LOCATION_STORAGE_KEY, String(id));
  } catch {
    // Storage unavailable — selection just won't survive a reload.
  }
};

const initialState: OrgState = {
  organization: null,
  activeModules: [],
  orgRole: null,
  moduleRoles: {},
  canManageRoles: false,
  loaded: false,
  locations: [],
  currentLocationId: null,
};

export const orgSlice = createSlice({
  name: 'org',
  initialState,
  reducers: {
    setOrgContext: (
      state,
      action: PayloadAction<{
        organization: MeOrganization | null;
        activeModules: string[];
        // Role context is optional so callers that only update modules (e.g. Settings'
        // module toggle) need not re-supply it.
        orgRole?: OrgRole | null;
        moduleRoles?: Record<string, string>;
        canManageRoles?: boolean;
        // Optional so callers that only update modules need not re-supply it.
        locations?: Location[];
      }>
    ) => {
      state.organization = action.payload.organization;
      state.activeModules = action.payload.activeModules;
      if (action.payload.orgRole !== undefined) state.orgRole = action.payload.orgRole;
      if (action.payload.moduleRoles !== undefined) state.moduleRoles = action.payload.moduleRoles;
      if (action.payload.canManageRoles !== undefined) state.canManageRoles = action.payload.canManageRoles;
      if (action.payload.locations !== undefined) {
        state.locations = action.payload.locations;
        // Resolve the working location: keep the persisted choice if it is still
        // an active listed location; else default to the single active location;
        // else null (the user must pick one in the top bar).
        const active = action.payload.locations.filter((l) => l.status === 1);
        const persisted = readPersistedLocationId();
        let next: number | null = null;
        if (persisted != null && active.some((l) => l.id === persisted)) {
          next = persisted;
        } else if (active.length === 1) {
          next = active[0].id;
        }
        state.currentLocationId = next;
        persistLocationId(next);
      }
      state.loaded = true;
    },
    setCurrentLocation: (state, action: PayloadAction<number | null>) => {
      state.currentLocationId = action.payload;
      persistLocationId(action.payload);
    },
    clearOrgContext: (state) => {
      state.organization = null;
      state.activeModules = [];
      state.orgRole = null;
      state.moduleRoles = {};
      state.canManageRoles = false;
      state.loaded = false;
      state.locations = [];
      state.currentLocationId = null;
    },
  },
  // Reset org context whenever the user logs out, regardless of where logout is
  // dispatched (TopBar menu, baseQuery 401 handler, etc.).
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.organization = null;
      state.activeModules = [];
      state.orgRole = null;
      state.moduleRoles = {};
      state.canManageRoles = false;
      state.loaded = false;
      // In-memory location context resets; the persisted id is kept so the same
      // user gets their branch back on re-login (revalidated against /me).
      state.locations = [];
      state.currentLocationId = null;
    });
  },
});

export const { setOrgContext, setCurrentLocation, clearOrgContext } = orgSlice.actions;

export const selectActiveModules = (state: { org: OrgState }) => state.org.activeModules;
// Defensive (`org?.`): some component tests build minimal stores without the org
// reducer; production stores always have it.
export const selectOrganization = (state: { org?: OrgState }) => state.org?.organization ?? null;

const EMPTY_LOCATIONS: Location[] = [];
export const selectLocations = (state: { org?: OrgState }) =>
  state.org?.locations ?? EMPTY_LOCATIONS;
export const selectCurrentLocationId = (state: { org?: OrgState }) =>
  state.org?.currentLocationId ?? null;
export const selectActiveLocations = createSelector([selectLocations], (locations) =>
  locations.filter((l) => l.status === 1)
);
export const selectCurrentLocation = createSelector(
  [selectLocations, selectCurrentLocationId],
  (locations, id): Location | null => locations.find((l) => l.id === id) ?? null
);
export const selectOrgLoaded = (state: { org: OrgState }) => state.org.loaded;
export const selectOrgRole = (state: { org: OrgState }) => state.org.orgRole;
export const selectModuleRoles = (state: { org: OrgState }) => state.org.moduleRoles;
export const selectCanManageRoles = (state: { org: OrgState }) => state.org.canManageRoles;

// UX gate (backend still enforces per-endpoint): a module is accessible when it is
// active AND the viewer is an org admin/superadmin OR holds a role within it.
export const selectHasModuleAccess =
  (moduleKey: string) =>
  (state: { org: OrgState }): boolean => {
    const { activeModules, orgRole, moduleRoles } = state.org;
    if (!activeModules.includes(moduleKey)) return false;
    return orgRole === 'superadmin' || orgRole === 'admin' || !!moduleRoles[moduleKey];
  };

// The viewer can reach the Org Management area when they are an org admin/superadmin.
export const selectCanManageOrg = (state: { org: OrgState }): boolean =>
  state.org.orgRole === 'superadmin' || state.org.orgRole === 'admin';

export const selectIsSuperadmin = (state: { org: OrgState }): boolean =>
  state.org.orgRole === 'superadmin';

export default orgSlice.reducer;
