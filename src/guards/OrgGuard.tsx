import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { selectOrgLoaded, selectCanManageOrg } from '../redux/slices/orgSlice';
import { COMING_SOON_AREA_KEYS } from '../config/areas.config';

/**
 * Org Management guard. Mirrors RoleGuard/ModuleGuard: allows an authenticated
 * org admin/superadmin into the /org section, otherwise redirects to /home (the
 * launcher, which routes the user to whatever they can actually access).
 *
 * Loading-safe: while /me has not yet resolved (`!loaded`) we render through and
 * let the backend enforce access — avoids a false redirect during bootstrap.
 */
export const OrgGuard = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const loaded = useSelector(selectOrgLoaded);
  const canManageOrg = useSelector((state: RootState) => selectCanManageOrg(state));

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // The whole Org area is currently gated as "Coming Soon" — not navigable even
  // for superadmins. Redirect direct visits straight to the pharmacy home.
  if (COMING_SOON_AREA_KEYS.includes('org')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!loaded) {
    return <Outlet />;
  }

  if (!canManageOrg) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};
