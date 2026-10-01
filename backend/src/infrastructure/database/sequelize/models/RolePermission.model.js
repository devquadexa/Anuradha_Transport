const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

class RolePermissionModel extends Model {}

RolePermissionModel.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    roleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'role_id' },
    permissionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'permission_id' },
  },
  {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'role_permissions',
    underscored: true,
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = RolePermissionModel;
