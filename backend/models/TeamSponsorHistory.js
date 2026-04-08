const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const TeamSponsorHistory = sequelize.define(
  "TeamSponsorHistory",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    changed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    old_sponsor_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    new_sponsor_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    old_sponsor_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    new_sponsor_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    changed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "team_sponsor_history",
    timestamps: false,
    underscored: true,
  }
);

module.exports = TeamSponsorHistory;
