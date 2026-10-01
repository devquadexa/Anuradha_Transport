const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

class TripModel extends Model {}

TripModel.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    tripNumber: { type: DataTypes.STRING(30), allowNull: false, unique: true, field: 'trip_number' },
    customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'customer_id' },
    driverId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'driver_id' },
    origin: { type: DataTypes.STRING(255), allowNull: false },
    destination: { type: DataTypes.STRING(255), allowNull: false },
    endPoint: { type: DataTypes.STRING(255), allowNull: true, field: 'end_point' },
    scheduledDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'scheduled_date' },
    scheduledTime: { type: DataTypes.TIME, allowNull: true, field: 'scheduled_time' },
    status: {
      type: DataTypes.ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    cargoDescription: { type: DataTypes.STRING(255), allowNull: true, field: 'cargo_description' },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    mileage: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    finalOdometerReading: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'final_odometer_reading' },
    invoiceNumber: { type: DataTypes.STRING(100), allowNull: true, field: 'invoice_number' },
    startLatitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true, field: 'start_latitude' },
    startLongitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true, field: 'start_longitude' },
    assignedAt: { type: DataTypes.DATE, allowNull: true, field: 'assigned_at' },
    startedAt: { type: DataTypes.DATE, allowNull: true, field: 'started_at' },
    completedAt: { type: DataTypes.DATE, allowNull: true, field: 'completed_at' },
    approvalStatus: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: true, field: 'approval_status' },
    approvedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'approved_by' },
    approvedAt: { type: DataTypes.DATE, allowNull: true, field: 'approved_at' },
    rejectionReason: { type: DataTypes.TEXT, allowNull: true, field: 'rejection_reason' },
    emergencyStop: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'emergency_stop' },
    emergencyStopAt: { type: DataTypes.DATE, allowNull: true, field: 'emergency_stop_at' },
    emergencyStopReason: { type: DataTypes.STRING(255), allowNull: true, field: 'emergency_stop_reason' },
    createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'created_by' },
    updatedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'updated_by' },
  },
  {
    sequelize,
    modelName: 'Trip',
    tableName: 'trips',
    paranoid: true,
    underscored: true,
  }
);

module.exports = TripModel;
