"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'developer';
    `);
  },

  down: async () => {
    // Postgres enums do not support dropping a single value safely in-place.
    // This migration is intentionally irreversible.
  },
};
