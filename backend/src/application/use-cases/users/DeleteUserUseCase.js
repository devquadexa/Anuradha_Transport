const { NotFoundError, ForbiddenError } = require('../../../domain/errors');
const RoleName = require('../../../domain/enums/RoleName');

class DeleteUserUseCase {
  constructor(userRepository, roleRepository, logger) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.logger = logger;
  }

  async execute(id, deletedBy, actorRole) {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    if (Number(id) === Number(deletedBy)) {
      throw new ForbiddenError('You cannot delete your own account');
    }

    const targetRole = await this.roleRepository.findById(existing.roleId);
    if (targetRole?.name === RoleName.SUPER_ADMIN && actorRole !== RoleName.SUPER_ADMIN) {
      throw new ForbiddenError('Only Super Admin can delete a Super Admin account');
    }

    await this.userRepository.softDelete(id);
    this.logger.info('User soft-deleted', { userId: id, deletedBy });
  }
}

module.exports = DeleteUserUseCase;
