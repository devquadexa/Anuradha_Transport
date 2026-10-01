const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { authorizePermissions } = require('../middleware/authorize');
const {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
  idParamSchema,
} = require('../../application/validators/customer.validator');

module.exports = (customerController) => {
  const router = Router();

  router.use(authenticate);

  router.get(
    '/',
    authorizePermissions('customers:read'),
    validate(listCustomersQuerySchema, 'query'),
    asyncHandler(customerController.list)
  );

  router.get(
    '/:id',
    authorizePermissions('customers:read'),
    validate(idParamSchema, 'params'),
    asyncHandler(customerController.getById)
  );

  router.post(
    '/',
    authorizePermissions('customers:create'),
    validate(createCustomerSchema),
    asyncHandler(customerController.create)
  );

  router.put(
    '/:id',
    authorizePermissions('customers:update'),
    validate(idParamSchema, 'params'),
    validate(updateCustomerSchema),
    asyncHandler(customerController.update)
  );

  router.delete(
    '/:id',
    authorizePermissions('customers:delete'),
    validate(idParamSchema, 'params'),
    asyncHandler(customerController.remove)
  );

  return router;
};
