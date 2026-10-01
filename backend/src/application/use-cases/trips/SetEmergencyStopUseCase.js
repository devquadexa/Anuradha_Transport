const { NotFoundError, ValidationError, ForbiddenError } = require('../../../domain/errors');
const RoleName = require('../../../domain/enums/RoleName');

/**
 * Lets a driver flag (or clear) an emergency stop on their own in-progress
 * trip. Admin/Super Admin may also toggle it. The flag is what the admin
 * Driver Status board reads — it is never set automatically.
 */
class SetEmergencyStopUseCase {
  constructor(tripRepository, driverRepository, logger) {
    this.tripRepository = tripRepository;
    this.driverRepository = driverRepository;
    this.logger = logger;
  }

  async execute(tripId, { active, reason = null }, actor) {
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

    // Emergency stop only makes sense while the trip is under way.
    if (active && trip.status !== 'in_progress') {
      throw new ValidationError('Emergency stop can only be set on an in-progress trip');
    }

    const updates = {
      emergencyStop: !!active,
      emergencyStopAt: active ? new Date() : null,
      emergencyStopReason: active ? (reason || null) : null,
      updatedBy: actor?.id,
    };

    const updated = await this.tripRepository.update(tripId, updates);
    this.logger.info('Trip emergency stop updated', { tripId, active: !!active, actorId: actor?.id });
    return updated;
  }
}

module.exports = SetEmergencyStopUseCase;
