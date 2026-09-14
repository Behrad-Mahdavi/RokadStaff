const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  console.log("Syncing Senior Admin to projects...");

  // 1. Find Senior Admin in employees
  const admins = await sql`
    SELECT id, full_name, email, role, department
    FROM employees
    WHERE role = 'admin'
    LIMIT 1;
  `;

  if (admins.length === 0) {
    throw new Error("No employee with role 'admin' found in employees table!");
  }

  const admin = admins[0];
  console.log(`Senior Admin: ${admin.full_name} (${admin.email}) - ID: ${admin.id}`);

  // 2. Fetch all projects
  const allProjects = await sql`SELECT id, name FROM projects;`;
  console.log(`Found ${allProjects.length} projects in DB.`);

  for (const proj of allProjects) {
    const existing = await sql`
      SELECT id, role FROM project_members
      WHERE project_id = ${proj.id} AND employee_id = ${admin.id};
    `;

    if (existing.length === 0) {
      await sql`
        INSERT INTO project_members (project_id, employee_id, role)
        VALUES (${proj.id}, ${admin.id}, 'manager');
      `;
      console.log(`✅ Added ${admin.full_name} as manager to project: "${proj.name}"`);
    } else {
      console.log(`ℹ️ ${admin.full_name} is already a member of project: "${proj.name}"`);
    }
  }

  // Verify
  const memberships = await sql`
    SELECT p.name, e.full_name, pm.role
    FROM project_members pm
    JOIN projects p ON pm.project_id = p.id
    JOIN employees e ON pm.employee_id = e.id
    WHERE e.id = ${admin.id};
  `;

  console.log("\nSenior Admin memberships now:");
  console.table(memberships);

  await sql.end();
  console.log("Done.");
}

main().catch(console.error);
