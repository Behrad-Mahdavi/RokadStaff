const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  const pms = await sql`
    SELECT pm.id, p.name as project_name, e.full_name, e.role as emp_role, pm.role as project_role
    FROM project_members pm
    JOIN projects p ON pm.project_id = p.id
    JOIN employees e ON pm.employee_id = e.id;
  `;
  console.log("Current project members in DB:");
  console.table(pms);

  await sql.end();
}

main().catch(console.error);
