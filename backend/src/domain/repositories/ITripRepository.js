class ITripRepository {
  async findById(_id) {
    throw new Error('ITripRepository.findById not implemented');
  }

  async create(_data, _stops) {
    throw new Error('ITripRepository.create not implemented');
  }

  async update(_id, _data) {
    throw new Error('ITripRepository.update not implemented');
  }

  async softDelete(_id) {
    throw new Error('ITripRepository.softDelete not implemented');
  }

  async list(_options) {
    // options: { ...pagination, status, driverId, customerId, dateFrom, dateTo }
    throw new Error('ITripRepository.list not implemented');
  }

  async listForDriver(_driverId, _options) {
    throw new Error('ITripRepository.listForDriver not implemented');
  }

  async replaceStops(_tripId, _stops) {
    throw new Error('ITripRepository.replaceStops not implemented');
  }

  async reorderStops(_tripId, _orderedStops) {
    throw new Error('ITripRepository.reorderStops not implemented');
  }

  async generateNextTripNumber() {
    throw new Error('ITripRepository.generateNextTripNumber not implemented');
  }
}

module.exports = ITripRepository;
