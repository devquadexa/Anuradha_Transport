const AssignTripUseCase = require('../../src/application/use-cases/trips/AssignTripUseCase');
const { NotFoundError, ValidationError } = require('../../src/domain/errors');
const Trip = require('../../src/domain/entities/Trip');
const Driver = require('../../src/domain/entities/Driver');

describe('AssignTripUseCase', () => {
  const pendingTrip = new Trip({ id: 1, tripNumber: 'TRP-2026-000001', status: 'pending' });
  const completedTrip = new Trip({ id: 2, tripNumber: 'TRP-2026-000002', status: 'completed' });
  const activeDriver = new Driver({ id: 5, firstName: 'A', lastName: 'B', status: 'active' });
  const inactiveDriver = new Driver({ id: 6, firstName: 'C', lastName: 'D', status: 'inactive' });

  function buildDeps({ trip = pendingTrip, driver = activeDriver } = {}) {
    const tripRepository = {
      findById: jest.fn().mockResolvedValue(trip),
      update: jest.fn().mockResolvedValue({ ...trip, driverId: driver?.id, status: 'assigned' }),
    };
    const driverRepository = { findById: jest.fn().mockResolvedValue(driver) };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    return { tripRepository, driverRepository, logger };
  }

  it('assigns an active driver to a pending trip', async () => {
    const deps = buildDeps();
    const useCase = new AssignTripUseCase(deps.tripRepository, deps.driverRepository, deps.logger);

    await useCase.execute(1, 5, 1);

    expect(deps.tripRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ driverId: 5, status: 'assigned', updatedBy: 1 })
    );
  });

  it('throws NotFoundError when trip does not exist', async () => {
    const deps = buildDeps({ trip: null });
    const useCase = new AssignTripUseCase(deps.tripRepository, deps.driverRepository, deps.logger);

    await expect(useCase.execute(999, 5, 1)).rejects.toThrow(NotFoundError);
  });

  it('throws ValidationError when trip is already completed', async () => {
    const deps = buildDeps({ trip: completedTrip });
    const useCase = new AssignTripUseCase(deps.tripRepository, deps.driverRepository, deps.logger);

    await expect(useCase.execute(2, 5, 1)).rejects.toThrow(ValidationError);
    expect(deps.tripRepository.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when driver does not exist', async () => {
    const deps = buildDeps({ driver: null });
    const useCase = new AssignTripUseCase(deps.tripRepository, deps.driverRepository, deps.logger);

    await expect(useCase.execute(1, 999, 1)).rejects.toThrow(NotFoundError);
  });

  it('throws ValidationError when driver is not active', async () => {
    const deps = buildDeps({ driver: inactiveDriver });
    const useCase = new AssignTripUseCase(deps.tripRepository, deps.driverRepository, deps.logger);

    await expect(useCase.execute(1, 6, 1)).rejects.toThrow(ValidationError);
    expect(deps.tripRepository.update).not.toHaveBeenCalled();
  });
});
