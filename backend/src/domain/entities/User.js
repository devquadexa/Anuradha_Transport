/**
 * Domain entity - pure business object, no framework/ORM dependencies.
 * Represents a system user independent of how it is persisted (Sequelize)
 * or transported (Express/JSON).
 */
class User {
  constructor({
    id,
    roleId,
    roleName,
    firstName,
    lastName,
    email,
    phone,
    passwordHash,
    status,
    lastLoginAt,
    createdBy,
    updatedBy,
    createdAt,
    updatedAt,
    deletedAt,
    driver,
  }) {
    this.id = id;
    this.roleId = roleId;
    this.roleName = roleName;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.phone = phone;
    this.passwordHash = passwordHash;
    this.status = status;
    this.lastLoginAt = lastLoginAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
    this.driver = driver || null;
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  isActive() {
    return this.status === 'active' && !this.deletedAt;
  }

  canAuthenticate() {
    return this.isActive();
  }
}

module.exports = User;
