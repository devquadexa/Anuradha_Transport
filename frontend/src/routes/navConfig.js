/**
 * Central nav definition. Each item can declare required permission(s);
 * DashboardLayout filters this list based on the current user so the
 * sidebar reflects role-based access.
 */
export const navConfig = [
  { label: 'Dashboard', path: '/', icon: 'Dashboard' },
  { label: 'Trips', path: '/trips', icon: 'LocalShipping', permission: 'trips:read' },
  { label: 'Reports', path: '/business-trips', icon: 'WorkHistory', permission: 'trips:read' },
  { label: 'Live Tracking', path: '/live-tracking', icon: 'GpsFixed', permission: 'trips:update' },
  { label: 'Driver Status', path: '/driver-status', icon: 'Badge', permission: 'drivers:read' },
  { label: 'Customers', path: '/customers', icon: 'Business', permission: 'customers:read' },
  { label: 'Users', path: '/users', icon: 'People', permission: 'users:read' },
];
