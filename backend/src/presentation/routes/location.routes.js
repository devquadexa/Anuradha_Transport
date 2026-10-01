const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { authorizePermissions } = require('../middleware/authorize');
const {
  createLocationSchema,
  updateLocationSchema,
  listLocationsQuerySchema,
  idParamSchema,
} = require('../../application/validators/location.validator');

module.exports = (locationController) => {
  const router = Router();

  router.use(authenticate);

  router.get(
    '/active',
    authorizePermissions('customers:read', 'trips:create', 'trips:update'),
    asyncHandler(locationController.listActive)
  );

  router.get(
    '/',
    authorizePermissions('customers:read'),
    validate(listLocationsQuerySchema, 'query'),
    asyncHandler(locationController.list)
  );

  router.get(
    '/:id',
    authorizePermissions('customers:read'),
    validate(idParamSchema, 'params'),
    asyncHandler(locationController.getById)
  );

  router.post(
    '/',
    authorizePermissions('customers:create'),
    validate(createLocationSchema),
    asyncHandler(locationController.create)
  );

  router.put(
    '/:id',
    authorizePermissions('customers:update'),
    validate(idParamSchema, 'params'),
    validate(updateLocationSchema),
    asyncHandler(locationController.update)
  );

  router.delete(
    '/:id',
    authorizePermissions('customers:delete'),
    validate(idParamSchema, 'params'),
    asyncHandler(locationController.remove)
  );

  return router;
};
