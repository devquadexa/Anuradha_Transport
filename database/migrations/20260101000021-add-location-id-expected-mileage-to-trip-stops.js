'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('trip_stops', 'location_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      after: 'trip_id',
      references: { model: 'locations', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('trip_stops', 'expected_mileage', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Pre-calculated road distance from previous stop (via OSRM)',
      after: 'driver_mileage',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('trip_stops', 'expected_mileage');
    await queryInterface.removeColumn('trip_stops', 'location_id');
  },
};
