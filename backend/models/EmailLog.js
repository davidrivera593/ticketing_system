const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const EmailLog = sequelize.define(
  "EmailLog",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    recipient: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("success", "failed"),
      allowNull: false,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    email_type: {
      type: DataTypes.ENUM(
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
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "email_logs",
    timestamps: false,
    underscored: true,
  }
);

module.exports = EmailLog;
