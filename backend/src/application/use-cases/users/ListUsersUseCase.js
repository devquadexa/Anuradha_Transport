class ListUsersUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(options) {
    return this.userRepository.list(options);
    // expected return shape: { rows: User[], total: number }
  }
}

module.exports = ListUsersUseCase;
