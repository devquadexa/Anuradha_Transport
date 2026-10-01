const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { authorizePermissions } = require('../middleware/authorize');
const {
  createDriverSchema,
  updateDriverSchema,
  listDriversQuerySchema,
  idParamSchema,
} = require('../../application/validators/driver.validator');

module.exports = (driverController) => {
  const router = Router();

  router.use(authenticate);

  // Lightweight lookup for trip-assignment dropdowns - must be registered
  // before the paginated list/detail routes so "/active" isn't captured by "/:id".
  router.get(
    '/active',
    authorizePermissions('drivers:read', 'trips:create', 'trips:update', 'trips:assign'),
    asyncHandler(driverController.listActive)
  );

  // List user accounts with DRIVER role that are not yet linked to a driver profile
  router.get(
    '/linkable-users',
    authorizePermissions('drivers:create', 'drivers:update'),
    asyncHandler(driverController.listLinkableUsers)
  );

  router.get(
    '/',
    authorizePermissions('drivers:read'),
    validate(listDriversQuerySchema, 'query'),
    asyncHandler(driverController.list)
  );

  router.get(
    '/:id',
    authorizePermissions('drivers:read'),
    validate(idParamSchema, 'params'),
    asyncHandler(driverController.getById)
  );

  router.post(
    '/',
    authorizePermissions('drivers:create'),
    validate(createDriverSchema),
    asyncHandler(driverController.create)
  );

  router.put(
    '/:id',
    authorizePermissions('drivers:update'),
    validate(idParamSchema, 'params'),
    validate(updateDriverSchema),
    asyncHandler(driverController.update)
  );

  router.delete(
    '/:id',
    authorizePermissions('drivers:delete'),
    validate(idParamSchema, 'params'),
    asyncHandler(driverController.remove)
  );

  return router;
};
