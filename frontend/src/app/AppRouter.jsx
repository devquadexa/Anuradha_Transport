import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from '../routes/ProtectedRoute';
import LoginPage from '../features/auth/pages/LoginPage';
import UnauthorizedPage from '../features/auth/pages/UnauthorizedPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import UsersListPage from '../features/users/pages/UsersListPage';
import CustomersListPage from '../features/customers/pages/CustomersListPage';
import TripsListPage from '../features/trips/pages/TripsListPage';
import BusinessTripsPage from '../features/trips/pages/BusinessTripsPage';
import LocationsListPage from '../features/locations/pages/LocationsListPage';
import LiveTrackingPage from '../features/tracking/pages/LiveTrackingPage';
import DriverStatusPage from '../features/drivers/pages/DriverStatusPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />

          <Route element={<ProtectedRoute permissions={['trips:read']} />}>
            <Route path="/trips" element={<TripsListPage />} />
          </Route>

          <Route element={<ProtectedRoute permissions={['trips:read']} />}>
            <Route path="/business-trips" element={<BusinessTripsPage />} />
          </Route>

          <Route element={<ProtectedRoute permissions={['trips:update']} />}>
            <Route path="/live-tracking" element={<LiveTrackingPage />} />
          </Route>

          <Route element={<ProtectedRoute permissions={['drivers:read']} />}>
            <Route path="/driver-status" element={<DriverStatusPage />} />
          </Route>

          <Route element={<ProtectedRoute permissions={['customers:read']} />}>
            <Route path="/customers" element={<CustomersListPage />} />
          </Route>

          <Route element={<ProtectedRoute permissions={['users:read']} />}>
            <Route path="/users" element={<UsersListPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
