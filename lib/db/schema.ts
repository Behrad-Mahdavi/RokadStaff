import {
  pgTable,
  uuid,
  text,
  bigint,
  varchar,
  timestamp,
  boolean,
  date,
  integer,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Employees Table
export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    department: text("department"),
    position: text("position"),
    telegramChatId: bigint("telegram_chat_id", { mode: "bigint" }).unique(),
    linkCode: varchar("link_code", { length: 6 }),
    linkCodeExpiresAt: timestamp("link_code_expires_at", { withTimezone: true }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    telegramChatIdIdx: index("idx_employees_telegram_chat_id").on(table.telegramChatId),
  })
);

// 2. Daily Reports Table
export const dailyReports = pgTable(
  "daily_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    reportDate: date("report_date").notNull(),
    rawText: text("raw_text").notNull(),
    status: text("status").default("on_time").notNull(), // 'on_time' | 'late'
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
    editedCount: integer("edited_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    employeeDateUnique: unique("uniq_employee_date").on(table.employeeId, table.reportDate),
    employeeDateIdx: index("idx_daily_reports_employee_date").on(table.employeeId, table.reportDate),
  })
);

// 3. Report Items Table (Checklist items per report)
export const reportItems = pgTable(
  "report_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => dailyReports.id, { onDelete: "cascade" }),
    taskOrder: integer("task_order").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull(), // 'done' | 'incomplete' | 'cancelled'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    reportIdIdx: index("idx_report_items_report_id").on(table.reportId),
  })
);

// 4. Report History (Audit Trail for overwritten reports)
export const reportHistory = pgTable("report_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  originalReportId: uuid("original_report_id").notNull(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  rawText: text("raw_text").notNull(),
  replacedAt: timestamp("replaced_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. Admin Users Table
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").default("مدیر سیستم"),
  role: text("role").default("admin").notNull(), // 'admin' | 'supervisor'
  assignedDepartment: text("assigned_department"), // For supervisors in Phase 2
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. Bot Message Log (Raw incoming telegram updates for observability)
export const botMessageLog = pgTable("bot_message_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  telegramChatId: bigint("telegram_chat_id", { mode: "bigint" }),
  rawUpdate: jsonb("raw_update").notNull(),
  processedOk: boolean("processed_ok"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 7. Daily Stats Table (Pre-Aggregation for fast reporting & analytics)
export const dailyStats = pgTable(
  "daily_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    statDate: date("stat_date").notNull(),
    department: text("department"), // NULL = All organization
    activeEmployees: integer("active_employees").notNull(),
    submittedCount: integer("submitted_count").notNull(),
    onTimeCount: integer("on_time_count").notNull(),
    lateCount: integer("late_count").notNull(),
    totalTaskItems: integer("total_task_items").notNull(),
    doneTaskItems: integer("done_task_items").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statDateDeptUnique: unique("uniq_stat_date_dept").on(table.statDate, table.department),
    statDateIdx: index("idx_daily_stats_date").on(table.statDate),
  })
);

// Relations
export const employeesRelations = relations(employees, ({ many }) => ({
  reports: many(dailyReports),
  history: many(reportHistory),
}));

export const dailyReportsRelations = relations(dailyReports, ({ one, many }) => ({
  employee: one(employees, {
    fields: [dailyReports.employeeId],
    references: [employees.id],
  }),
  items: many(reportItems),
}));

export const reportItemsRelations = relations(reportItems, ({ one }) => ({
  report: one(dailyReports, {
    fields: [reportItems.reportId],
    references: [dailyReports.id],
  }),
}));

export const reportHistoryRelations = relations(reportHistory, ({ one }) => ({
  employee: one(employees, {
    fields: [reportHistory.employeeId],
    references: [employees.id],
  }),
}));

// Export Types
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type DailyReport = typeof dailyReports.$inferSelect;
export type NewDailyReport = typeof dailyReports.$inferInsert;
export type ReportItem = typeof reportItems.$inferSelect;
export type NewReportItem = typeof reportItems.$inferInsert;
export type ReportHistory = typeof reportHistory.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type BotMessageLog = typeof botMessageLog.$inferSelect;
export type DailyStat = typeof dailyStats.$inferSelect;
export type NewDailyStat = typeof dailyStats.$inferInsert;
