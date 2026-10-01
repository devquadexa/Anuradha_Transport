const { NotFoundError } = require('../../../domain/errors');

class GetCustomerUseCase {
  constructor(customerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute(id) {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }
    return customer;
  }
}

module.exports = GetCustomerUseCase;
