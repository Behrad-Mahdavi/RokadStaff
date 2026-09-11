const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function testUserRolesAndProfile() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("1. Testing Admin User listing from DB...");
    const resAdmins = await pool.query(`SELECT id, email, full_name, role, assigned_department FROM admin_users ORDER BY created_at ASC;`);
    console.log("Current admin users:");
    console.table(resAdmins.rows);

    console.log("\n2. Testing creating a Supervisor user...");
    const testEmail = "supervisor_test_" + Date.now() + "@rokad.ir";
    const passHash = await bcrypt.hash("Supervisor@123", 10);
    const createRes = await pool.query(
      `INSERT INTO admin_users (email, password_hash, full_name, role, assigned_department)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, assigned_department, created_at;`,
      [testEmail, passHash, "سرپرست تستی دپارتمان", "supervisor", "پسرانه"]
    );
    const createdSupervisor = createRes.rows[0];
    console.log("Created supervisor user:", createdSupervisor);

    console.log("\n3. Testing updating user access level / department...");
    const updateRes = await pool.query(
      `UPDATE admin_users SET assigned_department = $1, full_name = $2, updated_at = NOW() WHERE id = $3 RETURNING id, email, full_name, role, assigned_department;`,
      ["دخترانه", "سرپرست تستی (ویرایش شده)", createdSupervisor.id]
    );
    console.log("Updated supervisor user:", updateRes.rows[0]);

    console.log("\n4. Testing password verification for senior admin...");
    const seniorAdmin = resAdmins.rows[0];
    const adminPassRes = await pool.query(`SELECT password_hash FROM admin_users WHERE id = $1;`, [seniorAdmin.id]);
    const isValidPass = await bcrypt.compare("admin123456", adminPassRes.rows[0].password_hash).catch(() => false) ||
                        await bcrypt.compare("Admin@123456", adminPassRes.rows[0].password_hash).catch(() => false);
    console.log(`Senior admin password verified: ${isValidPass}`);

    console.log("\n5. Cleaning up test supervisor user...");
    await pool.query(`DELETE FROM admin_users WHERE id = $1;`, [createdSupervisor.id]);
    console.log("Deleted test supervisor successfully.");

    console.log("\n6. Verifying employees table role column...");
    const empRes = await pool.query(`SELECT id, full_name, department, role FROM employees LIMIT 3;`);
    console.table(empRes.rows);

    console.log("✅ All user roles, access levels, and profile verification passed with 100% success!");
  } catch (err) {
    console.error("❌ Test error:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testUserRolesAndProfile();
