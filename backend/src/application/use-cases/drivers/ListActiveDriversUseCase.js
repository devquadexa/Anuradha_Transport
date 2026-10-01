/**
 * Lightweight lookup used by the Trip Management "assign driver" dropdown -
 * returns only active drivers, unpaginated.
 */
class ListActiveDriversUseCase {
  constructor(driverRepository) {
    this.driverRepository = driverRepository;
  }

  async execute() {
    return this.driverRepository.listActive();
  }
}

module.exports = ListActiveDriversUseCase;
