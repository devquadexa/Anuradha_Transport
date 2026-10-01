class Role {
  constructor({ id, name, description, isActive, permissions = [], createdAt, updatedAt, deletedAt }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.isActive = isActive;
    this.permissions = permissions; // array of permission names
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }

  hasPermission(permissionName) {
    return this.permissions.includes(permissionName);
  }
}

module.exports = Role;
