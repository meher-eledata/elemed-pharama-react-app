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

    // Normalize user role to string for comparison
    // 0 is admin, 1 is pharmacist (as per user feedback)
    const normalizedRole = typeof userRole === 'number'
        ? (userRole === 0 ? 'admin' : 'pharmacist')
        : (userRole?.toString().toLowerCase());

    const isAuthorized = normalizedRole && allowedRoles.map(r => r.toLowerCase()).includes(normalizedRole);

    if (!isAuthorized) {
        // If user's role is not allowed, redirect to dashboard or show unauthorized
        // For now, redirecting to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};
