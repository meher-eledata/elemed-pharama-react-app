import React from 'react';
import { Box } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import DollarIcon from '../assets/Dollor.svg';
import BoxIcon from '../assets/Box.svg';
import MailIcon from '../assets/Mail.svg';

// Client-side module registry. Mirrors the backend `config/modules.js`.
// An org enables a subset of these; the UI is gated by `state.org.activeModules`.
export type ModuleKey = 'pharmacy' | 'inpatient';

// Shape compatible with SideBar.tsx's local `SidebarItem` interface so module
// items can be rendered by the existing sidebar without any mapping.
export interface SidebarItem {
  id: string;
  icon: string | React.ReactNode;
  alt: string;
  iconWidth: string;
  iconHeight: string;
  marginTop: string;
  label: string;
  route?: string;
  isComponent?: boolean;
}

// Local copy of SideBar.tsx's WhiteIcon wrapper so the Master icon renders
// pixel-identically when sourced from the registry.
const WhiteIcon: React.FC<{ children: React.ReactElement }> = ({ children }) => (
  React.createElement(
    Box,
    {
      sx: {
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& svg': {
          fill: 'white !important',
          color: 'white !important',
          '& path, & circle, & rect, & polygon': {
            fill: 'white !important',
            stroke: 'white !important',
          },
        },
      },
    },
    children,
  )
);

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  description: string;
  sidebarItems: SidebarItem[];
}

export const MODULES: Record<ModuleKey, ModuleDefinition> = {
  pharmacy: {
    key: 'pharmacy',
    label: 'Pharmacy',
    description: 'Pharmacy management: sales, inventory, order receive and master data.',
    // Exact non-Home baseItems from SideBar.tsx so the rendered sidebar is pixel-identical.
    sidebarItems: [
      { id: 'dollar', icon: DollarIcon, alt: 'Dollar', label: 'Sales', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/sales' },
      { id: 'box', icon: BoxIcon, alt: 'Box', label: 'Inventory', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/inventory' },
      { id: 'mail', icon: MailIcon, alt: 'Mail', label: 'Order Receive', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/receive' },
      { id: 'master', icon: React.createElement(WhiteIcon, null, React.createElement(StorageIcon, { sx: { fontSize: 24 } })), alt: 'Master', label: 'Master', iconWidth: '24px', iconHeight: '24px', marginTop: '5px', route: '/master', isComponent: true },
    ],
  },
  inpatient: {
    key: 'inpatient',
    label: 'Inpatient',
    description: 'Inpatient module (no pages yet).',
    sidebarItems: [],
  },
};

// Registry order — used to render module sidebar items deterministically.
export const ALL_MODULE_KEYS: ModuleKey[] = ['pharmacy', 'inpatient'];
