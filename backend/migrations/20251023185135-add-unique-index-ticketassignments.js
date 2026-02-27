'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('ticketassignments', ['ticket_id', 'user_id'], {
      name: 'ticket_user_unique',
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('ticketassignments', 'ticket_user_unique');
  }
};