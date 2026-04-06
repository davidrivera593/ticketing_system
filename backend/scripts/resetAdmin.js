const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function resetAdmin() {
  try {
    const email = "admin1@asu.edu";
    const password = "password";
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await pool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      await pool.query(
        `
        UPDATE users
        SET role = 'admin',
            password = $1,
            is_enabled = true
        WHERE email = $2
        `,
        [hashedPassword, email]
      );
      console.log("Existing admin updated successfully.");
    } else {
      await pool.query(
        `
        INSERT INTO users (name, email, role, password, is_enabled)
        VALUES ($1, $2, $3, $4, $5)
        `,
        ["Admin User", email, "admin", hashedPassword, true]
      );
      console.log("Admin user created successfully.");
    }
  } catch (error) {
    console.error("Error resetting admin:", error);
  } finally {
    await pool.end();
  }
}

resetAdmin();