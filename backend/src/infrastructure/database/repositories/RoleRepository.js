const IRoleRepository = require('../../../domain/repositories/IRoleRepository');
const Role = require('../../../domain/entities/Role');
const { Role: RoleModel, Permission: PermissionModel } = require('../sequelize/models');

function toDomain(instance) {
  if (!instance) return null;
  const plain = instance.get({ plain: true });
  return new Role({
    id: plain.id,
    name: plain.name,
    description: plain.description,
    isActive: plain.isActive,
    permissions: (plain.Permissions || []).map((p) => p.name),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    deletedAt: plain.deletedAt,
  });
}

class RoleRepository extends IRoleRepository {
  async findById(id) {
    const instance = await RoleModel.findByPk(id, { include: [PermissionModel] });
    return toDomain(instance);
  }

  async findByName(name) {
    const instance = await RoleModel.findOne({ where: { name }, include: [PermissionModel] });
    return toDomain(instance);
  }

  async list() {
    const instances = await RoleModel.findAll({ include: [PermissionModel] });
    return instances.map(toDomain);
  }
}

module.exports = new RoleRepository();
