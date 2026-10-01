'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('customers', [
      {
        company_name: 'Browns Group Sri Lanka',
        contact_person: 'Nimal Perera',
        email: 'logistics@brownsgroup.lk',
        phone: '+94112345678',
        address_line1: 'No. 30, Sir Razik Fareed Mawatha',
        city: 'Colombo',
        country: 'Sri Lanka',
        status: 'active',
        notes: 'Primary outsourcing partner',
        created_at: now,
        updated_at: now,
      },
      {
        company_name: 'Ceylon Cold Stores PLC',
        contact_person: 'Kamal Silva',
        email: 'supply@ccs.lk',
        phone: '+94112233445',
        address_line1: '80 Baseline Road',
        city: 'Colombo',
        country: 'Sri Lanka',
        status: 'active',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('customers', null, {});
  },
};
