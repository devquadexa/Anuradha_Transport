/**
 * Pure helper functions for role/permission checks. Kept in infrastructure
 * because it's tied to how permissions are encoded in the JWT payload, but
 * has no Express dependency itself - middleware wraps these.
 */
function hasRole(user, ...roles) {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
}

function hasPermission(user, permission) {
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes(permission);
}

function hasAnyPermission(user, permissions = []) {
  return permissions.some((p) => hasPermission(user, p));
}

module.exports = { hasRole, hasPermission, hasAnyPermission };
