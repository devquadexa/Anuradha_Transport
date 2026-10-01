const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

class CustomerModel extends Model {}

CustomerModel.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    companyName: { type: DataTypes.STRING(150), allowNull: false, field: 'company_name' },
    contactPerson: { type: DataTypes.STRING(100), allowNull: true, field: 'contact_person' },
    email: { type: DataTypes.STRING(150), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    addressLine1: { type: DataTypes.STRING(255), allowNull: true, field: 'address_line1' },
    addressLine2: { type: DataTypes.STRING(255), allowNull: true, field: 'address_line2' },
    city: { type: DataTypes.STRING(100), allowNull: true },
    country: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'Sri Lanka' },
    status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    contactPersons: { type: DataTypes.JSON, allowNull: true, field: 'contact_persons' },
    divisionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'division_id' },
    createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'created_by' },
    updatedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'updated_by' },
  },
  {
    sequelize,
    modelName: 'Customer',
    tableName: 'customers',
    paranoid: true,
    underscored: true,
  }
);

module.exports = CustomerModel;
