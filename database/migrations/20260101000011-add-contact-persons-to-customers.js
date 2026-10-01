'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('customers', 'contact_persons', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Array of up to 3 contact persons [{name, phone, email}]',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('customers', 'contact_persons');
  },
};
