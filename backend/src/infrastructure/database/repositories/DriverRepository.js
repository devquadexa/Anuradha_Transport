const { Op } = require('sequelize');
const IDriverRepository = require('../../../domain/repositories/IDriverRepository');
const Driver = require('../../../domain/entities/Driver');
const { Driver: DriverModel } = require('../sequelize/models');

function toDomain(instance) {
  if (!instance) return null;
  const plain = instance.get({ plain: true });
  return new Driver({
    id: plain.id,
    userId: plain.userId,
    firstName: plain.firstName,
    lastName: plain.lastName,
    nicNumber: plain.nicNumber,
    phone: plain.phone,
    email: plain.email,
    licenseNumber: plain.licenseNumber,
    licenseExpiry: plain.licenseExpiry,
    address: plain.address,
    vehicleNumber: plain.vehicleNumber,
    insuranceProvider: plain.insuranceProvider,
    insurancePolicyNumber: plain.insurancePolicyNumber,
    insuranceExpiry: plain.insuranceExpiry,
    status: plain.status,
    notes: plain.notes,
    createdBy: plain.createdBy,
    updatedBy: plain.updatedBy,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    deletedAt: plain.deletedAt,
  });
}

class DriverRepository extends IDriverRepository {
  async findById(id) {
    const instance = await DriverModel.findByPk(id);
    return toDomain(instance);
  }

  async findByUserId(userId) {
    const instance = await DriverModel.findOne({ where: { userId } });
    return toDomain(instance);
  }

  async existsByNicOrLicense(nicNumber, licenseNumber) {
    const count = await DriverModel.count({
      where: { [Op.or]: [{ nicNumber }, { licenseNumber }] },
    });
    return count > 0;
  }

  async create(data) {
    const instance = await DriverModel.create(data);
    return toDomain(instance);
  }

  async update(id, data) {
    await DriverModel.update(data, { where: { id } });
    return this.findById(id);
  }

  async softDelete(id) {
    await DriverModel.destroy({ where: { id } });
  }

  async list({ page, pageSize, offset, sortBy, sortOrder, search, status }) {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { nicNumber: { [Op.like]: `%${search}%` } },
        { licenseNumber: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await DriverModel.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [[sortBy, sortOrder]],
    });

    return { rows: rows.map(toDomain), total: count, page, pageSize };
  }

  async listActive() {
    const instances = await DriverModel.findAll({ where: { status: 'active' }, order: [['firstName', 'ASC']] });
    return instances.map(toDomain);
  }
}

module.exports = new DriverRepository();
