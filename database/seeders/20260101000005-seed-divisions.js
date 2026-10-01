'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const divisions = [
      'BTE', 'LAD', 'VET', 'BIP', 'LAG', 'SIE', 'DBA', 'T',
    ];

    await queryInterface.bulkInsert(
      'divisions',
      divisions.map((name) => ({ name, created_at: now, updated_at: now }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('divisions', null, {});
  },
};
