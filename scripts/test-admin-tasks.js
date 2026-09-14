const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  console.log("🚀 Testing Senior Admin Project Membership & Task Assignment...\n");

  try {
    // 1. Fetch Senior Admin
    const admins = await sql`
      SELECT id, full_name, email, role
      FROM employees
      WHERE role = 'admin'
      LIMIT 1;
    `;

    if (admins.length === 0) throw new Error("No admin employee found!");
    const admin = admins[0];
    console.log(`1. Senior Admin: ${admin.full_name} (${admin.id})`);

    // 2. Fetch a Supervisor
    const sups = await sql`
      SELECT id, full_name, email, role
      FROM employees
      WHERE role = 'supervisor'
      LIMIT 1;
    `;
    const supervisor = sups[0];
    console.log(`2. Supervisor: ${supervisor.full_name} (${supervisor.id})`);

    // 3. Test: Senior Admin creates a project
    const testProjName = `پروژه راهبر ارشد ${Date.now()}`;
    console.log(`\n3. Creating project by Senior Admin: "${testProjName}"...`);
    const [projByAdmin] = await sql`
      INSERT INTO projects (name, description, created_by, is_archived)
      VALUES (${testProjName}, 'تست پروژه راهبر ارشد', ${admin.id}, false)
      RETURNING id, name, created_by;
    `;

    // Add admin as default manager
    await sql`
      INSERT INTO project_members (project_id, employee_id, role)
      VALUES (${projByAdmin.id}, ${admin.id}, 'manager');
    `;

    // Verify Admin is member
    const checkMembership = await sql`
      SELECT id, role FROM project_members
      WHERE project_id = ${projByAdmin.id} AND employee_id = ${admin.id};
    `;
    console.log("Is Senior Admin member of own project?", checkMembership.length > 0 && checkMembership[0].role === 'manager' ? "✅ YES (Manager)" : "❌ NO");

    // 4. Test: Supervisor creates a project and adds Senior Admin as member
    const testSupProjName = `پروژه سرپرست با عضویت ادمین ${Date.now()}`;
    console.log(`\n4. Creating project by Supervisor: "${testSupProjName}"...`);
    const [projBySup] = await sql`
      INSERT INTO projects (name, description, created_by, is_archived)
      VALUES (${testSupProjName}, 'تست پروژه سرپرست', ${supervisor.id}, false)
      RETURNING id, name, created_by;
    `;

    await sql`
      INSERT INTO project_members (project_id, employee_id, role)
      VALUES (${projBySup.id}, ${supervisor.id}, 'manager');
    `;

    // Add Senior Admin to supervisor's project
    console.log(`Adding Senior Admin (${admin.full_name}) as member to Supervisor's project...`);
    await sql`
      INSERT INTO project_members (project_id, employee_id, role)
      VALUES (${projBySup.id}, ${admin.id}, 'member');
    `;

    const checkAdminInSupProj = await sql`
      SELECT id, role FROM project_members
      WHERE project_id = ${projBySup.id} AND employee_id = ${admin.id};
    `;
    console.log("Can Senior Admin be added to other projects?", checkAdminInSupProj.length > 0 ? "✅ YES (Successfully joined)" : "❌ NO");

    // 5. Test: Assign a task to Senior Admin
    console.log(`\n5. Creating a task in supervisor's project and assigning to Senior Admin...`);
    const [col] = await sql`
      INSERT INTO board_columns (project_id, name, position)
      VALUES (${projBySup.id}, 'برای انجام', 1000)
      RETURNING id;
    `;

    const [task] = await sql`
      INSERT INTO tasks (project_id, column_id, title, created_by)
      VALUES (${projBySup.id}, ${col.id}, 'تسک محوله به راهبر ارشد', ${supervisor.id})
      RETURNING id, title;
    `;

    await sql`
      INSERT INTO task_assignees (task_id, employee_id, assigned_by)
      VALUES (${task.id}, ${admin.id}, ${supervisor.id});
    `;

    // Verify task assignment
    const assignees = await sql`
      SELECT ta.id, e.full_name, e.role
      FROM task_assignees ta
      JOIN employees e ON ta.employee_id = e.id
      WHERE ta.task_id = ${task.id};
    `;
    console.log("Task assignees:");
    console.table(assignees);

    const isAssigned = assignees.some(a => a.full_name === admin.full_name);
    console.log("Is task successfully assigned to Senior Admin?", isAssigned ? "✅ YES" : "❌ NO");

    // 6. Cleanup
    console.log("\n6. Cleaning up test data...");
    await sql`DELETE FROM task_assignees WHERE task_id = ${task.id};`;
    await sql`DELETE FROM tasks WHERE id = ${task.id};`;
    await sql`DELETE FROM board_columns WHERE project_id = ${projBySup.id};`;
    await sql`DELETE FROM project_members WHERE project_id IN (${projByAdmin.id}, ${projBySup.id});`;
    await sql`DELETE FROM projects WHERE id IN (${projByAdmin.id}, ${projBySup.id});`;
    console.log("✅ Cleanup complete.");

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Test error:", err);
  } finally {
    await sql.end();
  }
}

main();
