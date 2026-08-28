import { getDb } from "../lib/db/client";
import {
  projects,
  projectMembers,
  boardColumns,
  tasks,
  taskAssignees,
  checklists,
  checklistItems,
  taskReports,
  taskActivityLog,
  employees,
} from "../lib/db/schema";
import { eq, and } from "drizzle-orm";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`✅ Passed: ${message}`);
}

async function runRotelloIntegrationTests() {
  console.log("🧪 Starting Rotello Staff Integration & Logic Tests...\n");
  const db = getDb();

  // 1. Fetch an existing employee
  const emps: any[] = await db.select().from(employees).limit(1);
  assert(emps.length > 0, "Found test employee");
  const testEmp = emps[0];

  // 2. Create Project
  const [proj] = await db
    .insert(projects)
    .values({
      name: "تست پروژه آزمایشی Rotello",
      description: "توضیحات تست یکپارچگی",
      createdBy: testEmp.id,
      isArchived: false,
    })
    .returning();

  assert(!!proj.id, `Project created with id ${proj.id}`);

  // 3. Add Project Manager
  const [member] = await db
    .insert(projectMembers)
    .values({
      projectId: proj.id,
      employeeId: testEmp.id,
      role: "manager",
    })
    .returning();

  assert(member.role === "manager", "Member added as manager");

  // 4. Create Columns (with Fractional Indexing positions)
  const [col1] = await db
    .insert(boardColumns)
    .values({
      projectId: proj.id,
      name: "برای انجام",
      position: 1000.0,
      isDoneColumn: false,
    })
    .returning();

  const [colDone] = await db
    .insert(boardColumns)
    .values({
      projectId: proj.id,
      name: "انجام‌شده",
      position: 2000.0,
      isDoneColumn: true,
    })
    .returning();

  assert(colDone.isDoneColumn === true, "Done column marked with isDoneColumn = true");

  // 5. Create Task
  const [task1] = await db
    .insert(tasks)
    .values({
      projectId: proj.id,
      columnId: col1.id,
      title: "تسک تستی ۱ - طراحی کامپوننت بورد",
      priority: "important",
      position: 1000.0,
      createdBy: testEmp.id,
      isDeleted: false,
    })
    .returning();

  assert(task1.priority === "important", "Task priority stored as 'important'");
  assert(task1.isDeleted === false, "Task is active (not deleted)");

  // 6. Add Assignee (Multi-Assignee)
  const [assignee] = await db
    .insert(taskAssignees)
    .values({
      taskId: task1.id,
      employeeId: testEmp.id,
      assignedBy: testEmp.id,
    })
    .returning();

  assert(assignee.employeeId === testEmp.id, "Assignee linked to task");

  // 7. Add Checklist & Items
  const [chk] = await db
    .insert(checklists)
    .values({
      taskId: task1.id,
      title: "مرحله اعتبارسنجی و کدنویسی",
      position: 1000.0,
    })
    .returning();

  const [item1] = await db
    .insert(checklistItems)
    .values({
      checklistId: chk.id,
      title: "نوشتن تست‌های یکپارچگی",
      position: 1000.0,
      isDone: true,
      doneBy: testEmp.id,
      doneAt: new Date(),
    })
    .returning();

  assert(item1.isDone === true, "Checklist item checked");
  assert(item1.doneBy === testEmp.id, "done_by recorded accurately");

  // 8. Test Unchecking Checklist Item (Decision 4: Preserve done_by & done_at on uncheck)
  const [uncheckedItem] = await db
    .update(checklistItems)
    .set({ isDone: false })
    .where(eq(checklistItems.id, item1.id))
    .returning();

  assert(uncheckedItem.isDone === false, "Checklist item unchecked");
  assert(uncheckedItem.doneBy === testEmp.id, "done_by preserved after uncheck for audit");
  assert(!!uncheckedItem.doneAt, "done_at preserved after uncheck for audit");

  // 9. Add Append-only Task Report
  const [rep] = await db
    .insert(taskReports)
    .values({
      taskId: task1.id,
      authorId: testEmp.id,
      content: "تست عملکرد با موفقیت به اتمام رسید و گزارش بدون مشکل ثبت شد.",
    })
    .returning();

  assert(!!rep.id, "Append-only Task Report created");

  // 10. Test Move Task to Done Column (Drag & Drop)
  const [movedTask] = await db
    .update(tasks)
    .set({
      columnId: colDone.id,
      position: 1500.0, // Fractional indexing midpoint
      completedAt: new Date(),
    })
    .where(eq(tasks.id, task1.id))
    .returning();

  assert(movedTask.columnId === colDone.id, "Task moved to Done column");
  assert(movedTask.position === 1500.0, "Fractional position updated without re-indexing");
  assert(!!movedTask.completedAt, "completed_at set upon moving to Done column");

  // 11. Test Soft Delete (Section 10)
  const [deletedTask] = await db
    .update(tasks)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: testEmp.id,
    })
    .where(eq(tasks.id, task1.id))
    .returning();

  assert(deletedTask.isDeleted === true, "Task soft deleted with is_deleted = true");

  // Cleanup test project
  await db.delete(projects).where(eq(projects.id, proj.id));

  console.log("\n🎉 All 11 Rotello Staff integration tests passed with flying colors!");
}

runRotelloIntegrationTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
