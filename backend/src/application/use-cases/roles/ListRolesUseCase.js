class ListRolesUseCase {
  constructor(roleRepository) {
    this.roleRepository = roleRepository;
  }

  async execute() {
    return this.roleRepository.list();
  }
}

module.exports = ListRolesUseCase;
