const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

class AuditLogModel extends Model {}

AuditLogModel.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'user_id' },
    action: { type: DataTypes.STRING(100), allowNull: false },
    entityType: { type: DataTypes.STRING(100), allowNull: true, field: 'entity_type' },
    entityId: { type: DataTypes.STRING(50), allowNull: true, field: 'entity_id' },
    oldValues: { type: DataTypes.JSON, allowNull: true, field: 'old_values' },
    newValues: { type: DataTypes.JSON, allowNull: true, field: 'new_values' },
    ipAddress: { type: DataTypes.STRING(45), allowNull: true, field: 'ip_address' },
    userAgent: { type: DataTypes.STRING(255), allowNull: true, field: 'user_agent' },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = AuditLogModel;
