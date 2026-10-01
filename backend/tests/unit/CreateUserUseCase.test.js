const CreateUserUseCase = require('../../src/application/use-cases/users/CreateUserUseCase');
const { ConflictError, ForbiddenError } = require('../../src/domain/errors');
const Role = require('../../src/domain/entities/Role');

describe('CreateUserUseCase', () => {
  const adminRole = new Role({ id: 2, name: 'ADMIN' });
  const superAdminRole = new Role({ id: 1, name: 'SUPER_ADMIN' });

  function buildDeps({ exists = false, targetRole = adminRole } = {}) {
    const createdUser = { id: 10, email: 'new@example.com' };
    const userRepository = {
      existsByEmail: jest.fn().mockResolvedValue(exists),
      create: jest.fn().mockResolvedValue(createdUser),
    };
    const roleRepository = { findById: jest.fn().mockResolvedValue(targetRole) };
    const hasher = { hash: jest.fn().mockResolvedValue('hashed-password') };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    return { userRepository, roleRepository, hasher, logger, createdUser };
  }

  it('creates a user when email is unique', async () => {
    const deps = buildDeps();
    const useCase = new CreateUserUseCase(deps.userRepository, deps.roleRepository, deps.hasher, deps.logger);

    const result = await useCase.execute({
      roleId: 2,
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
      password: 'Password1',
      createdBy: 1,
      actorRole: 'ADMIN',
    });

    expect(deps.hasher.hash).toHaveBeenCalledWith('Password1');
    expect(deps.userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@example.com', passwordHash: 'hashed-password', createdBy: 1 })
    );
    expect(result).toBe(deps.createdUser);
  });

  it('throws ConflictError when email already exists', async () => {
    const deps = buildDeps({ exists: true });
    const useCase = new CreateUserUseCase(deps.userRepository, deps.roleRepository, deps.hasher, deps.logger);

    await expect(
      useCase.execute({
        roleId: 2,
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        password: 'Password1',
        createdBy: 1,
        actorRole: 'ADMIN',
      })
    ).rejects.toThrow(ConflictError);

    expect(deps.userRepository.create).not.toHaveBeenCalled();
  });

  it('throws ForbiddenError when a non-Super-Admin tries to create a Super Admin account', async () => {
    const deps = buildDeps({ targetRole: superAdminRole });
    const useCase = new CreateUserUseCase(deps.userRepository, deps.roleRepository, deps.hasher, deps.logger);

    await expect(
      useCase.execute({
        roleId: 1,
        firstName: 'New',
        lastName: 'SuperAdmin',
        email: 'new@example.com',
        password: 'Password1',
        createdBy: 1,
        actorRole: 'ADMIN',
      })
    ).rejects.toThrow(ForbiddenError);

    expect(deps.userRepository.create).not.toHaveBeenCalled();
  });

  it('allows a Super Admin to create another Super Admin account', async () => {
    const deps = buildDeps({ targetRole: superAdminRole });
    const useCase = new CreateUserUseCase(deps.userRepository, deps.roleRepository, deps.hasher, deps.logger);

    await useCase.execute({
      roleId: 1,
      firstName: 'New',
      lastName: 'SuperAdmin',
      email: 'new@example.com',
      password: 'Password1',
      createdBy: 1,
      actorRole: 'SUPER_ADMIN',
    });

    expect(deps.userRepository.create).toHaveBeenCalledTimes(1);
  });
});
