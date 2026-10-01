class IDriverRepository {
  async findById(_id) {
    throw new Error('IDriverRepository.findById not implemented');
  }

  async findByUserId(_userId) {
    throw new Error('IDriverRepository.findByUserId not implemented');
  }

  async existsByNicOrLicense(_nicNumber, _licenseNumber) {
    throw new Error('IDriverRepository.existsByNicOrLicense not implemented');
  }

  async create(_data) {
    throw new Error('IDriverRepository.create not implemented');
  }

  async update(_id, _data) {
    throw new Error('IDriverRepository.update not implemented');
  }

  async softDelete(_id) {
    throw new Error('IDriverRepository.softDelete not implemented');
  }

  async list(_options) {
    throw new Error('IDriverRepository.list not implemented');
  }

  async listActive() {
    throw new Error('IDriverRepository.listActive not implemented');
  }
}

module.exports = IDriverRepository;
