import { getDb } from "../lib/db/client";
import {
  employees,
  projects,
  tasks,
  dailyReports,
  boardColumns,
  adminUsers,
  taskAssignees
} from "../lib/db/schema";
import { count, eq, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function runPreflight() {
  console.log("🔍 === PRE-PRESENTATION AUDIT & HEALTH CHECK ===");
  console.log("BASE_URL / APP_URL:", process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL);

  const db = getDb();

  // 1. Database Table Counts
  const [empCount] = await db.select({ val: count() }).from(employees);
  const [projCount] = await db.select({ val: count() }).from(projects);
  const [taskCount] = await db.select({ val: count() }).from(tasks);
  const [reportCount] = await db.select({ val: count() }).from(dailyReports);
  const [colCount] = await db.select({ val: count() }).from(boardColumns);
  const [adminCount] = await db.select({ val: count() }).from(adminUsers);
  const [assigneeCount] = await db.select({ val: count() }).from(taskAssignees);

  // Individual Tasks (tasks with projectId IS NULL)
  const [individualTasksCount] = await db
    .select({ val: count() })
    .from(tasks)
    .where(isNull(tasks.projectId));

  console.log("\n📊 --- DATABASE STATS ---");
  console.log(`Employees: ${empCount.val}`);
  console.log(`Admin Users: ${adminCount.val}`);
  console.log(`Projects: ${projCount.val}`);
  console.log(`Board Columns: ${colCount.val}`);
  console.log(`Total Tasks: ${taskCount.val}`);
  console.log(`- Project Tasks: ${Number(taskCount.val) - Number(individualTasksCount.val)}`);
  console.log(`- Individual / Standalone Tasks: ${individualTasksCount.val}`);
  console.log(`Task Assignees: ${assigneeCount.val}`);
  console.log(`Daily Reports: ${reportCount.val}`);

  // 2. Admin Users Authentication Check
  console.log("\n🔐 --- ADMIN USERS AUTH CHECK ---");
  const admins = await db.select().from(adminUsers);
  if (admins.length === 0) {
    console.error("⚠️ WARNING: No admin users found in admin_users table!");
  } else {
    for (const a of admins) {
      const match123456 = await bcrypt.compare("Admin@123456", a.passwordHash).catch(() => false);
      const matchPlain = await bcrypt.compare("admin123456", a.passwordHash).catch(() => false);
      console.log(`Admin: ${a.email} | Name: ${a.fullName} | Role: ${a.role} | Valid password exists: ${match123456 || matchPlain}`);
    }
  }

  // 3. Employees details
  console.log("\n👤 --- EMPLOYEES CHECK ---");
  const staff: any[] = await db.select().from(employees);
  console.log(`Total staff in DB: ${staff.length}`);
  staff.forEach((s: any) => {
    console.log(`  - [${s.id}] ${s.fullName} | Dept: ${s.department} | Pos: ${s.position} | Active: ${s.isActive} | Linked Telegram: ${!!s.telegramChatId}`);
  });

  // 4. Projects Status & Entry Columns
  console.log("\n📁 --- PROJECTS & ENTRY COLUMNS ---");
  const projectList: any[] = await db.select().from(projects);
  for (const p of projectList) {
    const cols: any[] = await db.select().from(boardColumns).where(eq(boardColumns.projectId, p.id));
    const entryCol = cols.find((c: any) => c.isEntryColumn);
    console.log(`  - Project: "${p.name}" (Archived: ${p.isArchived}) | Columns: ${cols.length} | Entry Column: ${entryCol ? entryCol.name : 'None (will fallback)'}`);
  }

  // 5. Telegram Bot Webhook Check
  console.log("\n🤖 --- TELEGRAM BOT WEBHOOK ---");
  if (process.env.TELEGRAM_BOT_TOKEN) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
      const info = await res.json();
      console.log(`Webhook URL: ${info.result?.url}`);
      console.log(`Pending Updates: ${info.result?.pending_update_count}`);
      console.log(`Last Error: ${info.result?.last_error_message || 'None'}`);
    } catch (e: any) {
      console.error("Telegram check error:", e.message);
    }
  } else {
    console.warn("TELEGRAM_BOT_TOKEN not found in env.");
  }

  console.log("\n✨ Pre-flight check completed!");
}

runPreflight()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Pre-flight audit failed:", err);
    process.exit(1);
  });
