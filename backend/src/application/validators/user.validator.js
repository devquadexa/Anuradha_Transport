const Joi = require('joi');

const driverFields = {
  nicNumber: Joi.string().trim().min(5).max(20),
  licenseNumber: Joi.string().trim().min(3).max(50),
  licenseExpiry: Joi.string().trim(),
  vehicleNumber: Joi.string().trim().max(30).allow(null, ''),
  insuranceProvider: Joi.string().trim().max(150).allow(null, ''),
  insurancePolicyNumber: Joi.string().trim().max(100).allow(null, ''),
  insuranceExpiry: Joi.string().trim().allow(null, ''),
  address: Joi.string().trim().max(255).allow(null, ''),
  driverNotes: Joi.string().trim().max(2000).allow(null, ''),
};

const createUserSchema = Joi.object({
  roleId: Joi.number().integer().positive().required(),
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().max(20).allow(null, ''),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
  status: Joi.string().valid('active', 'inactive', 'suspended').default('active'),
  // Driver-specific fields (required when role is DRIVER, validated at use-case level)
  ...driverFields,
});

const updateUserSchema = Joi.object({
  roleId: Joi.number().integer().positive(),
  firstName: Joi.string().trim().min(1).max(100),
  lastName: Joi.string().trim().min(1).max(100),
  phone: Joi.string().trim().max(20).allow(null, ''),
  status: Joi.string().valid('active', 'inactive', 'suspended'),
  // Driver-specific fields
  ...driverFields,
}).min(1);

const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(100),
  sortBy: Joi.string().valid('firstName', 'lastName', 'email', 'createdAt', 'status'),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC'),
  search: Joi.string().trim().allow(''),
  status: Joi.string().valid('active', 'inactive', 'suspended'),
  roleId: Joi.number().integer().positive(),
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
  idParamSchema,
};
