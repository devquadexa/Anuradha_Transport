'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('drivers', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        // Links the driver profile to their login account (users.role = DRIVER).
        // Nullable so a driver profile can exist before/without portal access.
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        unique: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      nic_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      license_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      license_expiry: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      vehicle_number: {
        // Free-text plate number until a dedicated Vehicles module exists.
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'on_leave', 'suspended'),
        allowNull: false,
        defaultValue: 'active',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.INTEGER.UNSIGNED,
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('drivers', ['status']);
    await queryInterface.addIndex('drivers', ['phone']);
    await queryInterface.addIndex('drivers', ['license_expiry']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('drivers');
  },
};
