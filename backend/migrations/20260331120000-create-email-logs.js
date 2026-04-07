"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("email_logs", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      recipient: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("success", "failed"),
        allowNull: false,
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      email_type: {
        type: Sequelize.ENUM(
          "ticket_status_change",
          "ticket_escalation",
          "ta_ticket_status_change",
          "ta_ticket_escalation",
          "password_reset",
          "welcome",
          "manual"
        ),
        allowNull: false,
      },
      ticket_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      sent_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("email_logs", ["recipient"]);
    await queryInterface.addIndex("email_logs", ["email_type"]);
    await queryInterface.addIndex("email_logs", ["status"]);
    await queryInterface.addIndex("email_logs", ["sent_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("email_logs");
  },
};
