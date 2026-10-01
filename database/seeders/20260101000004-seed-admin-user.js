'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const [superAdminRole] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        role_id: superAdminRole.id,
        first_name: 'System',
        last_name: 'Administrator',
        email: 'admin@anuradhatransport.lk',
        phone: null,
        password_hash: 'ChangeMe@123',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@anuradhatransport.lk' }, {});
  },
};
