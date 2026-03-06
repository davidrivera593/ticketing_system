'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('tickets', 'escalated_by', {
        type: Sequelize.STRING,
        allowNull: true,
    });

      await queryInterface.addColumn('tatickets', 'escalated_by', {
          type: Sequelize.STRING,
          allowNull: true,
      });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('tickets', 'escalated_by');
    await queryInterface.removeColumn('tatickets', 'escalated_by');

  }
};
