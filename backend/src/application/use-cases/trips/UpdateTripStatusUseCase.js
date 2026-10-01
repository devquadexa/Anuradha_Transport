const { NotFoundError, ValidationError, ForbiddenError } = require('../../../domain/errors');
const RoleName = require('../../../domain/enums/RoleName');

const TIMESTAMP_FIELD_BY_STATUS = {
  in_progress: 'startedAt',
  completed: 'completedAt',
};

/**
 * Transitions a trip's status through its lifecycle (pending -> assigned ->
 * in_progress -> completed, or -> cancelled). Drivers may only transition
 * trips assigned to them; Admin/Super Admin may transition any trip.
 */
class UpdateTripStatusUseCase {
  constructor(tripRepository, driverRepository, logger) {
    this.tripRepository = tripRepository;
    this.driverRepository = driverRepository;
    this.logger = logger;
  }

  async execute(tripId, nextStatus, actor, gps = {}, extra = {}) {
    const trip = await this.tripRepository.findById(tripId);
    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    if (actor?.role === RoleName.DRIVER) {
      const driverProfile = await this.driverRepository.findByUserId(actor.id);
      if (!driverProfile || trip.driverId !== driverProfile.id) {
        throw new ForbiddenError('You can only update trips assigned to you');
      }
    }

    if (!trip.canTransitionTo(nextStatus)) {
      throw new ValidationError(`Cannot change trip status from ${trip.status} to ${nextStatus}`);
    }

    const updates = { status: nextStatus, updatedBy: actor?.id };
    const timestampField = TIMESTAMP_FIELD_BY_STATUS[nextStatus];
    if (timestampField) {
      updates[timestampField] = new Date();
    }

    // When trip is completed, auto-set approval status to pending for admin
    // review, and record the driver's final vehicle meter reading if given.
    if (nextStatus === 'completed') {
      updates.approvalStatus = 'pending';
      if (extra.finalOdometerReading != null) {
        updates.finalOdometerReading = extra.finalOdometerReading;
      }
    }

    // Capture GPS when starting the trip
    if (nextStatus === 'in_progress' && gps.latitude && gps.longitude) {
      updates.startLatitude = gps.latitude;
      updates.startLongitude = gps.longitude;
    }

    const updated = await this.tripRepository.update(tripId, updates);
    this.logger.info('Trip status updated', { tripId, nextStatus, actorId: actor?.id });
    return updated;
  }
}

module.exports = UpdateTripStatusUseCase;
