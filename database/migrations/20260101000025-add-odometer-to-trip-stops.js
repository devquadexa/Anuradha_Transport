'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('trip_stops', 'odometer_reading', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      after: 'driver_mileage',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('trip_stops', 'odometer_reading');
  },
};
