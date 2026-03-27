'use strict';

const {DataTypes} = require("sequelize");
const {User} = require("../models");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

      await queryInterface.addColumn('tatickets', 'on_behalf_of', {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
              model: 'users',
              key: 'user_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
      });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('tatickets', 'on_behalf_of', {})
  }
};
