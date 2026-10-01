'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('trips', 'approval_status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: true,
      defaultValue: null,
      after: 'completed_at',
    });

    await queryInterface.addColumn('trips', 'approved_by', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      after: 'approval_status',
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('trips', 'approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'approved_by',
    });

    await queryInterface.addColumn('trips', 'rejection_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'approved_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('trips', 'rejection_reason');
    await queryInterface.removeColumn('trips', 'approved_at');
    await queryInterface.removeColumn('trips', 'approved_by');
    await queryInterface.removeColumn('trips', 'approval_status');
  },
};
