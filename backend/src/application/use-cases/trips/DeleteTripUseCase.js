const { NotFoundError } = require('../../../domain/errors');

class DeleteTripUseCase {
  constructor(tripRepository, logger) {
    this.tripRepository = tripRepository;
    this.logger = logger;
  }

  async execute(id, deletedBy) {
    const existing = await this.tripRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Trip not found');
    }

    await this.tripRepository.softDelete(id);
    this.logger.info('Trip soft-deleted', { tripId: id, deletedBy });
  }
}

module.exports = DeleteTripUseCase;
