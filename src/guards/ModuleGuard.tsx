import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import type { ModuleKey } from '../config/modules.config';

interface ModuleGuardProps {
  module: ModuleKey;
}

/**
 * Module-gating guard. Mirrors RoleGuard but gates by the org's active modules.
 *
 * Loading-safe: while /me has not yet loaded (`!loaded`) we render the route and
 * let the backend enforce access — this avoids a false redirect / flicker during
 * the brief bootstrap window. Once loaded, a missing module redirects to /dashboard.
 */
export const ModuleGuard = ({ module }: ModuleGuardProps) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { activeModules, loaded } = useSelector((state: RootState) => state.org);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Modules unknown until /me resolves — allow through (backend still enforces).
  if (!loaded) {
    return <Outlet />;
  }

  if (!activeModules.includes(module)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
