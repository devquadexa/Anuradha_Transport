const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { authorizePermissions } = require('../middleware/authorize');
const {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
  idParamSchema,
} = require('../../application/validators/user.validator');

/**
 * @param {import('../controllers/user.controller')} userController - instantiated controller from container
 */
module.exports = (userController) => {
  const router = Router();

  router.use(authenticate);

  /**
   * @swagger
   * /api/v1/users:
   *   get:
   *     summary: List users with pagination, filtering, search, sorting
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Users retrieved successfully }
   */
  router.get(
    '/',
    authorizePermissions('users:read'),
    validate(listUsersQuerySchema, 'query'),
    asyncHandler(userController.list)
  );

  /**
   * @swagger
   * /api/v1/users/{id}:
   *   get:
   *     summary: Get a single user by id
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: User retrieved successfully }
   *       404: { description: User not found }
   */
  router.get(
    '/:id',
    authorizePermissions('users:read'),
    validate(idParamSchema, 'params'),
    asyncHandler(userController.getById)
  );

  /**
   * @swagger
   * /api/v1/users:
   *   post:
   *     summary: Create a new user
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       201: { description: User created successfully }
   *       409: { description: Email already exists }
   */
  router.post(
    '/',
    authorizePermissions('users:create'),
    validate(createUserSchema),
    asyncHandler(userController.create)
  );

  /**
   * @swagger
   * /api/v1/users/{id}:
   *   put:
   *     summary: Update an existing user
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: User updated successfully }
   *       404: { description: User not found }
   */
  router.put(
    '/:id',
    authorizePermissions('users:update'),
    validate(idParamSchema, 'params'),
    validate(updateUserSchema),
    asyncHandler(userController.update)
  );

  /**
   * @swagger
   * /api/v1/users/{id}:
   *   delete:
   *     summary: Soft-delete a user
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: User deleted successfully }
   *       404: { description: User not found }
   */
  router.delete(
    '/:id',
    authorizePermissions('users:delete'),
    validate(idParamSchema, 'params'),
    asyncHandler(userController.remove)
  );

  return router;
};
