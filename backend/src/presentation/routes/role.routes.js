const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/authenticate');
const { authorizePermissions } = require('../middleware/authorize');

/**
 * @param {import('../controllers/role.controller')} roleController
 */
module.exports = (roleController) => {
  const router = Router();

  router.use(authenticate);

  /**
   * @swagger
   * /api/v1/roles:
   *   get:
   *     summary: List all roles (for role-assignment dropdowns in User Management)
   *     tags: [Roles]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Roles retrieved successfully }
   */
  router.get('/', authorizePermissions('roles:read', 'users:create', 'users:update'), asyncHandler(roleController.list));

  return router;
};
