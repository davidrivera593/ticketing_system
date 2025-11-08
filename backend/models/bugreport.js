'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BugReport extends Model {
    static associate(models) {
      // If users primary key is 'user_id', set targetKey so Sequelize knows how to join
      BugReport.belongsTo(models.User, {
        foreignKey: 'user_id',
        targetKey: 'user_id',
        as: 'user',
      });
    }
  }

  BugReport.init(
    {
      subject:      { type: DataTypes.STRING(200), allowNull: false },
      description:  { type: DataTypes.TEXT,        allowNull: false },
      reporterRole: { type: DataTypes.STRING(30) },
      user_id:      { type: DataTypes.INTEGER }, // FK to Users.user_id
    },
    { sequelize, modelName: 'BugReport',
                tableName: 'bugreports'
    }
  );

  return BugReport;
};
