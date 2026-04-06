const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const StudentData = sequelize.define("StudentData", {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'users', key: 'user_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    team_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'teams', key: 'team_id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    },
    section: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    semester: {
    type: DataTypes.STRING,
    allowNull: true,
},
    acct_creation: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },

    },{
    tableName: 'studentdata', // Ensure the table name is lowercase
    timestamps: false,
});

module.exports = StudentData;