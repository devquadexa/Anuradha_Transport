const Joi = require('joi');

const createDriverSchema = Joi.object({
  userId: Joi.number().integer().positive().allow(null),
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().min(1).max(100).required(),
  nicNumber: Joi.string().trim().min(5).max(20).required(),
  phone: Joi.string().trim().min(7).max(20).required(),
  email: Joi.string().email({ tlds: false }).allow(null, ''),
  licenseNumber: Joi.string().trim().min(3).max(50).required(),
  licenseExpiry: Joi.date().iso().required(),
  address: Joi.string().trim().max(255).allow(null, ''),
  vehicleNumber: Joi.string().trim().max(30).allow(null, ''),
  insuranceProvider: Joi.string().trim().max(150).allow(null, ''),
  insurancePolicyNumber: Joi.string().trim().max(100).allow(null, ''),
  insuranceExpiry: Joi.date().iso().allow(null, ''),
  status: Joi.string().valid('active', 'inactive', 'on_leave', 'suspended').default('active'),
  notes: Joi.string().trim().max(2000).allow(null, ''),
});

const updateDriverSchema = Joi.object({
  userId: Joi.number().integer().positive().allow(null),
  firstName: Joi.string().trim().min(1).max(100),
  lastName: Joi.string().trim().min(1).max(100),
  phone: Joi.string().trim().min(7).max(20),
  email: Joi.string().email({ tlds: false }).allow(null, ''),
  licenseNumber: Joi.string().trim().min(3).max(50),
  licenseExpiry: Joi.date().iso(),
  address: Joi.string().trim().max(255).allow(null, ''),
  vehicleNumber: Joi.string().trim().max(30).allow(null, ''),
  insuranceProvider: Joi.string().trim().max(150).allow(null, ''),
  insurancePolicyNumber: Joi.string().trim().max(100).allow(null, ''),
  insuranceExpiry: Joi.date().iso().allow(null, ''),
  status: Joi.string().valid('active', 'inactive', 'on_leave', 'suspended'),
  notes: Joi.string().trim().max(2000).allow(null, ''),
}).min(1);

const listDriversQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(100),
  sortBy: Joi.string().valid('firstName', 'lastName', 'createdAt', 'status', 'licenseExpiry'),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC'),
  search: Joi.string().trim().allow(''),
  status: Joi.string().valid('active', 'inactive', 'on_leave', 'suspended'),
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

module.exports = { createDriverSchema, updateDriverSchema, listDriversQuerySchema, idParamSchema };
