const ApiResponse = require('../../application/common/ApiResponse');
const { toLocationResponseDto } = require('../../application/dtos/LocationDto');
const { parsePagination, buildMeta } = require('../../application/common/Pagination');

class LocationController {
  constructor({ locationRepository }) {
    this.locationRepository = locationRepository;
  }

  create = async (req, res) => {
    const location = await this.locationRepository.create({ ...req.body, createdBy: req.user.id });
    return ApiResponse.success(res, {
      message: 'Location created successfully',
      data: toLocationResponseDto(location),
      statusCode: 201,
    });
  };

  getById = async (req, res) => {
    const location = await this.locationRepository.findById(req.params.id);
    if (!location) {
      return ApiResponse.error(res, { message: 'Location not found', statusCode: 404 });
    }
    return ApiResponse.success(res, {
      message: 'Location retrieved successfully',
      data: toLocationResponseDto(location),
    });
  };

  list = async (req, res) => {
    const pagination = parsePagination(req.query);
    const options = { ...pagination, customerId: req.query.customerId };
    const { rows, total } = await this.locationRepository.list(options);
    return ApiResponse.success(res, {
      message: 'Locations retrieved successfully',
      data: rows.map(toLocationResponseDto),
      meta: buildMeta({ page: pagination.page, pageSize: pagination.pageSize, total }),
    });
  };

  listActive = async (req, res) => {
    const locations = await this.locationRepository.listActive(req.query.customerId);
    return ApiResponse.success(res, {
      message: 'Active locations retrieved successfully',
      data: locations.map(toLocationResponseDto),
    });
  };

  update = async (req, res) => {
    const location = await this.locationRepository.update(req.params.id, { ...req.body, updatedBy: req.user.id });
    return ApiResponse.success(res, {
      message: 'Location updated successfully',
      data: toLocationResponseDto(location),
    });
  };

  remove = async (req, res) => {
    await this.locationRepository.softDelete(req.params.id);
    return ApiResponse.success(res, { message: 'Location deleted successfully' });
  };
}

module.exports = LocationController;
