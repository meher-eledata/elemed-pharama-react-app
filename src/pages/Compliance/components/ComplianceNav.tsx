import React from 'react';
import { Tab, Tabs } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { COMPLIANCE_CONSTANTS } from '../../../config/constants/Compliance.constants';
import { COMPLIANCE_LABELS } from '../../../config/label/Compliance.labels';

const L = COMPLIANCE_LABELS;
const C = COMPLIANCE_CONSTANTS;

// The same pages are mounted under both portals (like /master and /admin/master):
// the endpoints are identical and the ROLE decides capability, not the route.
export const complianceBasePath = (pathname: string): string =>
  pathname.startsWith('/admin') ? C.ADMIN_ROUTE_BASE : C.ROUTE_BASE;

// Tab styling mirrors the Sales history tabs so the app has one tab language.
const tabsSx = {
  mb: 1,
  minHeight: '2.5rem',
  borderBottom: '0.0625rem solid #E6ECF5',
  '& .MuiTabs-indicator': { backgroundColor: '#5C17E5', height: '0.1875rem' },
  '& .MuiTab-root': {
    minHeight: '2.5rem',
    padding: '0 1rem',
    fontFamily: C.FONT,
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'none',
    color: '#728197',
  },
  '& .Mui-selected': { color: '#5C17E5' },
} as const;

const ComplianceNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const base = complianceBasePath(location.pathname);
  const isAdminPortal = base === C.ADMIN_ROUTE_BASE;

  // Calendar leads: it is the module's landing surface (the base path redirects
  // here), so the first tab and the default destination are the same page.
  // Settings (document types + reminder lead days) is an admin-portal surface only.
  const tabs = [
    { label: L.NAV.CALENDAR, path: `${base}/${C.CALENDAR_PATH}` },
    { label: L.NAV.DOCUMENTS, path: `${base}/${C.DOCUMENTS_PATH}` },
    ...(isAdminPortal ? [{ label: L.NAV.SETTINGS, path: `${base}/${C.SETTINGS_PATH}` }] : []),
  ];

  const active = tabs.findIndex((tab) => tab.path === location.pathname);

  return (
    <Tabs
      value={active === -1 ? 0 : active}
      onChange={(_, value: number) => navigate(tabs[value].path)}
      sx={tabsSx}
    >
      {tabs.map((tab) => (
        <Tab key={tab.path} label={tab.label} />
      ))}
    </Tabs>
  );
};

export default ComplianceNav;
