const { NotFoundError, ValidationError, ForbiddenError } = require('../../../domain/errors');
const RoleName = require('../../../domain/enums/RoleName');

/**
 * Reorders a trip's stops according to a client-provided ordered list of stop
 * ids (with optional expectedMileage per stop). Drivers may only reorder their
 * own trips. Delivered stops should not be reordered by the caller; the caller
 * is responsible for keeping delivered stops in place.
 */
class ReorderTripStopsUseCase {
  constructor(tripRepository, driverRepository, logger) {
    this.tripRepository = tripRepository;
    this.driverRepository = driverRepository;
    this.logger = logger;
  }

  async execute(tripId, orderedStops, actor) {
    const trip = await this.tripRepository.findById(tripId);
    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    if (actor?.role === RoleName.DRIVER) {
      const driverProfile = await this.driverRepository.findByUserId(actor.id);
      if (!driverProfile || trip.driverId !== driverProfile.id) {
        throw new ForbiddenError('You can only reorder trips assigned to you');
      }
    }

    if (!Array.isArray(orderedStops) || orderedStops.length === 0) {
      throw new ValidationError('orderedStops must be a non-empty array');
    }

    // Validate that every provided id belongs to this trip and the set matches
    // the trip's stops exactly (no missing/extra ids).
    const tripStopIds = new Set((trip.stops || []).map((s) => s.id));
    const providedIds = orderedStops.map((s) => s.id);
    const providedSet = new Set(providedIds);

    if (providedSet.size !== providedIds.length) {
      throw new ValidationError('orderedStops contains duplicate ids');
    }
    if (providedIds.length !== tripStopIds.size || providedIds.some((id) => !tripStopIds.has(id))) {
      throw new ValidationError('orderedStops must include exactly the trip\'s stops');
    }

    const updated = await this.tripRepository.reorderStops(tripId, orderedStops);
    this.logger.info('Trip stops reordered', { tripId, actorId: actor?.id });
    return updated;
  }
}

module.exports = ReorderTripStopsUseCase;
