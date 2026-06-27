import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { logout } from './authSlice';
import type { MeOrganization, OrgRole } from './orgApi';

// In-memory org context. NOT persisted to localStorage so it always reflects the
// latest /me (modules can be toggled server-side; persisting would risk staleness).
interface OrgState {
  organization: MeOrganization | null;
  activeModules: string[];
  // Per-module RBAC context for the viewer (PHASE A). Drives role-aware gating.
  orgRole: OrgRole | null;
  moduleRoles: Record<string, string>;
  canManageRoles: boolean;
  loaded: boolean;
}

const initialState: OrgState = {
  organization: null,
  activeModules: [],
  orgRole: null,
  moduleRoles: {},
  canManageRoles: false,
  loaded: false,
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
      }>
    ) => {
      state.organization = action.payload.organization;
      state.activeModules = action.payload.activeModules;
      if (action.payload.orgRole !== undefined) state.orgRole = action.payload.orgRole;
      if (action.payload.moduleRoles !== undefined) state.moduleRoles = action.payload.moduleRoles;
      if (action.payload.canManageRoles !== undefined) state.canManageRoles = action.payload.canManageRoles;
      state.loaded = true;
    },
    clearOrgContext: (state) => {
      state.organization = null;
      state.activeModules = [];
      state.orgRole = null;
      state.moduleRoles = {};
      state.canManageRoles = false;
      state.loaded = false;
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
    });
  },
});

export const { setOrgContext, clearOrgContext } = orgSlice.actions;

export const selectActiveModules = (state: { org: OrgState }) => state.org.activeModules;
export const selectOrganization = (state: { org: OrgState }) => state.org.organization;
export const selectOrgLoaded = (state: { org: OrgState }) => state.org.loaded;
export const selectOrgRole = (state: { org: OrgState }) => state.org.orgRole;
export const selectModuleRoles = (state: { org: OrgState }) => state.org.moduleRoles;
export const selectCanManageRoles = (state: { org: OrgState }) => state.org.canManageRoles;

export default orgSlice.reducer;
