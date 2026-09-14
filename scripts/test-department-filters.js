const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL);

async function test() {
  console.log("🚀 Testing Department Filters in Daily Reports & Analytics...\n");

  // 1. Check departments table vs distinct departments in employees
  const dbDepts = await sql`SELECT name FROM departments ORDER BY created_at ASC;`;
  console.log("1. Departments in DB:", dbDepts.map(d => d.name));

  const empDepts = await sql`SELECT DISTINCT department FROM employees WHERE is_active = true;`;
  console.log("   Active Employee Departments:", empDepts.map(d => d.department));

  // 2. Check reports by department
  const studioReports = await sql`
    SELECT dr.id, dr.report_date, e.full_name, e.department
    FROM daily_reports dr
    JOIN employees e ON dr.employee_id = e.id
    WHERE e.department = 'استودیو'
    LIMIT 5;
  `;
  console.log(`\n2. Reports in 'استودیو': ${studioReports.length} found`);
  if (studioReports.length > 0) {
    console.log(`   Sample: ${studioReports[0].full_name} (${studioReports[0].department})`);
  }

  const girlsReports = await sql`
    SELECT dr.id, dr.report_date, e.full_name, e.department
    FROM daily_reports dr
    JOIN employees e ON dr.employee_id = e.id
    WHERE e.department = 'هنرستان دخترانه'
    LIMIT 5;
  `;
  console.log(`\n3. Reports in 'هنرستان دخترانه': ${girlsReports.length} found`);
  if (girlsReports.length > 0) {
    console.log(`   Sample: ${girlsReports[0].full_name} (${girlsReports[0].department})`);
  }

  // 4. Check daily_stats for departments
  const statsByDept = await sql`
    SELECT DISTINCT department FROM daily_stats WHERE department IS NOT NULL;
  `;
  console.log("\n4. Departments in daily_stats:", statsByDept.map(s => s.department));

  console.log("\n✅ Database and filter verification queries completed successfully!");
  await sql.end();
}

test().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
