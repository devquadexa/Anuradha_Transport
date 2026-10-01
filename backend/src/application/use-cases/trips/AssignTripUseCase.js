const { NotFoundError, ValidationError } = require('../../../domain/errors');

class AssignTripUseCase {
  constructor(tripRepository, driverRepository, logger) {
    this.tripRepository = tripRepository;
    this.driverRepository = driverRepository;
    this.logger = logger;
  }

  async execute(tripId, driverId, assignedBy) {
    const trip = await this.tripRepository.findById(tripId);
    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    if (!trip.canBeAssigned()) {
      throw new ValidationError(`Cannot assign a driver to a trip that is ${trip.status}`);
    }

    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver not found');
    }
    if (!driver.isAvailable()) {
      throw new ValidationError('Selected driver is not currently active');
    }

    const updated = await this.tripRepository.update(tripId, {
      driverId,
      status: 'assigned',
      assignedAt: new Date(),
      updatedBy: assignedBy,
    });

    this.logger.info('Trip assigned to driver', { tripId, driverId, assignedBy });
    return updated;
  }
}

module.exports = AssignTripUseCase;
