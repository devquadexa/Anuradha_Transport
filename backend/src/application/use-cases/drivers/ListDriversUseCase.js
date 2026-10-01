class ListDriversUseCase {
  constructor(driverRepository) {
    this.driverRepository = driverRepository;
  }

  async execute(options) {
    return this.driverRepository.list(options);
  }
}

module.exports = ListDriversUseCase;
