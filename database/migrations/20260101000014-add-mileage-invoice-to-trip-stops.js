'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('trip_stops', 'mileage', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      after: 'notes',
    });

    await queryInterface.addColumn('trip_stops', 'invoice_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'mileage',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('trip_stops', 'invoice_number');
    await queryInterface.removeColumn('trip_stops', 'mileage');
  },
};
