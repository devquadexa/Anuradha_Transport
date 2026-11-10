const { NotFoundError, ForbiddenError } = require('../../../domain/errors');
const RoleName = require('../../../domain/enums/RoleName');
const { calculateExpectedMileages } = require('./calculateExpectedMileages');

class CreateTripUseCase {
  constructor(tripRepository, customerRepository, driverRepository, locationRepository, logger) {
    this.tripRepository = tripRepository;
    this.customerRepository = customerRepository;
    this.driverRepository = driverRepository;
    this.locationRepository = locationRepository;
    this.logger = logger;
  }

  async execute({ customerId, driverId, stops = [], createdBy, ...data }, actor) {
    // Drivers can only create trips for themselves; override any client-sent driverId.
    if (actor?.role === RoleName.DRIVER) {
      const driverProfile = await this.driverRepository.findByUserId(actor.id);
      if (!driverProfile) {
        throw new ForbiddenError('No driver profile is linked to your account. Contact an administrator.');
      }
      driverId = driverProfile.id;
    }
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    if (driverId) {
      const driver = await this.driverRepository.findById(driverId);
      if (!driver) {
        throw new NotFoundError('Driver not found');
      }
    }

    // Resolve coordinates and compute expected mileage between consecutive
    // stops (shared with UpdateTripUseCase for consistency).
    const resolvedStops = await calculateExpectedMileages(stops, data.origin, this.locationRepository);

    const tripNumber = await this.tripRepository.generateNextTripNumber();
    const status = driverId ? 'assigned' : 'pending';

    const trip = await this.tripRepository.create(
      {
        ...data,
        tripNumber,
        customerId,
        driverId: driverId || null,
        status,
        assignedAt: driverId ? new Date() : null,
        createdBy,
      },
      resolvedStops
    );

    this.logger.info('Trip created', { tripId: trip.id, tripNumber, createdBy });
    return trip;
  }
}

module.exports = CreateTripUseCase;
