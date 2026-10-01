const ApiResponse = require('../../application/common/ApiResponse');
const { toRoleResponseDto } = require('../../application/dtos/RoleDto');

class RoleController {
  constructor({ listRolesUseCase }) {
    this.listRolesUseCase = listRolesUseCase;
  }

  list = async (req, res) => {
    const roles = await this.listRolesUseCase.execute();
    return ApiResponse.success(res, {
      message: 'Roles retrieved successfully',
      data: roles.map(toRoleResponseDto),
    });
  };
}

module.exports = RoleController;
