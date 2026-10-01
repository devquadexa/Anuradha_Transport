const { UnauthorizedError } = require('../../../domain/errors');

class RefreshTokenUseCase {
  constructor(userRepository, roleRepository, refreshTokenRepository, tokenService, logger) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.tokenService = tokenService;
    this.logger = logger;
  }

  async execute({ refreshToken, ipAddress, userAgent }) {
    let payload;
    try {
      payload = this.tokenService.verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenHash = this.tokenService.hashToken(refreshToken);
    const storedToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!storedToken || !storedToken.isActive()) {
      throw new UnauthorizedError('Refresh token has been revoked or expired');
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.canAuthenticate()) {
      throw new UnauthorizedError('Account is inactive or suspended');
    }

    const role = await this.roleRepository.findById(user.roleId);

    // Rotate refresh token
    const newRefreshToken = this.tokenService.signRefreshToken({ sub: user.id });
    const newTokenHash = this.tokenService.hashToken(newRefreshToken);

    await this.refreshTokenRepository.revoke(storedToken.id, newTokenHash);
    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: this.tokenService.getRefreshTokenExpiry(),
      userAgent,
      ipAddress,
    });

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: role ? role.name : null,
      permissions: role ? role.permissions : [],
    });

    return { user, accessToken, refreshToken: newRefreshToken, role };
  }
}

module.exports = RefreshTokenUseCase;
