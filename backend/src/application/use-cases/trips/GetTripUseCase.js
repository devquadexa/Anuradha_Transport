const { NotFoundError, ForbiddenError } = require('../../../domain/errors');
const RoleName = require('../../../domain/enums/RoleName');

class GetTripUseCase {
  constructor(tripRepository, driverRepository) {
    this.tripRepository = tripRepository;
    this.driverRepository = driverRepository;
  }

  /**
   * @param {number} id
   * @param {{ id: number, role: string }} actor - the authenticated user
   */
  async execute(id, actor) {
    const trip = await this.tripRepository.findById(id);
    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    if (actor?.role === RoleName.DRIVER) {
      const driverProfile = await this.driverRepository.findByUserId(actor.id);
      if (!driverProfile || trip.driverId !== driverProfile.id) {
        throw new ForbiddenError('You can only view trips assigned to you');
      }
    }

    return trip;
  }
}

module.exports = GetTripUseCase;
