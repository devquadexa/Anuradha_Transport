'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('trips', 'end_point', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'destination',
    });

    await queryInterface.addColumn('trips', 'final_odometer_reading', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      after: 'mileage',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('trips', 'final_odometer_reading');
    await queryInterface.removeColumn('trips', 'end_point');
  },
};
