'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('trips', 'mileage', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      after: 'remarks',
    });

    await queryInterface.addColumn('trips', 'invoice_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'mileage',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('trips', 'invoice_number');
    await queryInterface.removeColumn('trips', 'mileage');
  },
};
