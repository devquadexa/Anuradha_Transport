const { NotFoundError } = require('../../../domain/errors');

class DeleteDriverUseCase {
  constructor(driverRepository, logger) {
    this.driverRepository = driverRepository;
    this.logger = logger;
  }

  async execute(id, deletedBy) {
    const existing = await this.driverRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Driver not found');
    }

    await this.driverRepository.softDelete(id);
    this.logger.info('Driver soft-deleted', { driverId: id, deletedBy });
  }
}

module.exports = DeleteDriverUseCase;
