function toRoleResponseDto(role) {
  if (!role) return null;
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
  };
}

module.exports = { toRoleResponseDto };
