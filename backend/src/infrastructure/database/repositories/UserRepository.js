const { Op } = require('sequelize');
const IUserRepository = require('../../../domain/repositories/IUserRepository');
const User = require('../../../domain/entities/User');
const { User: UserModel, Role: RoleModel, Driver: DriverModel } = require('../sequelize/models');

function toDomain(instance) {
  if (!instance) return null;
  const plain = instance.get({ plain: true });
  const driver = plain.Driver || null;
  return new User({
    id: plain.id,
    roleId: plain.roleId,
    roleName: plain.Role ? plain.Role.name : undefined,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
    phone: plain.phone,
    passwordHash: plain.passwordHash,
    status: plain.status,
    lastLoginAt: plain.lastLoginAt,
    createdBy: plain.createdBy,
    updatedBy: plain.updatedBy,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    deletedAt: plain.deletedAt,
    // Driver fields (only populated when user has a linked driver record)
    driver: driver ? {
      id: driver.id,
      nicNumber: driver.nicNumber,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry,
      vehicleNumber: driver.vehicleNumber,
      insuranceProvider: driver.insuranceProvider,
      insurancePolicyNumber: driver.insurancePolicyNumber,
      insuranceExpiry: driver.insuranceExpiry,
      address: driver.address,
      notes: driver.notes,
    } : null,
  });
}

/**
 * Concrete implementation of IUserRepository backed by Sequelize. This is
 * the only place in the codebase that should import the User Sequelize
 * model directly.
 */
class UserRepository extends IUserRepository {
  async findById(id) {
    const instance = await UserModel.findByPk(id, { include: [RoleModel, DriverModel] });
    return toDomain(instance);
  }

  async findByEmail(email) {
    const instance = await UserModel.findOne({ where: { email }, include: [RoleModel, DriverModel] });
    return toDomain(instance);
  }

  async existsByEmail(email) {
    const count = await UserModel.count({ where: { email } });
    return count > 0;
  }

  async create(userData) {
    const instance = await UserModel.create(userData);
    return toDomain(instance);
  }

  async update(id, userData) {
    await UserModel.update(userData, { where: { id } });
    return this.findById(id);
  }

  async softDelete(id) {
    await UserModel.destroy({ where: { id } }); // paranoid: soft delete
  }

  async list({ page, pageSize, offset, sortBy, sortOrder, search, status, roleId }) {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await UserModel.findAndCountAll({
      where,
      include: [RoleModel, DriverModel],
      limit: pageSize,
      offset,
      order: [[sortBy, sortOrder]],
    });

    return {
      rows: rows.map(toDomain),
      total: count,
      page,
      pageSize,
    };
  }
}

module.exports = new UserRepository();
