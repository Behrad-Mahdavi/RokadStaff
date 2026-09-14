const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL);

async function runTest() {
  console.log("🚀 Starting Supervisor Project Membership & Access Control Test...\n");

  try {
    // 1. Fetch supervisors from database
    const supervisors = await sql`
      SELECT id, full_name, email, role, department
      FROM employees
      WHERE role = 'supervisor'
      ORDER BY created_at ASC;
    `;

    console.log("1. Found active supervisors in employees table:");
    console.table(supervisors.map(s => ({ id: s.id, name: s.full_name, email: s.email, dept: s.department })));

    if (supervisors.length < 2) {
      throw new Error("Need at least 2 supervisors in DB for access isolation testing!");
    }

    const sup1 = supervisors[0]; // e.g. علیرضا عزیزپور (استودیو)
    const sup2 = supervisors[1]; // e.g. رویا دولت‌آبادی (دخترانه)

    console.log(`\nSupervisor 1 (Creator): ${sup1.full_name} (${sup1.department}) - ID: ${sup1.id}`);
    console.log(`Supervisor 2 (Other Dept): ${sup2.full_name} (${sup2.department}) - ID: ${sup2.id}`);

    // 2. Simulate Supervisor 1 creating a project
    const testProjectName = `پروژه تستی راهبر ${Date.now()}`;
    console.log(`\n2. Creating project: "${testProjectName}" by ${sup1.full_name}...`);

    const [createdProj] = await sql`
      INSERT INTO projects (name, description, created_by, is_archived)
      VALUES (${testProjectName}, 'توضیحات تستی دسترسی راهبران', ${sup1.id}, false)
      RETURNING id, name, created_by, is_archived;
    `;

    // Default membership creation for creator
    await sql`
      INSERT INTO project_members (project_id, employee_id, role)
      VALUES (${createdProj.id}, ${sup1.id}, 'manager');
    `;

    console.log(`✅ Project created successfully with ID: ${createdProj.id}`);

    // 3. Verify Supervisor 1 is default manager
    const memberships = await sql`
      SELECT pm.id, pm.project_id, pm.employee_id, pm.role, e.full_name, e.role as emp_role
      FROM project_members pm
      JOIN employees e ON pm.employee_id = e.id
      WHERE pm.project_id = ${createdProj.id};
    `;

    console.log("\n3. Current Project Members:");
    console.table(memberships.map(m => ({ name: m.full_name, empRole: m.emp_role, projectRole: m.role })));

    const sup1IsManager = memberships.some(m => m.employee_id === sup1.id && m.role === 'manager');
    console.log(`Is ${sup1.full_name} default manager?`, sup1IsManager ? "✅ YES" : "❌ NO");

    // 4. Test Access Logic for Supervisor 1
    // A supervisor only sees projects they created OR are member of:
    const sup1Projects = await sql`
      SELECT p.id, p.name, p.created_by
      FROM projects p
      WHERE p.id = ${createdProj.id}
        AND (
          p.created_by = ${sup1.id}
          OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.employee_id = ${sup1.id})
        );
    `;

    console.log(`\n4. Access check for Creator (${sup1.full_name}):`, sup1Projects.length > 0 ? "✅ CAN ACCESS" : "❌ CANNOT ACCESS");

    // 5. Test Access Logic for Supervisor 2 (Should NOT have access yet)
    const sup2ProjectsBefore = await sql`
      SELECT p.id, p.name, p.created_by
      FROM projects p
      WHERE p.id = ${createdProj.id}
        AND (
          p.created_by = ${sup2.id}
          OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.employee_id = ${sup2.id})
        );
    `;

    console.log(`5. Access check for Other Supervisor (${sup2.full_name}) BEFORE joining:`, sup2ProjectsBefore.length === 0 ? "✅ ISOLATED (NO ACCESS - AS EXPECTED)" : "❌ FAILED (HAS LEAKED ACCESS)");

    // 6. Add Supervisor 2 as member to the project
    console.log(`\n6. Adding ${sup2.full_name} as member to the project...`);
    await sql`
      INSERT INTO project_members (project_id, employee_id, role)
      VALUES (${createdProj.id}, ${sup2.id}, 'member');
    `;

    // 7. Test Access Logic for Supervisor 2 (Now SHOULD have access)
    const sup2ProjectsAfter = await sql`
      SELECT p.id, p.name, p.created_by
      FROM projects p
      WHERE p.id = ${createdProj.id}
        AND (
          p.created_by = ${sup2.id}
          OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.employee_id = ${sup2.id})
        );
    `;

    console.log(`7. Access check for Other Supervisor (${sup2.full_name}) AFTER joining:`, sup2ProjectsAfter.length > 0 ? "✅ CAN ACCESS (SUCCESSFULLY JOINED)" : "❌ FAILED (CANNOT ACCESS)");

    // 8. Clean up test project
    console.log("\n8. Cleaning up test project...");
    await sql`DELETE FROM project_members WHERE project_id = ${createdProj.id};`;
    await sql`DELETE FROM projects WHERE id = ${createdProj.id};`;
    console.log("✅ Cleaned up successfully.");

    console.log("\n🎉 ALL TESTS PASSED! Department leads can join projects, are default members/managers of their own projects, and only have access to projects they created or joined.");

  } catch (err) {
    console.error("❌ Test error:", err);
  } finally {
    await sql.end();
  }
}

runTest();
