const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const TaCommunication = sequelize.define("TaCommunication", {
    communication_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
},{
    tableName: 'taticketcommunications', // Ensure the table name is lowercase
    timestamps: false,
});

TaCommunication.belongsTo(User, {
    foreignKey: "user_id",
});

module.exports = TaCommunication;