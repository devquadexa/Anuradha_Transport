const LoginUseCase = require('../../src/application/use-cases/auth/LoginUseCase');
const { UnauthorizedError } = require('../../src/domain/errors');
const User = require('../../src/domain/entities/User');
const Role = require('../../src/domain/entities/Role');

describe('LoginUseCase', () => {
  const activeUser = new User({
    id: 1,
    roleId: 1,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    passwordHash: 'hashed-password',
    status: 'active',
  });

  const role = new Role({ id: 1, name: 'ADMIN', permissions: ['users:read'] });

  function buildDeps({ user = activeUser, passwordMatches = true } = {}) {
    const userRepository = {
      findByEmail: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockResolvedValue(user),
    };
    const roleRepository = { findById: jest.fn().mockResolvedValue(role) };
    const refreshTokenRepository = { create: jest.fn().mockResolvedValue({}) };
    const hasher = { compare: jest.fn().mockResolvedValue(passwordMatches) };
    const tokenService = {
      signAccessToken: jest.fn().mockReturnValue('access-token'),
      signRefreshToken: jest.fn().mockReturnValue('refresh-token'),
      hashToken: jest.fn().mockReturnValue('hashed-refresh-token'),
      getRefreshTokenExpiry: jest.fn().mockReturnValue(new Date()),
    };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

    return { userRepository, roleRepository, refreshTokenRepository, hasher, tokenService, logger };
  }

  it('returns tokens and user on successful login', async () => {
    const deps = buildDeps();
    const useCase = new LoginUseCase(
      deps.userRepository,
      deps.roleRepository,
      deps.refreshTokenRepository,
      deps.hasher,
      deps.tokenService,
      deps.logger
    );

    const result = await useCase.execute({ email: 'jane@example.com', password: 'secret123' });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user).toBe(activeUser);
    expect(deps.refreshTokenRepository.create).toHaveBeenCalledTimes(1);
    expect(deps.userRepository.update).toHaveBeenCalledWith(1, { lastLoginAt: expect.any(Date) });
  });

  it('throws UnauthorizedError when user does not exist', async () => {
    const deps = buildDeps({ user: null });
    const useCase = new LoginUseCase(
      deps.userRepository,
      deps.roleRepository,
      deps.refreshTokenRepository,
      deps.hasher,
      deps.tokenService,
      deps.logger
    );

    await expect(useCase.execute({ email: 'ghost@example.com', password: 'secret123' })).rejects.toThrow(
      UnauthorizedError
    );
  });

  it('throws UnauthorizedError when password does not match', async () => {
    const deps = buildDeps({ passwordMatches: false });
    const useCase = new LoginUseCase(
      deps.userRepository,
      deps.roleRepository,
      deps.refreshTokenRepository,
      deps.hasher,
      deps.tokenService,
      deps.logger
    );

    await expect(useCase.execute({ email: 'jane@example.com', password: 'wrong' })).rejects.toThrow(
      UnauthorizedError
    );
  });

  it('throws UnauthorizedError when user is inactive', async () => {
    const inactiveUser = new User({ ...activeUser, status: 'suspended' });
    const deps = buildDeps({ user: inactiveUser });
    const useCase = new LoginUseCase(
      deps.userRepository,
      deps.roleRepository,
      deps.refreshTokenRepository,
      deps.hasher,
      deps.tokenService,
      deps.logger
    );

    await expect(useCase.execute({ email: 'jane@example.com', password: 'secret123' })).rejects.toThrow(
      UnauthorizedError
    );
  });
});
