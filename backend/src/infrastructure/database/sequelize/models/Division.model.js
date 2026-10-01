const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

class DivisionModel extends Model {}

DivisionModel.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  },
  {
    sequelize,
    modelName: 'Division',
    tableName: 'divisions',
    underscored: true,
  }
);

module.exports = DivisionModel;
