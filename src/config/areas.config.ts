import React from 'react';
import { useSelector } from 'react-redux';
import LocalPharmacyOutlinedIcon from '@mui/icons-material/LocalPharmacyOutlined';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import BusinessIcon from '@mui/icons-material/Business';
import SvgIcon from '@mui/material/SvgIcon';
import {
  selectHasModuleAccess,
  selectCanManageOrg,
  selectOrgLoaded,
} from '../redux/slices/orgSlice';
import type { RootState } from '../redux/store';
import { COMING_SOON_MODULE_KEYS, type ModuleKey } from './modules.config';

// An "area" is a top-level destination the user can switch between: each active
// product module (Pharmacy, Outpatient) plus the dedicated Org Management section.
// This is the model behind the launcher home and the header module switcher.
export type AreaKey = ModuleKey | 'org';
export type AreaKind = 'module' | 'org';

export interface AreaDefinition {
  key: AreaKey;
  label: string;
  description: string;
  homeRoute: string;
  kind: AreaKind;
  icon: typeof SvgIcon;
}

// Ordered registry. The launcher renders tiles and the switcher renders options
// in this order. `inpatient` is intentionally omitted (no pages yet).
export const AREAS: AreaDefinition[] = [
  {
    key: 'pharmacy',
    label: 'Pharmacy',
    description: 'Sales, inventory, order receive and master data.',
    homeRoute: '/dashboard',
    kind: 'module',
    icon: LocalPharmacyOutlinedIcon,
  },
  {
    key: 'outpatient',
    label: 'Outpatient',
    description: 'Appointments, booking, walk-ins and the live queue.',
    homeRoute: '/outpatient',
    kind: 'module',
    icon: EventAvailableIcon,
  },
  {
    key: 'org',
    label: 'Org Management',
    description: 'Roles, modules and organization settings.',
    homeRoute: '/org',
    kind: 'org',
    icon: BusinessIcon,
  },
];

// Areas gated as "Coming Soon": never navigable, regardless of role/module
// access. Coming-soon modules ride on the module registry; the whole Org
// Management area is additionally gated until org-level settings ship — the app
// presents only the pharmacy module UI for now.
export const COMING_SOON_AREA_KEYS: AreaKey[] = [...COMING_SOON_MODULE_KEYS, 'org'];

/**
 * Maps a pathname to the area it belongs to. `/outpatient*` → outpatient,
 * `/org*` → org, everything else (/dashboard, /sales, /inventory, /receive,
 * /master, /admin, /profile) → pharmacy.
 */
export const currentAreaKeyFromPath = (pathname: string): AreaKey => {
  if (pathname === '/outpatient' || pathname.startsWith('/outpatient/')) return 'outpatient';
  if (pathname === '/org' || pathname.startsWith('/org/')) return 'org';
  return 'pharmacy';
};

/**
 * Returns the AREAS the current viewer can access, in registry order. Module
 * areas are gated by `selectHasModuleAccess` (active module AND superadmin/admin
 * or a role within it); the org area by `selectCanManageOrg`. Returns [] until
 * org context has loaded so callers can render a loading state instead of
 * flashing the wrong destination.
 */
export const useAccessibleAreas = (): AreaDefinition[] => {
  const loaded = useSelector(selectOrgLoaded);
  const hasPharmacy = useSelector(selectHasModuleAccess('pharmacy'));
  const hasOutpatient = useSelector(selectHasModuleAccess('outpatient'));
  const canManageOrg = useSelector((state: RootState) => selectCanManageOrg(state));

  if (!loaded) return [];

  const access: Record<AreaKey, boolean> = {
    pharmacy: hasPharmacy,
    inpatient: false,
    outpatient: hasOutpatient,
    org: canManageOrg,
  };

  // Coming-soon areas are never accessible destinations, whatever the access.
  return AREAS.filter((area) => access[area.key] && !COMING_SOON_AREA_KEYS.includes(area.key));
};

// Re-export so consumers can render an area icon without importing MUI directly.
export const renderAreaIcon = (area: AreaDefinition, fontSize: number): React.ReactNode =>
  React.createElement(area.icon, { sx: { fontSize } });
