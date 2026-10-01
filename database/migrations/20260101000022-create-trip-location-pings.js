'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trip_location_pings', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      trip_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'trips', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      driver_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false,
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false,
      },
      speed: {
        type: Sequelize.DECIMAL(5, 1),
        allowNull: true,
        comment: 'Speed in km/h at the time of ping',
      },
      recorded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('trip_location_pings', ['trip_id']);
    await queryInterface.addIndex('trip_location_pings', ['driver_id']);
    await queryInterface.addIndex('trip_location_pings', ['recorded_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('trip_location_pings');
  },
};
