const ApiResponse = require('../../application/common/ApiResponse');
const { TripLocationPing, Trip, Driver } = require('../../infrastructure/database/sequelize/models');
const { Op } = require('sequelize');

class TrackingController {
  // Driver sends their GPS position
  ping = async (req, res) => {
    const { tripId, latitude, longitude, speed } = req.body;

    await TripLocationPing.create({
      tripId,
      driverId: req.user.id,
      latitude,
      longitude,
      speed: speed || null,
      recordedAt: new Date(),
    });

    return ApiResponse.success(res, { message: 'Location recorded' });
  };

  // Admin gets all active drivers' latest positions
  livePositions = async (req, res) => {
    // Get all in-progress trips with their latest ping
    const activeTrips = await Trip.findAll({
      where: { status: 'in_progress' },
      attributes: ['id', 'tripNumber', 'origin', 'destination', 'driverId'],
      include: [
        { model: Driver, attributes: ['id', 'firstName', 'lastName', 'phone', 'vehicleNumber'] },
      ],
    });

    const positions = [];

    for (const trip of activeTrips) {
      const latestPing = await TripLocationPing.findOne({
        where: { tripId: trip.id },
        order: [['recordedAt', 'DESC']],
      });

      if (latestPing && trip.Driver) {
        positions.push({
          tripId: trip.id,
          tripNumber: trip.tripNumber,
          origin: trip.origin,
          destination: trip.destination,
          driver: {
            id: trip.Driver.id,
            name: `${trip.Driver.firstName} ${trip.Driver.lastName}`,
            phone: trip.Driver.phone,
            vehicleNumber: trip.Driver.vehicleNumber,
          },
          position: {
            latitude: parseFloat(latestPing.latitude),
            longitude: parseFloat(latestPing.longitude),
            speed: latestPing.speed ? parseFloat(latestPing.speed) : null,
            recordedAt: latestPing.recordedAt,
          },
        });
      }
    }

    return ApiResponse.success(res, {
      message: 'Live positions retrieved',
      data: positions,
    });
  };

  // Admin gets full route history for a specific trip
  tripRoute = async (req, res) => {
    const pings = await TripLocationPing.findAll({
      where: { tripId: req.params.id },
      order: [['recordedAt', 'ASC']],
      attributes: ['latitude', 'longitude', 'speed', 'recordedAt'],
    });

    return ApiResponse.success(res, {
      message: 'Trip route retrieved',
      data: pings.map((p) => ({
        latitude: parseFloat(p.latitude),
        longitude: parseFloat(p.longitude),
        speed: p.speed ? parseFloat(p.speed) : null,
        recordedAt: p.recordedAt,
      })),
    });
  };
}

module.exports = TrackingController;
