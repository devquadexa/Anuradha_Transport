const { NotFoundError } = require('../../../domain/errors');

class DeleteCustomerUseCase {
  constructor(customerRepository, logger) {
    this.customerRepository = customerRepository;
    this.logger = logger;
  }

  async execute(id, deletedBy) {
    const existing = await this.customerRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Customer not found');
    }

    await this.customerRepository.softDelete(id);
    this.logger.info('Customer soft-deleted', { customerId: id, deletedBy });
  }
}

module.exports = DeleteCustomerUseCase;
