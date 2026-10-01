'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('trip_stops', 'latitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
      after: 'invoice_number',
    });

    await queryInterface.addColumn('trip_stops', 'longitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
      after: 'latitude',
    });

    // Also add start coordinates to trips table (captured when trip starts)
    await queryInterface.addColumn('trips', 'start_latitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
      after: 'invoice_number',
    });

    await queryInterface.addColumn('trips', 'start_longitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
      after: 'start_latitude',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('trip_stops', 'longitude');
    await queryInterface.removeColumn('trip_stops', 'latitude');
    await queryInterface.removeColumn('trips', 'start_longitude');
    await queryInterface.removeColumn('trips', 'start_latitude');
  },
};
