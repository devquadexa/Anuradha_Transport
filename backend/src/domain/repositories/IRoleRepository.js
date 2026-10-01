class IRoleRepository {
  async findById(_id) {
    throw new Error('IRoleRepository.findById not implemented');
  }

  async findByName(_name) {
    throw new Error('IRoleRepository.findByName not implemented');
  }

  async list(_options) {
    throw new Error('IRoleRepository.list not implemented');
  }
}

module.exports = IRoleRepository;
