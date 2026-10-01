class ICustomerRepository {
  async findById(_id) {
    throw new Error('ICustomerRepository.findById not implemented');
  }

  async create(_data) {
    throw new Error('ICustomerRepository.create not implemented');
  }

  async update(_id, _data) {
    throw new Error('ICustomerRepository.update not implemented');
  }

  async softDelete(_id) {
    throw new Error('ICustomerRepository.softDelete not implemented');
  }

  async list(_options) {
    throw new Error('ICustomerRepository.list not implemented');
  }
}

module.exports = ICustomerRepository;
