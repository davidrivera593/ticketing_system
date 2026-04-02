const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = require("./User"); // Import User model

const TaTicket = sequelize.define(
    "taTicket",
    {
        ticket_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        ta_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users", // Ensure it references the correct table
                key: "user_id",
            },
        },
        issue_description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        issue_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("new", "ongoing", "resolved"),
            defaultValue: "new",
        },
        escalated: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        escalated_by: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        on_behalf_of: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'user_id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
        }
        // asu_id: {
        //   type: DataTypes.STRING(10),
        //   allowNull: false,
        //   validate:{
        //     len:[10,10],
        //     isNumeric: true,
        //   },
        // },
    },
    {
        tableName: "tatickets",
        //Need to update ticket everytime it is edited
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

// Define Association
TaTicket.belongsTo(User, { foreignKey: "ta_id", as: "TA" });
TaTicket.belongsTo(User, { as: 'student', foreignKey: 'on_behalf_of', targetKey: 'user_id'});

module.exports = TaTicket;

