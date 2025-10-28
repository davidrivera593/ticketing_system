'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BugReports', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },

      subject:      { type: Sequelize.STRING(200), allowNull: false },
      description:  { type: Sequelize.TEXT,        allowNull: false },
      reporterRole: { type: Sequelize.STRING(30),  allowNull: true },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,               //Dont let anyone submit a bug without a user_id
        references: { model: 'users', key: 'user_id' }, 
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('BugReports', ['user_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('BugReports', ['user_id']);
    await queryInterface.dropTable('BugReports');
  }
};
