const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

class RefreshTokenModel extends Model {}

RefreshTokenModel.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id' },
    tokenHash: { type: DataTypes.STRING(255), allowNull: false, field: 'token_hash' },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
    revokedAt: { type: DataTypes.DATE, allowNull: true, field: 'revoked_at' },
    replacedByTokenHash: { type: DataTypes.STRING(255), allowNull: true, field: 'replaced_by_token_hash' },
    userAgent: { type: DataTypes.STRING(255), allowNull: true, field: 'user_agent' },
    ipAddress: { type: DataTypes.STRING(45), allowNull: true, field: 'ip_address' },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = RefreshTokenModel;
