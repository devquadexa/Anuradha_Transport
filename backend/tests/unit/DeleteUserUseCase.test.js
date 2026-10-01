const DeleteUserUseCase = require('../../src/application/use-cases/users/DeleteUserUseCase');
const { NotFoundError, ForbiddenError } = require('../../src/domain/errors');
const User = require('../../src/domain/entities/User');
const Role = require('../../src/domain/entities/Role');

describe('DeleteUserUseCase', () => {
  const targetUser = new User({ id: 5, roleId: 2, firstName: 'A', lastName: 'B', email: 'a@b.com', status: 'active' });
  const superAdminTargetUser = new User({ id: 6, roleId: 1, firstName: 'S', lastName: 'A', email: 's@a.com', status: 'active' });
  const adminRole = new Role({ id: 2, name: 'ADMIN' });
  const superAdminRole = new Role({ id: 1, name: 'SUPER_ADMIN' });

  function buildDeps({ existing = targetUser, roleLookup = { 1: superAdminRole, 2: adminRole } } = {}) {
    const userRepository = {
      findById: jest.fn().mockResolvedValue(existing),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };
    const roleRepository = { findById: jest.fn((id) => Promise.resolve(roleLookup[id])) };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    return { userRepository, roleRepository, logger };
  }

  it('throws NotFoundError when user does not exist', async () => {
    const deps = buildDeps();
    deps.userRepository.findById.mockResolvedValue(null);
    const useCase = new DeleteUserUseCase(deps.userRepository, deps.roleRepository, deps.logger);

    await expect(useCase.execute(999, 1, 'ADMIN')).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when a user tries to delete their own account', async () => {
    const deps = buildDeps();
    const useCase = new DeleteUserUseCase(deps.userRepository, deps.roleRepository, deps.logger);

    await expect(useCase.execute(5, 5, 'ADMIN')).rejects.toThrow(ForbiddenError);
    expect(deps.userRepository.softDelete).not.toHaveBeenCalled();
  });

  it('throws ForbiddenError when non-Super-Admin tries to delete a Super Admin account', async () => {
    const deps = buildDeps({ existing: superAdminTargetUser });
    const useCase = new DeleteUserUseCase(deps.userRepository, deps.roleRepository, deps.logger);

    await expect(useCase.execute(6, 1, 'ADMIN')).rejects.toThrow(ForbiddenError);
    expect(deps.userRepository.softDelete).not.toHaveBeenCalled();
  });

  it('allows Super Admin to delete another Super Admin account', async () => {
    const deps = buildDeps({ existing: superAdminTargetUser });
    const useCase = new DeleteUserUseCase(deps.userRepository, deps.roleRepository, deps.logger);

    await useCase.execute(6, 1, 'SUPER_ADMIN');
    expect(deps.userRepository.softDelete).toHaveBeenCalledWith(6);
  });

  it('allows deleting a regular user', async () => {
    const deps = buildDeps();
    const useCase = new DeleteUserUseCase(deps.userRepository, deps.roleRepository, deps.logger);

    await useCase.execute(5, 1, 'ADMIN');
    expect(deps.userRepository.softDelete).toHaveBeenCalledWith(5);
  });
});
