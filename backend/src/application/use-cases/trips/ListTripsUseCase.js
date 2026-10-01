const RoleName = require('../../../domain/enums/RoleName');

/**
 * Lists trips. When the actor is a DRIVER, results are always scoped to
 * trips assigned to that driver's own profile, regardless of any
 * driverId query param the client might send - the restriction is
 * enforced here, not trusted from client input.
 */
class ListTripsUseCase {
  constructor(tripRepository, driverRepository) {
    this.tripRepository = tripRepository;
    this.driverRepository = driverRepository;
  }

  async execute(options, actor) {
    if (actor?.role === RoleName.DRIVER) {
      const driverProfile = await this.driverRepository.findByUserId(actor.id);
      if (!driverProfile) {
        return { rows: [], total: 0, page: options.page, pageSize: options.pageSize };
      }
      return this.tripRepository.listForDriver(driverProfile.id, options);
    }

    return this.tripRepository.list(options);
  }
}

module.exports = ListTripsUseCase;
