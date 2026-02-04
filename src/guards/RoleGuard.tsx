import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

interface RoleGuardProps {
    allowedRoles: string[];
}

/**
 * Role-Based Access Control Guard
 * Redirects or shows 403 if user doesn't have required permissions
 */
export const RoleGuard = ({ allowedRoles }: RoleGuardProps) => {
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const userRole = user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
        // If user's role is not allowed, redirect to dashboard or show unauthorized
        // For now, redirecting to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};
