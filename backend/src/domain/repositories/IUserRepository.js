/**
 * Repository interface (contract). Lives in Domain so Application use cases
 * can depend on this abstraction instead of a concrete Sequelize
 * implementation. Infrastructure provides the real implementation and it
 * is wired together in src/container.
 *
 * Every method throws by default - concrete implementations must override.
 */
class IUserRepository {
  async findById(_id) {
    throw new Error('IUserRepository.findById not implemented');
  }

  async findByEmail(_email) {
    throw new Error('IUserRepository.findByEmail not implemented');
  }

  async create(_userData) {
    throw new Error('IUserRepository.create not implemented');
  }

  async update(_id, _userData) {
    throw new Error('IUserRepository.update not implemented');
  }

  async softDelete(_id) {
    throw new Error('IUserRepository.softDelete not implemented');
  }

  async list(_options) {
    // options: { page, pageSize, filters, search, sortBy, sortOrder }
    throw new Error('IUserRepository.list not implemented');
  }

  async existsByEmail(_email) {
    throw new Error('IUserRepository.existsByEmail not implemented');
  }
}

module.exports = IUserRepository;
