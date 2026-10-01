const { NotFoundError, ValidationError } = require('../../../domain/errors');
const { calculateExpectedMileages } = require('./calculateExpectedMileages');

class UpdateTripUseCase {
  constructor(tripRepository, logger, locationRepository) {
    this.tripRepository = tripRepository;
    this.logger = logger;
    this.locationRepository = locationRepository;
  }

  async execute(id, { stops, ...updates }, updatedBy) {
    const existing = await this.tripRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Trip not found');
    }

    if (['completed', 'cancelled'].includes(existing.status)) {
      throw new ValidationError(`Cannot modify a trip that is already ${existing.status}`);
    }

    let trip = existing;
    if (Object.keys(updates).length > 0) {
      trip = await this.tripRepository.update(id, { ...updates, updatedBy });
    }

    if (stops) {
      // Recompute expectedMileage the same way trip creation does, so edited
      // trips keep their expected distances instead of losing them.
      const originName = updates.origin || existing.origin;
      const resolvedStops = await calculateExpectedMileages(stops, originName, this.locationRepository);
      trip = await this.tripRepository.replaceStops(id, resolvedStops);
    }

    this.logger.info('Trip updated', { tripId: id, updatedBy });
    return trip;
  }
}

module.exports = UpdateTripUseCase;
