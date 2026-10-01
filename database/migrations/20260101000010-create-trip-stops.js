'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trip_stops', {
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
      sequence_no: {
        // Delivery order within the trip: 1, 2, 3...
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      location_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      contact_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      contact_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'arrived', 'delivered', 'skipped'),
        allowNull: false,
        defaultValue: 'pending',
      },
      notes: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      arrived_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('trip_stops', ['trip_id']);
    await queryInterface.addConstraint('trip_stops', {
      fields: ['trip_id', 'sequence_no'],
      type: 'unique',
      name: 'uq_trip_stop_sequence',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('trip_stops');
  },
};
