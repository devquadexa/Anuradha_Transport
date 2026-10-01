const Joi = require('joi');

const createLocationSchema = Joi.object({
  customerId: Joi.number().integer().positive().allow(null, ''),
  name: Joi.string().trim().min(1).max(150).required(),
  address: Joi.string().trim().max(255).allow(null, ''),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  contactName: Joi.string().trim().max(100).allow(null, ''),
  contactPhone: Joi.string().trim().max(20).allow(null, ''),
  notes: Joi.string().trim().max(2000).allow(null, ''),
  isActive: Joi.boolean().default(true),
});

const updateLocationSchema = Joi.object({
  customerId: Joi.number().integer().positive().allow(null, ''),
  name: Joi.string().trim().min(1).max(150),
  address: Joi.string().trim().max(255).allow(null, ''),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  contactName: Joi.string().trim().max(100).allow(null, ''),
  contactPhone: Joi.string().trim().max(20).allow(null, ''),
  notes: Joi.string().trim().max(2000).allow(null, ''),
  isActive: Joi.boolean(),
}).min(1);

const listLocationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(100),
  sortBy: Joi.string().valid('name', 'createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC'),
  search: Joi.string().trim().allow(''),
  customerId: Joi.number().integer().positive(),
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

module.exports = { createLocationSchema, updateLocationSchema, listLocationsQuerySchema, idParamSchema };
