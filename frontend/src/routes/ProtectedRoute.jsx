import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

/**
 * Guards nested routes behind authentication. Optionally restricts access
 * further by role or permission for role-based navigation/authorization.
 */
export default function ProtectedRoute({ roles = [], permissions = [] }) {
  const { isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !hasRole(...roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (permissions.length > 0 && !permissions.some((p) => hasPermission(p))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
