const GetTripUseCase = require('../../src/application/use-cases/trips/GetTripUseCase');
const { NotFoundError, ForbiddenError } = require('../../src/domain/errors');

describe('GetTripUseCase', () => {
  const trip = { id: 1, driverId: 42 };

  function buildDeps({ foundTrip = trip, driverProfile = { id: 42 } } = {}) {
    const tripRepository = { findById: jest.fn().mockResolvedValue(foundTrip) };
    const driverRepository = { findByUserId: jest.fn().mockResolvedValue(driverProfile) };
    return { tripRepository, driverRepository };
  }

  it('throws NotFoundError when trip does not exist', async () => {
    const deps = buildDeps({ foundTrip: null });
    const useCase = new GetTripUseCase(deps.tripRepository, deps.driverRepository);

    await expect(useCase.execute(999, { id: 1, role: 'ADMIN' })).rejects.toThrow(NotFoundError);
  });

  it('allows Admin to view any trip', async () => {
    const deps = buildDeps();
    const useCase = new GetTripUseCase(deps.tripRepository, deps.driverRepository);

    const result = await useCase.execute(1, { id: 1, role: 'ADMIN' });
    expect(result).toBe(trip);
    expect(deps.driverRepository.findByUserId).not.toHaveBeenCalled();
  });

  it('allows a Driver to view a trip assigned to them', async () => {
    const deps = buildDeps({ driverProfile: { id: 42 } });
    const useCase = new GetTripUseCase(deps.tripRepository, deps.driverRepository);

    const result = await useCase.execute(1, { id: 7, role: 'DRIVER' });
    expect(result).toBe(trip);
  });

  it('throws ForbiddenError when a Driver tries to view a trip not assigned to them', async () => {
    const deps = buildDeps({ driverProfile: { id: 999 } });
    const useCase = new GetTripUseCase(deps.tripRepository, deps.driverRepository);

    await expect(useCase.execute(1, { id: 7, role: 'DRIVER' })).rejects.toThrow(ForbiddenError);
  });

  it('throws ForbiddenError when a Driver actor has no linked driver profile', async () => {
    const deps = buildDeps({ driverProfile: null });
    const useCase = new GetTripUseCase(deps.tripRepository, deps.driverRepository);

    await expect(useCase.execute(1, { id: 7, role: 'DRIVER' })).rejects.toThrow(ForbiddenError);
  });
});
