'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'DRIVER' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );
    const permissions = await queryInterface.sequelize.query(
      "SELECT id FROM permissions WHERE name = 'trips:create' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!roles.length || !permissions.length) {
      throw new Error("DRIVER role or 'trips:create' permission not found in database");
    }

    const driverRoleId = roles[0].id;
    const permissionId = permissions[0].id;

    const existing = await queryInterface.sequelize.query(
      `SELECT id FROM role_permissions WHERE role_id = ${driverRoleId} AND permission_id = ${permissionId} LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existing.length === 0) {
      await queryInterface.bulkInsert('role_permissions', [
        {
          role_id: driverRoleId,
          permission_id: permissionId,
          created_at: new Date(),
        },
      ]);
    }
  },

  async down(queryInterface, Sequelize) {
    const roles = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'DRIVER' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );
    const permissions = await queryInterface.sequelize.query(
      "SELECT id FROM permissions WHERE name = 'trips:create' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!roles.length || !permissions.length) return;

    await queryInterface.sequelize.query(
      `DELETE FROM role_permissions WHERE role_id = ${roles[0].id} AND permission_id = ${permissions[0].id}`
    );
  },
};
