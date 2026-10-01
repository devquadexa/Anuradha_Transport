const { ConflictError } = require('../../../domain/errors');

class CreateDriverUseCase {
  constructor(driverRepository, logger) {
    this.driverRepository = driverRepository;
    this.logger = logger;
  }

  async execute({ nicNumber, licenseNumber, userId, createdBy, ...data }) {
    const exists = await this.driverRepository.existsByNicOrLicense(nicNumber, licenseNumber);
    if (exists) {
      throw new ConflictError('A driver with this NIC number or license number already exists');
    }

    if (userId) {
      const existingLink = await this.driverRepository.findByUserId(userId);
      if (existingLink) {
        throw new ConflictError('This user account is already linked to another driver profile');
      }
    }

    const driver = await this.driverRepository.create({ ...data, nicNumber, licenseNumber, userId: userId || null, createdBy });
    this.logger.info('Driver created', { driverId: driver.id, createdBy });
    return driver;
  }
}

module.exports = CreateDriverUseCase;
