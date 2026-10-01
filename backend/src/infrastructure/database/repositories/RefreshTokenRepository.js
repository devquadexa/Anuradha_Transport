const IRefreshTokenRepository = require('../../../domain/repositories/IRefreshTokenRepository');
const RefreshToken = require('../../../domain/entities/RefreshToken');
const { RefreshToken: RefreshTokenModel } = require('../sequelize/models');

function toDomain(instance) {
  if (!instance) return null;
  const plain = instance.get({ plain: true });
  return new RefreshToken({
    id: plain.id,
    userId: plain.userId,
    tokenHash: plain.tokenHash,
    expiresAt: plain.expiresAt,
    revokedAt: plain.revokedAt,
    replacedByTokenHash: plain.replacedByTokenHash,
    userAgent: plain.userAgent,
    ipAddress: plain.ipAddress,
    createdAt: plain.createdAt,
  });
}

class RefreshTokenRepository extends IRefreshTokenRepository {
  async create(tokenData) {
    const instance = await RefreshTokenModel.create(tokenData);
    return toDomain(instance);
  }

  async findByTokenHash(tokenHash) {
    const instance = await RefreshTokenModel.findOne({ where: { tokenHash } });
    return toDomain(instance);
  }

  async revoke(id, replacedByTokenHash = null) {
    await RefreshTokenModel.update(
      { revokedAt: new Date(), replacedByTokenHash },
      { where: { id } }
    );
  }

  async revokeAllForUser(userId) {
    await RefreshTokenModel.update(
      { revokedAt: new Date() },
      { where: { userId, revokedAt: null } }
    );
  }
}

module.exports = new RefreshTokenRepository();
