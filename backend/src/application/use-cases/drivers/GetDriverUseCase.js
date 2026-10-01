const { NotFoundError } = require('../../../domain/errors');

class GetDriverUseCase {
  constructor(driverRepository) {
    this.driverRepository = driverRepository;
  }

  async execute(id) {
    const driver = await this.driverRepository.findById(id);
    if (!driver) {
      throw new NotFoundError('Driver not found');
    }
    return driver;
  }
}

module.exports = GetDriverUseCase;
