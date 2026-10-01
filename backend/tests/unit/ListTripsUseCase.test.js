const ListTripsUseCase = require('../../src/application/use-cases/trips/ListTripsUseCase');

describe('ListTripsUseCase', () => {
  function buildDeps() {
    const tripRepository = {
      list: jest.fn().mockResolvedValue({ rows: ['all-trips'], total: 1 }),
      listForDriver: jest.fn().mockResolvedValue({ rows: ['own-trips'], total: 1 }),
    };
    const driverRepository = {
      findByUserId: jest.fn(),
    };
    return { tripRepository, driverRepository };
  }

  it('returns all trips for an Admin actor', async () => {
    const deps = buildDeps();
    const useCase = new ListTripsUseCase(deps.tripRepository, deps.driverRepository);

    const result = await useCase.execute({ page: 1, pageSize: 20 }, { id: 1, role: 'ADMIN' });

    expect(deps.tripRepository.list).toHaveBeenCalledTimes(1);
    expect(deps.tripRepository.listForDriver).not.toHaveBeenCalled();
    expect(result.rows).toEqual(['all-trips']);
  });

  it('scopes results to the driver own profile when actor is a DRIVER', async () => {
    const deps = buildDeps();
    deps.driverRepository.findByUserId.mockResolvedValue({ id: 42 });
    const useCase = new ListTripsUseCase(deps.tripRepository, deps.driverRepository);

    const result = await useCase.execute({ page: 1, pageSize: 20 }, { id: 7, role: 'DRIVER' });

    expect(deps.driverRepository.findByUserId).toHaveBeenCalledWith(7);
    expect(deps.tripRepository.listForDriver).toHaveBeenCalledWith(42, { page: 1, pageSize: 20 });
    expect(deps.tripRepository.list).not.toHaveBeenCalled();
    expect(result.rows).toEqual(['own-trips']);
  });

  it('returns an empty result when a DRIVER actor has no linked driver profile', async () => {
    const deps = buildDeps();
    deps.driverRepository.findByUserId.mockResolvedValue(null);
    const useCase = new ListTripsUseCase(deps.tripRepository, deps.driverRepository);

    const result = await useCase.execute({ page: 1, pageSize: 20 }, { id: 7, role: 'DRIVER' });

    expect(result).toEqual({ rows: [], total: 0, page: 1, pageSize: 20 });
    expect(deps.tripRepository.listForDriver).not.toHaveBeenCalled();
  });
});
