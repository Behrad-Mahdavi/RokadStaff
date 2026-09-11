const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function initDepartments() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not defined in environment variables.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    console.log("Connecting to PostgreSQL...");
    // 1. Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Table 'departments' verified/created.");

    // 2. Create index if not exists
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
    `);
    console.log("Index 'idx_departments_name' verified/created.");

    // 3. Insert default departments
    await pool.query(`
      INSERT INTO departments (name, description)
      VALUES 
        ('پسرانه', 'دپارتمان شعبه پسرانه'),
        ('دخترانه', 'دپارتمان شعبه دخترانه')
      ON CONFLICT (name) DO NOTHING;
    `);

    // 4. Insert any distinct departments from existing employees
    await pool.query(`
      INSERT INTO departments (name)
      SELECT DISTINCT department FROM employees
      WHERE department IS NOT NULL AND TRIM(department) <> ''
      ON CONFLICT (name) DO NOTHING;
    `);

    const res = await pool.query(`SELECT id, name, description, created_at FROM departments ORDER BY created_at ASC;`);
    console.log("Current departments in database:");
    console.table(res.rows);

    console.log("Departments initialization completed successfully.");
  } catch (err) {
    console.error("Error initializing departments:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDepartments();
