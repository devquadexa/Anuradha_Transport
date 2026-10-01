class IRefreshTokenRepository {
  async create(_tokenData) {
    throw new Error('IRefreshTokenRepository.create not implemented');
  }

  async findByTokenHash(_tokenHash) {
    throw new Error('IRefreshTokenRepository.findByTokenHash not implemented');
  }

  async revoke(_id, _replacedByTokenHash = null) {
    throw new Error('IRefreshTokenRepository.revoke not implemented');
  }

  async revokeAllForUser(_userId) {
    throw new Error('IRefreshTokenRepository.revokeAllForUser not implemented');
  }
}

module.exports = IRefreshTokenRepository;
