'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('trip_stops', 'gps_location_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'longitude',
    });

    await queryInterface.addColumn('trip_stops', 'gps_mileage', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Auto-calculated driving distance from GPS (cannot be edited by driver)',
      after: 'gps_location_name',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('trip_stops', 'gps_mileage');
    await queryInterface.removeColumn('trip_stops', 'gps_location_name');
  },
};
