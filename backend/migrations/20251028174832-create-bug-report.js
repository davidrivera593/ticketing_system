'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bugreports', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },

      subject:     { type: Sequelize.STRING(200), allowNull: false },
      description: { type: Sequelize.TEXT,        allowNull: false },

      // keep it simple (string) so we don’t need a custom ENUM type lifecycle
      severity:    { type: Sequelize.STRING(16),  allowNull: false, defaultValue: 'low' },
      status:      { type: Sequelize.STRING(16),  allowNull: false, defaultValue: 'open' },

      // who reported it — allow null if you want anonymous curl tests to work;
      // set allowNull: false + onDelete: 'RESTRICT' if you want to enforce auth
      reporter_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'user_id' },   
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('bugreports', ['reporter_id']);
    await queryInterface.addIndex('bugreports', ['createdAt']);
    await queryInterface.addIndex('bugreports', ['severity']);
    await queryInterface.addIndex('bugreports', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('bugreports', ['status']);
    await queryInterface.removeIndex('bugreports', ['severity']);
    await queryInterface.removeIndex('bugreports', ['createdAt']);
    await queryInterface.removeIndex('bugreports', ['reporter_id']);
    await queryInterface.dropTable('bugreports');
  }
};
