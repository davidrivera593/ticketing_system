'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('team_sponsor_history', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        team_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'teams',
            key: 'team_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        changed_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'user_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        old_sponsor_name: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        new_sponsor_name: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        old_sponsor_email: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        new_sponsor_email: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        changed_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      }, { transaction: t });

      await queryInterface.addIndex('team_sponsor_history', ['team_id'], {
        name: 'team_sponsor_history_team_id_idx',
        transaction: t,
      });

      await queryInterface.addIndex('team_sponsor_history', ['changed_at'], {
        name: 'team_sponsor_history_changed_at_idx',
        transaction: t,
      });

      // Backfill: insert one initial record per existing team that has sponsor data,
      // representing the known state at the time this feature was introduced.
      await queryInterface.sequelize.query(
        `INSERT INTO team_sponsor_history (team_id, changed_by, old_sponsor_name, new_sponsor_name, old_sponsor_email, new_sponsor_email, changed_at)
         SELECT team_id, NULL, NULL, sponsor_name, NULL, sponsor_email, NOW()
         FROM teams
         WHERE sponsor_name IS NOT NULL OR sponsor_email IS NOT NULL`,
        { transaction: t }
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('team_sponsor_history');
  },
};
