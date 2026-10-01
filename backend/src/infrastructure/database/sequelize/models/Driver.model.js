const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

class DriverModel extends Model {}

DriverModel.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'user_id' },
    firstName: { type: DataTypes.STRING(100), allowNull: false, field: 'first_name' },
    lastName: { type: DataTypes.STRING(100), allowNull: false, field: 'last_name' },
    nicNumber: { type: DataTypes.STRING(20), allowNull: false, field: 'nic_number' },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: true },
    licenseNumber: { type: DataTypes.STRING(50), allowNull: false, field: 'license_number' },
    licenseExpiry: { type: DataTypes.DATEONLY, allowNull: false, field: 'license_expiry' },
    address: { type: DataTypes.STRING(255), allowNull: true },
    vehicleNumber: { type: DataTypes.STRING(30), allowNull: true, field: 'vehicle_number' },
    insuranceProvider: { type: DataTypes.STRING(150), allowNull: true, field: 'insurance_provider' },
    insurancePolicyNumber: { type: DataTypes.STRING(100), allowNull: true, field: 'insurance_policy_number' },
    insuranceExpiry: { type: DataTypes.DATEONLY, allowNull: true, field: 'insurance_expiry' },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'on_leave', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'created_by' },
    updatedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'updated_by' },
  },
  {
    sequelize,
    modelName: 'Driver',
    tableName: 'drivers',
    paranoid: true,
    underscored: true,
  }
);

module.exports = DriverModel;
