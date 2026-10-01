const { NotFoundError } = require('../../../domain/errors');
const { calculateExpectedMileages } = require('./calculateExpectedMileages');

class CreateTripUseCase {
  constructor(tripRepository, customerRepository, driverRepository, locationRepository, logger) {
    this.tripRepository = tripRepository;
    this.customerRepository = customerRepository;
    this.driverRepository = driverRepository;
    this.locationRepository = locationRepository;
    this.logger = logger;
  }

  async execute({ customerId, driverId, stops = [], createdBy, ...data }) {
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
