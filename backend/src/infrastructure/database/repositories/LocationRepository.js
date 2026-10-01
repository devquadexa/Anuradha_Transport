const { Op } = require('sequelize');
const Location = require('../../../domain/entities/Location');
const LocationModel = require('../sequelize/models/Location.model');
const { Customer: CustomerModel } = require('../sequelize/models');

function toDomain(instance) {
  if (!instance) return null;
  const plain = instance.get({ plain: true });
  return new Location({
    id: plain.id,
    customerId: plain.customerId,
    name: plain.name,
    address: plain.address,
    latitude: plain.latitude ? parseFloat(plain.latitude) : null,
    longitude: plain.longitude ? parseFloat(plain.longitude) : null,
    contactName: plain.contactName,
    contactPhone: plain.contactPhone,
    notes: plain.notes,
    isActive: plain.isActive,
    createdBy: plain.createdBy,
    updatedBy: plain.updatedBy,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    deletedAt: plain.deletedAt,
    customer: plain.Customer ? { id: plain.Customer.id, companyName: plain.Customer.companyName } : null,
  });
}

class LocationRepository {
  async findById(id) {
    const instance = await LocationModel.findByPk(id, { include: [{ model: CustomerModel, attributes: ['id', 'companyName'] }] });
    return toDomain(instance);
  }

  async create(data) {
    const instance = await LocationModel.create(data);
    return this.findById(instance.id);
  }

  async update(id, data) {
    await LocationModel.update(data, { where: { id } });
    return this.findById(id);
  }

  async softDelete(id) {
    await LocationModel.destroy({ where: { id } });
  }

  async list({ page, pageSize, offset, sortBy, sortOrder, search, customerId }) {
    const where = {};

    if (customerId) where.customerId = customerId;

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await LocationModel.findAndCountAll({
      where,
      include: [{ model: CustomerModel, attributes: ['id', 'companyName'] }],
      limit: pageSize,
      offset,
      order: [[sortBy, sortOrder]],
    });

    return { rows: rows.map(toDomain), total: count, page, pageSize };
  }

  async listActive(customerId) {
    const where = { isActive: true };
    if (customerId) where.customerId = customerId;

    const instances = await LocationModel.findAll({
      where,
      include: [{ model: CustomerModel, attributes: ['id', 'companyName'] }],
      order: [['name', 'ASC']],
    });
    return instances.map(toDomain);
  }
}

module.exports = new LocationRepository();
