const UpdateTripStatusUseCase = require('../../src/application/use-cases/trips/UpdateTripStatusUseCase');
const { NotFoundError, ValidationError, ForbiddenError } = require('../../src/domain/errors');
const Trip = require('../../src/domain/entities/Trip');

describe('UpdateTripStatusUseCase', () => {
  const assignedTrip = new Trip({ id: 1, tripNumber: 'TRP-1', status: 'assigned', driverId: 42 });

  function buildDeps({ trip = assignedTrip, driverProfile = { id: 42 } } = {}) {
    const tripRepository = {
      findById: jest.fn().mockResolvedValue(trip),
      update: jest.fn().mockResolvedValue({ ...trip, status: 'in_progress' }),
    };
    const driverRepository = { findByUserId: jest.fn().mockResolvedValue(driverProfile) };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    return { tripRepository, driverRepository, logger };
  }

  it('allows Admin to transition any trip', async () => {
    const deps = buildDeps();
    const useCase = new UpdateTripStatusUseCase(deps.tripRepository, deps.driverRepository, deps.logger);

    await useCase.execute(1, 'in_progress', { id: 1, role: 'ADMIN' });

    expect(deps.tripRepository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: 'in_progress', startedAt: expect.any(Date) })
    );
  });

  it('allows a Driver to transition their own assigned trip', async () => {
    const deps = buildDeps();
    const useCase = new UpdateTripStatusUseCase(deps.tripRepository, deps.driverRepository, deps.logger);

    await useCase.execute(1, 'in_progress', { id: 7, role: 'DRIVER' });
    expect(deps.tripRepository.update).toHaveBeenCalledTimes(1);
  });

  it('throws ForbiddenError when a Driver tries to transition a trip not assigned to them', async () => {
    const deps = buildDeps({ driverProfile: { id: 999 } });
    const useCase = new UpdateTripStatusUseCase(deps.tripRepository, deps.driverRepository, deps.logger);

    await expect(useCase.execute(1, 'in_progress', { id: 7, role: 'DRIVER' })).rejects.toThrow(ForbiddenError);
    expect(deps.tripRepository.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when trip does not exist', async () => {
    const deps = buildDeps({ trip: null });
    const useCase = new UpdateTripStatusUseCase(deps.tripRepository, deps.driverRepository, deps.logger);

    await expect(useCase.execute(999, 'in_progress', { id: 1, role: 'ADMIN' })).rejects.toThrow(NotFoundError);
  });

  it('throws ValidationError for an invalid status transition', async () => {
    const deps = buildDeps();
    const useCase = new UpdateTripStatusUseCase(deps.tripRepository, deps.driverRepository, deps.logger);

    await expect(useCase.execute(1, 'completed', { id: 1, role: 'ADMIN' })).rejects.toThrow(ValidationError);
    expect(deps.tripRepository.update).not.toHaveBeenCalled();
  });
});
