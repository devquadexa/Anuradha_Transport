const { UnauthorizedError } = require('../../../domain/errors');

/**
 * Orchestrates authentication. Depends only on abstractions injected via
 * the composition root (container) - no direct Express/Sequelize imports.
 */
class LoginUseCase {
  /**
   * @param {import('../../../domain/repositories/IUserRepository')} userRepository
   * @param {import('../../../domain/repositories/IRoleRepository')} roleRepository
   * @param {import('../../../domain/repositories/IRefreshTokenRepository')} refreshTokenRepository
   * @param {import('../../interfaces/IHasher')} hasher
   * @param {import('../../interfaces/ITokenService')} tokenService
   * @param {import('../../interfaces/ILogger')} logger
   */
  constructor(userRepository, roleRepository, refreshTokenRepository, hasher, tokenService, logger) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.hasher = hasher;
    this.tokenService = tokenService;
    this.logger = logger;
  }

  async execute({ email, password, ipAddress, userAgent }) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.canAuthenticate()) {
      throw new UnauthorizedError('Account is inactive or suspended');
    }

    const passwordMatches = await this.hasher.compare(password, user.passwordHash);
    if (!passwordMatches) {
      this.logger.warn('Failed login attempt', { email, ipAddress });
      throw new UnauthorizedError('Invalid email or password');
    }

    const role = await this.roleRepository.findById(user.roleId);

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: role ? role.name : null,
      permissions: role ? role.permissions : [],
    });

    const refreshToken = this.tokenService.signRefreshToken({ sub: user.id });
    const tokenHash = this.tokenService.hashToken(refreshToken);

    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: this.tokenService.getRefreshTokenExpiry(),
      userAgent,
      ipAddress,
    });

    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    this.logger.info('User logged in', { userId: user.id, email });

    return { user, accessToken, refreshToken, role };
  }
}

module.exports = LoginUseCase;
