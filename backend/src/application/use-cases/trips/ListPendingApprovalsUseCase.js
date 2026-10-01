class ListPendingApprovalsUseCase {
  constructor(tripRepository) {
    this.tripRepository = tripRepository;
  }

  async execute(options) {
    return this.tripRepository.listPendingApproval(options);
  }
}

module.exports = ListPendingApprovalsUseCase;
