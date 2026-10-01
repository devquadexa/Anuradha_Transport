'use strict';

// module:action permissions for the modules currently in scope.
// Additional modules (vehicles, warehouses, routes, deliveries, notifications)
// will get their own permissions added in a later seeder once those modules are built.
const crudModules = ['users', 'roles', 'drivers', 'customers', 'trips'];
const actions = ['create', 'read', 'update', 'delete'];

// Dashboard and audit logs are read-only views, not full CRUD resources.
const readOnlyModules = ['dashboard', 'audit-logs'];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = [];

    for (const mod of crudModules) {
      for (const action of actions) {
        rows.push({
          name: `${mod}:${action}`,
          module: mod,
          description: `${action.toUpperCase()} access to ${mod}`,
          created_at: now,
          updated_at: now,
        });
      }
    }

    for (const mod of readOnlyModules) {
      rows.push({
        name: `${mod}:read`,
        module: mod,
        description: `READ access to ${mod}`,
        created_at: now,
        updated_at: now,
      });
    }

    // Trip assignment is a distinct action from generic trip update,
    // since only Super Admin/Admin can assign trips to drivers.
    rows.push({
      name: 'trips:assign',
      module: 'trips',
      description: 'Assign trips to drivers',
      created_at: now,
      updated_at: now,
    });

    await queryInterface.bulkInsert('permissions', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('permissions', null, {});
  },
};
