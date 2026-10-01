class ListCustomersUseCase {
  constructor(customerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute(options) {
    return this.customerRepository.list(options);
  }
}

module.exports = ListCustomersUseCase;
