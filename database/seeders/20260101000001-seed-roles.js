'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('roles', [
      { name: 'SUPER_ADMIN', description: 'Full system access, including user and role management', is_active: true, created_at: now, updated_at: now },
      { name: 'ADMIN', description: 'Operational access: dashboard, customers, drivers, user management', is_active: true, created_at: now, updated_at: now },
      { name: 'DRIVER', description: 'Restricted access: own profile and assigned trips only', is_active: true, created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};
