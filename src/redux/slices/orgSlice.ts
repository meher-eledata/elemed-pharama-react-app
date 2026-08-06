import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { logout } from './authSlice';
import type { MeOrganization } from './orgApi';

// In-memory org context. NOT persisted to localStorage so it always reflects the
// latest /me (modules can be toggled server-side; persisting would risk staleness).
interface OrgState {
  organization: MeOrganization | null;
  activeModules: string[];
  loaded: boolean;
}

const initialState: OrgState = {
  organization: null,
  activeModules: [],
  loaded: false,
};

export const orgSlice = createSlice({
  name: 'org',
  initialState,
  reducers: {
    setOrgContext: (
      state,
      action: PayloadAction<{ organization: MeOrganization | null; activeModules: string[] }>
    ) => {
      state.organization = action.payload.organization;
      state.activeModules = action.payload.activeModules;
      state.loaded = true;
    },
    clearOrgContext: (state) => {
      state.organization = null;
      state.activeModules = [];
      state.loaded = false;
    },
  },
  // Reset org context whenever the user logs out, regardless of where logout is
  // dispatched (TopBar menu, baseQuery 401 handler, etc.).
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.organization = null;
      state.activeModules = [];
      state.loaded = false;
    });
  },
});

export const { setOrgContext, clearOrgContext } = orgSlice.actions;

export const selectActiveModules = (state: { org: OrgState }) => state.org.activeModules;
export const selectOrganization = (state: { org: OrgState }) => state.org.organization;
export const selectOrgLoaded = (state: { org: OrgState }) => state.org.loaded;

export default orgSlice.reducer;
