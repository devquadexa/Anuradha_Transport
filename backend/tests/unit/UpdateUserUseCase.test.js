const UpdateUserUseCase = require('../../src/application/use-cases/users/UpdateUserUseCase');
const { NotFoundError, ForbiddenError } = require('../../src/domain/errors');
const User = require('../../src/domain/entities/User');
const Role = require('../../src/domain/entities/Role');

describe('UpdateUserUseCase', () => {
  const existingAdminUser = new User({ id: 5, roleId: 2, firstName: 'A', lastName: 'B', email: 'a@b.com', status: 'active' });
  const adminRole = new Role({ id: 2, name: 'ADMIN' });
  const superAdminRole = new Role({ id: 1, name: 'SUPER_ADMIN' });

  function buildDeps({ existing = existingAdminUser, roleLookup = {} } = {}) {
    const updatedUser = { ...existing, firstName: 'Updated' };
    const userRepository = {
      findById: jest.fn().mockResolvedValue(existing),
      update: jest.fn().mockResolvedValue(updatedUser),
    };
    const roleRepository = {
      findById: jest.fn((id) => Promise.resolve(roleLookup[id])),
    };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    return { userRepository, roleRepository, logger, updatedUser };
  }

  it('throws NotFoundError when user does not exist', async () => {
    const deps = buildDeps();
    deps.userRepository.findById.mockResolvedValue(null);
    const useCase = new UpdateUserUseCase(deps.userRepository, deps.roleRepository, deps.logger);

    await expect(useCase.execute(999, { firstName: 'X' }, 1, 'ADMIN')).rejects.toThrow(NotFoundError);
  });

  it('updates a user with no role change', async () => {
    const deps = buildDeps();
    const useCase = new UpdateUserUseCase(deps.userRepository, deps.roleRepository, deps.logger);

    const result = await useCase.execute(5, { firstName: 'Updated' }, 1, 'ADMIN');

    expect(deps.userRepository.update).toHaveBeenCalledWith(5, { firstName: 'Updated', updatedBy: 1 });
    expect(result).toBe(deps.updatedUser);
  });

  it('throws ForbiddenError when non-Super-Admin tries to promote a user to Super Admin', async () => {
    const deps = buildDeps({ roleLookup: { 1: superAdminRole, 2: adminRole } });
    const useCase = new UpdateUserUseCase(deps.userRepository, deps.roleRepository, deps.logger);

    await expect(useCase.execute(5, { roleId: 1 }, 1, 'ADMIN')).rejects.toThrow(ForbiddenError);
    expect(deps.userRepository.update).not.toHaveBeenCalled();
  });

  it('allows a Super Admin to promote a user to Super Admin', async () => {
    const deps = buildDeps({ roleLookup: { 1: superAdminRole, 2: adminRole } });
    const useCase = new UpdateUserUseCase(deps.userRepository, deps.roleRepository, deps.logger);

    await useCase.execute(5, { roleId: 1 }, 1, 'SUPER_ADMIN');
    expect(deps.userRepository.update).toHaveBeenCalledTimes(1);
  });
});
