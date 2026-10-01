const { ForbiddenError } = require('../../domain/errors');
const { hasRole, hasAnyPermission } = require('../../infrastructure/auth/rbac');

/**
 * RBAC middleware factories. Use `authorizeRoles` for coarse-grained role
 * checks and `authorizePermissions` for fine-grained module:action checks.
 * Must run after `authenticate`.
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!hasRole(req.user, ...roles)) {
      return next(new ForbiddenError('You do not have the required role for this action'));
    }
    return next();
  };
}

function authorizePermissions(...permissions) {
  return (req, res, next) => {
    if (!hasAnyPermission(req.user, permissions)) {
      return next(new ForbiddenError('You do not have the required permission for this action'));
    }
    return next();
  };
}

module.exports = { authorizeRoles, authorizePermissions };
