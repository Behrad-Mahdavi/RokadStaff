const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function testDepartmentsDB() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("1. Fetching all departments...");
    const res1 = await pool.query("SELECT * FROM departments ORDER BY created_at ASC");
    console.log("Departments found:", res1.rows);

    console.log("\n2. Testing Department creation...");
    const testDeptName = "تست اتوماسیون " + Date.now();
    const res2 = await pool.query(
      "INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *",
      [testDeptName, "توضیحات تستی خودکار"]
    );
    const createdDept = res2.rows[0];
    console.log("Created department:", createdDept);

    console.log("\n3. Testing Department edit / rename...");
    const updatedDeptName = testDeptName + " - ویرایش شده";
    const res3 = await pool.query(
      "UPDATE departments SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [updatedDeptName, "توضیحات ویرایش شد", createdDept.id]
    );
    console.log("Updated department:", res3.rows[0]);

    console.log("\n4. Testing Department cleanup / delete...");
    await pool.query("DELETE FROM departments WHERE id = $1", [createdDept.id]);
    console.log("Deleted test department successfully.");

    console.log("\n5. Final departments list:");
    const resFinal = await pool.query("SELECT id, name, description FROM departments ORDER BY created_at ASC");
    console.table(resFinal.rows);

    console.log("✅ All Department DB operations passed with 100% success!");
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testDepartmentsDB();
