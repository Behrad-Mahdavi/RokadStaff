const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function initUserRoles() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    console.log("Connecting to PostgreSQL...");

    // 1. Add role column to employees if not exists
    await pool.query(`
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'employee';
    `);
    console.log("✅ Column 'role' verified on employees table.");

    // 2. Add updated_at column to admin_users if not exists
    await pool.query(`
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);
    console.log("✅ Column 'updated_at' verified on admin_users table.");

    // Check admin_users count and display
    const resAdmins = await pool.query(`SELECT id, email, full_name, role, assigned_department FROM admin_users;`);
    console.log("Current admin users:");
    console.table(resAdmins.rows);

    console.log("User roles database migration completed successfully.");
  } catch (err) {
    console.error("Error migrating user roles:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initUserRoles();
