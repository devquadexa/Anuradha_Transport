const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

class TripLocationPingModel extends Model {}

TripLocationPingModel.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    tripId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'trip_id' },
    driverId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'driver_id' },
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    speed: { type: DataTypes.DECIMAL(5, 1), allowNull: true },
    recordedAt: { type: DataTypes.DATE, allowNull: false, field: 'recorded_at' },
  },
  {
    sequelize,
    modelName: 'TripLocationPing',
    tableName: 'trip_location_pings',
    underscored: true,
    timestamps: false,
  }
);

module.exports = TripLocationPingModel;
