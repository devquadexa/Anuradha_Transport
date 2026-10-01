'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('trip_stops', 'driver_mileage', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      after: 'gps_mileage',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('trip_stops', 'driver_mileage');
  },
};
