const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  const emps = await sql`SELECT id, full_name, email, role, department FROM employees ORDER BY created_at ASC;`;
  console.log("All Employees:");
  console.table(emps);

  const admins = await sql`SELECT id, email, full_name, role FROM admin_users;`;
  console.log("All Admin Users:");
  console.table(admins);

  const projs = await sql`SELECT id, name, created_by FROM projects;`;
  console.log("Projects in DB:");
  console.table(projs);

  await sql.end();
}

main().catch(console.error);
