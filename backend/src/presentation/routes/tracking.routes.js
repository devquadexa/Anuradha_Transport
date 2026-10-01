const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/authenticate');
const { authorizePermissions } = require('../middleware/authorize');
const Joi = require('joi');
const validate = require('../middleware/validate');

const pingSchema = Joi.object({
  tripId: Joi.number().integer().positive().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  speed: Joi.number().min(0).allow(null),
});

module.exports = (trackingController) => {
  const router = Router();

  router.use(authenticate);

  // Driver posts location ping
  router.post(
    '/ping',
    authorizePermissions('trips:read'),
    validate(pingSchema),
    asyncHandler(trackingController.ping)
  );

  // Admin gets all live driver positions
  router.get(
    '/live',
    authorizePermissions('trips:update'),
    asyncHandler(trackingController.livePositions)
  );

  // Admin gets route history for a trip
  router.get(
    '/trip/:id',
    authorizePermissions('trips:update'),
    asyncHandler(trackingController.tripRoute)
  );

  return router;
};
