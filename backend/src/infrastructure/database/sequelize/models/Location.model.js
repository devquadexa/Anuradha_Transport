const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

class LocationModel extends Model {}

LocationModel.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'customer_id' },
    name: { type: DataTypes.STRING(150), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: true },
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    contactName: { type: DataTypes.STRING(100), allowNull: true, field: 'contact_name' },
    contactPhone: { type: DataTypes.STRING(20), allowNull: true, field: 'contact_phone' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
    createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'created_by' },
    updatedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'updated_by' },
  },
  {
    sequelize,
    modelName: 'Location',
    tableName: 'locations',
    paranoid: true,
    underscored: true,
  }
);

module.exports = LocationModel;
