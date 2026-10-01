'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = await queryInterface.sequelize.query('SELECT id, name FROM roles', {
      type: Sequelize.QueryTypes.SELECT,
    });
    const permissions = await queryInterface.sequelize.query('SELECT id, name FROM permissions', {
      type: Sequelize.QueryTypes.SELECT,
    });

    const superAdmin = roles.find((r) => r.name === 'SUPER_ADMIN');
    const admin = roles.find((r) => r.name === 'ADMIN');
    const driver = roles.find((r) => r.name === 'DRIVER');
    const now = new Date();

    const byName = (name) => permissions.find((p) => p.name === name);
    const rows = [];

    const assign = (roleId, permissionNames) => {
      permissionNames.forEach((name) => {
        const permission = byName(name);
        if (!permission) {
          throw new Error(`Permission "${name}" not found - check the permissions seeder`);
        }
        rows.push({ role_id: roleId, permission_id: permission.id, created_at: now });
      });
    };

    // SUPER_ADMIN: every permission, including roles and user management.
    assign(superAdmin.id, permissions.map((p) => p.name));

    // ADMIN: dashboard, customers, drivers, trips (full CRUD + assign),
    // and user management (create/read/update only - no delete, no roles).
    assign(admin.id, [
      'dashboard:read',
      'customers:create',
      'customers:read',
      'customers:update',
      'customers:delete',
      'drivers:create',
      'drivers:read',
      'drivers:update',
      'drivers:delete',
      'trips:create',
      'trips:read',
      'trips:update',
      'trips:delete',
      'trips:assign',
      'users:create',
      'users:read',
      'users:update',
    ]);

    // DRIVER: read-only access to trips assigned to them. Own-profile
    // access goes through GET /auth/me (no permission required beyond
    // being authenticated), so no `users:read` permission is granted here -
    // that would otherwise allow listing all users. Scoping trips to
    // "assigned to me only" is enforced in the application layer.
    assign(driver.id, ['trips:read']);

    await queryInterface.bulkInsert('role_permissions', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('role_permissions', null, {});
  },
};
