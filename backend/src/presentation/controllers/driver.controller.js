const ApiResponse = require('../../application/common/ApiResponse');
const { toDriverResponseDto } = require('../../application/dtos/DriverDto');
const { parsePagination, buildMeta } = require('../../application/common/Pagination');

class DriverController {
  constructor({
    createDriverUseCase,
    getDriverUseCase,
    listDriversUseCase,
    listActiveDriversUseCase,
    updateDriverUseCase,
    deleteDriverUseCase,
    userRepository,
    driverRepository,
  }) {
    this.createDriverUseCase = createDriverUseCase;
    this.getDriverUseCase = getDriverUseCase;
    this.listDriversUseCase = listDriversUseCase;
    this.listActiveDriversUseCase = listActiveDriversUseCase;
    this.updateDriverUseCase = updateDriverUseCase;
    this.deleteDriverUseCase = deleteDriverUseCase;
    this.userRepository = userRepository;
    this.driverRepository = driverRepository;
  }

  create = async (req, res) => {
    const driver = await this.createDriverUseCase.execute({ ...req.body, createdBy: req.user.id });
    return ApiResponse.success(res, {
      message: 'Driver created successfully',
      data: toDriverResponseDto(driver),
      statusCode: 201,
    });
  };

  getById = async (req, res) => {
    const driver = await this.getDriverUseCase.execute(req.params.id);
    return ApiResponse.success(res, {
      message: 'Driver retrieved successfully',
      data: toDriverResponseDto(driver),
    });
  };

  list = async (req, res) => {
    const pagination = parsePagination(req.query);
    const options = { ...pagination, status: req.query.status };
    const { rows, total } = await this.listDriversUseCase.execute(options);

    return ApiResponse.success(res, {
      message: 'Drivers retrieved successfully',
      data: rows.map(toDriverResponseDto),
      meta: buildMeta({ page: pagination.page, pageSize: pagination.pageSize, total }),
    });
  };

  listActive = async (req, res) => {
    const drivers = await this.listActiveDriversUseCase.execute();
    return ApiResponse.success(res, {
      message: 'Active drivers retrieved successfully',
      data: drivers.map(toDriverResponseDto),
    });
  };

  listLinkableUsers = async (req, res) => {
    // Get all users with DRIVER role that are not already linked to a driver profile
    const { rows } = await this.userRepository.list({ page: 1, pageSize: 200, offset: 0, sortBy: 'firstName', sortOrder: 'ASC', roleId: undefined });
    // Filter to DRIVER role users
    const driverRoleUsers = rows.filter((u) => u.roleName === 'DRIVER' && u.status === 'active');

    // Get all driver profiles to find which user IDs are already linked
    const { rows: allDrivers } = await this.driverRepository.list({ page: 1, pageSize: 1000, offset: 0, sortBy: 'firstName', sortOrder: 'ASC' });
    const linkedUserIds = new Set(allDrivers.filter((d) => d.userId).map((d) => d.userId));

    const linkable = driverRoleUsers.filter((u) => !linkedUserIds.has(u.id));

    return ApiResponse.success(res, {
      message: 'Linkable users retrieved successfully',
      data: linkable.map((u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email })),
    });
  };

  update = async (req, res) => {
    const driver = await this.updateDriverUseCase.execute(req.params.id, req.body, req.user.id);
    return ApiResponse.success(res, {
      message: 'Driver updated successfully',
      data: toDriverResponseDto(driver),
    });
  };

  remove = async (req, res) => {
    await this.deleteDriverUseCase.execute(req.params.id, req.user.id);
    return ApiResponse.success(res, { message: 'Driver deleted successfully' });
  };
}

module.exports = DriverController;
