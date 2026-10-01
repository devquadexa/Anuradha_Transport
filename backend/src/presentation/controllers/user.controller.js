const ApiResponse = require('../../application/common/ApiResponse');
const { toUserResponseDto } = require('../../application/dtos/UserDto');
const { parsePagination, buildMeta } = require('../../application/common/Pagination');

class UserController {
  constructor({ createUserUseCase, getUserUseCase, listUsersUseCase, updateUserUseCase, deleteUserUseCase }) {
    this.createUserUseCase = createUserUseCase;
    this.getUserUseCase = getUserUseCase;
    this.listUsersUseCase = listUsersUseCase;
    this.updateUserUseCase = updateUserUseCase;
    this.deleteUserUseCase = deleteUserUseCase;
  }

  create = async (req, res) => {
    const user = await this.createUserUseCase.execute({
      ...req.body,
      createdBy: req.user.id,
      actorRole: req.user.role,
    });
    return ApiResponse.success(res, {
      message: 'User created successfully',
      data: toUserResponseDto(user),
      statusCode: 201,
    });
  };

  getById = async (req, res) => {
    const user = await this.getUserUseCase.execute(req.params.id);
    return ApiResponse.success(res, {
      message: 'User retrieved successfully',
      data: toUserResponseDto(user),
    });
  };

  list = async (req, res) => {
    const pagination = parsePagination(req.query);
    const options = { ...pagination, status: req.query.status, roleId: req.query.roleId };
    const { rows, total } = await this.listUsersUseCase.execute(options);

    return ApiResponse.success(res, {
      message: 'Users retrieved successfully',
      data: rows.map(toUserResponseDto),
      meta: buildMeta({ page: pagination.page, pageSize: pagination.pageSize, total }),
    });
  };

  update = async (req, res) => {
    const user = await this.updateUserUseCase.execute(req.params.id, req.body, req.user.id, req.user.role);
    return ApiResponse.success(res, {
      message: 'User updated successfully',
      data: toUserResponseDto(user),
    });
  };

  remove = async (req, res) => {
    await this.deleteUserUseCase.execute(req.params.id, req.user.id, req.user.role);
    return ApiResponse.success(res, { message: 'User deleted successfully' });
  };
}

module.exports = UserController;
