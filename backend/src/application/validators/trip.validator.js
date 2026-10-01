const Joi = require('joi');

const tripStopSchema = Joi.object({
  locationId: Joi.number().integer().positive().allow(null),
  locationName: Joi.string().trim().min(1).max(255).required(),
  address: Joi.string().trim().max(255).allow(null, ''),
  contactName: Joi.string().trim().max(100).allow(null, ''),
  contactPhone: Joi.string().trim().max(20).allow(null, ''),
  notes: Joi.string().trim().max(255).allow(null, ''),
});

const createTripSchema = Joi.object({
  customerId: Joi.number().integer().positive().required(),
  driverId: Joi.number().integer().positive().allow(null),
  origin: Joi.string().trim().min(1).max(255).required(),
  destination: Joi.string().trim().min(1).max(255).required(),
  endPoint: Joi.string().trim().max(255).allow(null, ''),
  scheduledDate: Joi.date().iso().required(),
  scheduledTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .allow(null, '')
    .messages({ 'string.pattern.base': 'scheduledTime must be in HH:mm format' }),
  cargoDescription: Joi.string().trim().max(255).allow(null, ''),
  remarks: Joi.string().trim().max(2000).allow(null, ''),
  stops: Joi.array().items(tripStopSchema).default([]),
});

const updateTripSchema = Joi.object({
  customerId: Joi.number().integer().positive(),
  origin: Joi.string().trim().min(1).max(255),
  destination: Joi.string().trim().min(1).max(255),
  endPoint: Joi.string().trim().max(255).allow(null, ''),
  scheduledDate: Joi.date().iso(),
  scheduledTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .allow(null, ''),
  cargoDescription: Joi.string().trim().max(255).allow(null, ''),
  remarks: Joi.string().trim().max(2000).allow(null, ''),
  stops: Joi.array().items(tripStopSchema),
}).min(1);

const assignTripSchema = Joi.object({
  driverId: Joi.number().integer().positive().required(),
});

const updateTripStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'assigned', 'in_progress', 'completed', 'cancelled').required(),
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
  finalOdometerReading: Joi.number().min(0).precision(2).allow(null),
});

const updateTripDriverDetailsSchema = Joi.object({
  driverMileage: Joi.number().min(0).precision(2).allow(null),
  odometerReading: Joi.number().min(0).precision(2).allow(null),
  invoices: Joi.array().items(Joi.string().trim().min(1).max(100)).allow(null),
  invoiceNumber: Joi.string().trim().max(100).allow(null, ''),
  status: Joi.string().valid('arrived', 'delivered', 'skipped').allow(null),
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
  gpsLocationName: Joi.string().trim().max(255).allow(null, ''),
  gpsMileage: Joi.number().min(0).precision(2).allow(null),
}).min(1);

const approveTripSchema = Joi.object({
  approved: Joi.boolean().required(),
  rejectionReason: Joi.string().trim().max(2000).allow(null, ''),
});

const emergencyStopSchema = Joi.object({
  active: Joi.boolean().required(),
  reason: Joi.string().trim().max(255).allow(null, ''),
});

const reorderStopsSchema = Joi.object({
  stops: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().integer().positive().required(),
        expectedMileage: Joi.number().min(0).precision(2).allow(null),
      })
    )
    .min(1)
    .required(),
});

const stopIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  stopId: Joi.number().integer().positive().required(),
});

const listTripsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(100),
  sortBy: Joi.string().valid('scheduledDate', 'createdAt', 'completedAt', 'status', 'tripNumber'),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC'),
  search: Joi.string().trim().allow(''),
  status: Joi.string().valid('pending', 'assigned', 'in_progress', 'completed', 'cancelled'),
  approvalStatus: Joi.string().valid('pending', 'approved', 'rejected'),
  driverId: Joi.number().integer().positive(),
  customerId: Joi.number().integer().positive(),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

module.exports = {
  createTripSchema,
  updateTripSchema,
  assignTripSchema,
  updateTripStatusSchema,
  updateTripDriverDetailsSchema,
  approveTripSchema,
  emergencyStopSchema,
  reorderStopsSchema,
  listTripsQuerySchema,
  idParamSchema,
  stopIdParamSchema,
};
