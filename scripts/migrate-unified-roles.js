const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  console.log("Starting unified roles database migration...");

  // 1. Add email column to employees if not exists
  await sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS email TEXT;`;
  console.log("✅ Column 'email' added/verified on employees table.");

  // 2. Check existing admins in admin_users and ensure they are in employees table
  const admins = await sql`SELECT id, email, full_name, role, assigned_department FROM admin_users;`;
  console.log(`Found ${admins.length} admin user(s) in admin_users table:`, admins.map(a => a.email));

  for (const admin of admins) {
    // Check if an employee with this email already exists
    const existingEmp = await sql`SELECT id, full_name, email, role FROM employees WHERE LOWER(email) = LOWER(${admin.email}) LIMIT 1;`;
    if (existingEmp.length === 0) {
      console.log(`Syncing admin ${admin.email} (${admin.full_name}) into employees table...`);
      const linkCode = Math.floor(100000 + Math.random() * 900000).toString();
      await sql`
        INSERT INTO employees (
          full_name,
          email,
          role,
          department,
          position,
          link_code,
          link_code_expires_at,
          is_active
        ) VALUES (
          ${admin.full_name || "مدیر ارشد"},
          ${admin.email.toLowerCase().trim()},
          ${admin.role || "admin"},
          ${admin.assigned_department || "مدیریت"},
          ${admin.role === "admin" ? "مدیر ارشد سازمان" : "سرپرست واحد"},
          ${linkCode},
          NOW() + INTERVAL '1 day',
          true
        );
      `;
      console.log(`✅ Admin ${admin.email} added to employees table.`);
    } else {
      // Update role and email if needed
      await sql`
        UPDATE employees
        SET role = ${admin.role},
            email = ${admin.email.toLowerCase().trim()},
            updated_at = NOW()
        WHERE id = ${existingEmp[0].id};
      `;
      console.log(`✅ Employee ${existingEmp[0].full_name} updated with role ${admin.role} and email.`);
    }
  }

  // Print all employees with their roles and emails
  const allEmps = await sql`SELECT id, full_name, department, position, role, email FROM employees ORDER BY created_at ASC;`;
  console.log("\nAll employees now:");
  console.table(allEmps);

  await sql.end();
  console.log("\nMigration completed successfully.");
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
