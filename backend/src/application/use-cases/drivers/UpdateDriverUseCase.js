const { NotFoundError, ConflictError } = require('../../../domain/errors');

class UpdateDriverUseCase {
  constructor(driverRepository, logger) {
    this.driverRepository = driverRepository;
    this.logger = logger;
  }

  async execute(id, updates, updatedBy) {
    const existing = await this.driverRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Driver not found');
    }

    if (updates.userId) {
      const existingLink = await this.driverRepository.findByUserId(updates.userId);
      if (existingLink && existingLink.id !== Number(id)) {
        throw new ConflictError('This user account is already linked to another driver profile');
      }
    }

    const driver = await this.driverRepository.update(id, { ...updates, updatedBy });
    this.logger.info('Driver updated', { driverId: id, updatedBy });
    return driver;
  }
}

module.exports = UpdateDriverUseCase;
