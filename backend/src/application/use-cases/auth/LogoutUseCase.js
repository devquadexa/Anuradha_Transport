class LogoutUseCase {
  constructor(refreshTokenRepository, tokenService) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.tokenService = tokenService;
  }

  async execute({ refreshToken }) {
    if (!refreshToken) return;
    const tokenHash = this.tokenService.hashToken(refreshToken);
    const storedToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);
    if (storedToken) {
      await this.refreshTokenRepository.revoke(storedToken.id);
    }
  }
}

module.exports = LogoutUseCase;
