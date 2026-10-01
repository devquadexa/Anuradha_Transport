const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/authenticate');
const { Division } = require('../../infrastructure/database/sequelize/models');
const ApiResponse = require('../../application/common/ApiResponse');

module.exports = () => {
  const router = Router();

  router.use(authenticate);

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const divisions = await Division.findAll({ order: [['name', 'ASC']] });
      return ApiResponse.success(res, {
        message: 'Divisions retrieved successfully',
        data: divisions.map((d) => ({ id: d.id, name: d.name })),
      });
    })
  );

  return router;
};
