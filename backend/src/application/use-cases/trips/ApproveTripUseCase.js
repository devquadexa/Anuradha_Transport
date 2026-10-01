const { NotFoundError, ValidationError } = require('../../../domain/errors');

class ApproveTripUseCase {
  constructor(tripRepository, logger) {
    this.tripRepository = tripRepository;
    this.logger = logger;
  }

  async execute(tripId, { approved, rejectionReason }, actor) {
    const trip = await this.tripRepository.findById(tripId);
    if (!trip) throw new NotFoundError('Trip not found');
    if (trip.status !== 'completed') throw new ValidationError('Only completed trips can be approved/rejected');
    if (trip.approvalStatus !== 'pending') throw new ValidationError('Trip has already been reviewed');

    const updates = {
      approvalStatus: approved ? 'approved' : 'rejected',
      approvedBy: actor.id,
      approvedAt: new Date(),
      updatedBy: actor.id,
    };
    if (!approved && rejectionReason) {
      updates.rejectionReason = rejectionReason;
    }

    const updated = await this.tripRepository.update(tripId, updates);
    this.logger.info('Trip approval updated', { tripId, approved, actorId: actor.id });
    return updated;
  }
}

module.exports = ApproveTripUseCase;
