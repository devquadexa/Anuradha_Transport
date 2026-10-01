const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

class RoleModel extends Model {}

RoleModel.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    paranoid: true, // soft delete via deleted_at
    underscored: true,
  }
);

module.exports = RoleModel;
