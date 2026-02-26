'use strict';

const {DataTypes} = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('teams', 'grader_name', {
        type: DataTypes.STRING,
        allowNull: true,
    });
      await queryInterface.addColumn('teams', 'grader_email', {
          type: DataTypes.STRING,
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
    await queryInterface.removeColumn('teams', 'grader');
    await queryInterface.removeColumn('teams', 'grader_email');
  }
};
