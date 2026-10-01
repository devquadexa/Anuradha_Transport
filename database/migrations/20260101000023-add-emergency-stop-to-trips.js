'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('trips', 'emergency_stop', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'rejection_reason',
    });

    await queryInterface.addColumn('trips', 'emergency_stop_at', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'emergency_stop',
    });

    await queryInterface.addColumn('trips', 'emergency_stop_reason', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'emergency_stop_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('trips', 'emergency_stop_reason');
    await queryInterface.removeColumn('trips', 'emergency_stop_at');
    await queryInterface.removeColumn('trips', 'emergency_stop');
  },
};
