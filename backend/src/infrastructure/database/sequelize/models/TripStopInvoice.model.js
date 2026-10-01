const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

class TripStopInvoiceModel extends Model {}

TripStopInvoiceModel.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    tripStopId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'trip_stop_id' },
    invoiceNumber: { type: DataTypes.STRING(100), allowNull: false, field: 'invoice_number' },
  },
  {
    sequelize,
    modelName: 'TripStopInvoice',
    tableName: 'trip_stop_invoices',
    underscored: true,
    timestamps: true,
  }
);

module.exports = TripStopInvoiceModel;
