const { NotFoundError, ForbiddenError, ValidationError } = require('../../../domain/errors');
const RoleName = require('../../../domain/enums/RoleName');

/**
 * Allows a driver to update a trip stop with invoice number and GPS data.
 * Mileage is ONLY set via GPS (gpsMileage) — drivers cannot manually input it.
 * This prevents mileage fraud.
 */
class UpdateTripDriverDetailsUseCase {
  constructor(tripRepository, driverRepository, logger) {
    this.tripRepository = tripRepository;
    this.driverRepository = driverRepository;
    this.logger = logger;
  }

  async execute(tripId, stopId, { invoiceNumber, driverMileage, odometerReading, invoices, status, latitude, longitude, gpsLocationName, gpsMileage }, actor) {
    const trip = await this.tripRepository.findById(tripId);
    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    // Drivers can only update their own assigned trips
    if (actor?.role === RoleName.DRIVER) {
      const driverProfile = await this.driverRepository.findByUserId(actor.id);
      if (!driverProfile || trip.driverId !== driverProfile.id) {
        throw new ForbiddenError('You can only update trips assigned to you');
      }
    }

    // Only allow updates on active trips
    if (!['assigned', 'in_progress', 'completed'].includes(trip.status)) {
      throw new ValidationError('Can only update stop details on assigned, in-progress, or completed trips');
    }

    // Verify the stop belongs to this trip
    const stop = trip.stops.find((s) => s.id === stopId);
    if (!stop) {
      throw new NotFoundError('Stop not found in this trip');
    }

    // Enforce sequential completion - previous stops must be delivered first
    const stopIndex = trip.stops.findIndex((s) => s.id === stopId);
    if (stopIndex > 0) {
      const previousStop = trip.stops[stopIndex - 1];
      if (previousStop.status !== 'delivered') {
        throw new ValidationError('Cannot update this stop until the previous location is marked as delivered');
      }
    }

    const updates = {};
    if (invoiceNumber !== undefined) updates.invoiceNumber = invoiceNumber;
    if (driverMileage !== undefined) updates.driverMileage = driverMileage;
    if (odometerReading !== undefined) updates.odometerReading = odometerReading;
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;
    if (gpsLocationName !== undefined) updates.gpsLocationName = gpsLocationName;
    if (gpsMileage !== undefined) updates.gpsMileage = gpsMileage;

    if (status) {
      updates.status = status;
      if (status === 'arrived') updates.arrivedAt = new Date();
      if (status === 'delivered') updates.deliveredAt = new Date();
    }

    await this.tripRepository.updateStop(stopId, updates);

    // Handle multiple invoices
    if (invoices !== undefined) {
      await this.tripRepository.replaceStopInvoices(stopId, invoices || []);
    }

    this.logger.info('Trip stop updated by driver', {
      tripId,
      stopId,
      actorId: actor?.id,
      gpsMileage,
      gpsLocationName,
      latitude,
      longitude,
    });

    // Return the refreshed trip
    return this.tripRepository.findById(tripId);
  }
}

module.exports = UpdateTripDriverDetailsUseCase;
