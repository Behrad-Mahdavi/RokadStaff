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
  doublePrecision,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// 1. Core Platform & Identity
// ==========================================

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    department: text("department"), // "پسرانه" | "دخترانه"
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

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").default("مدیر سیستم"),
  role: text("role").default("admin").notNull(), // 'admin' | 'supervisor'
  assignedDepartment: text("assigned_department"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// One-time Magic Link Tokens for Employee Web Login (Rotello)
export const loginTokens = pgTable(
  "login_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    token: text("token").unique().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: index("idx_login_tokens_token").on(table.token),
  })
);

// ==========================================
// 2. Daily Self-Reporting Module (Rokad Staff)
// ==========================================

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

export const reportItems = pgTable(
  "report_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => dailyReports.id, { onDelete: "cascade" }),
    taskOrder: integer("task_order").notNull(),
    description: text("description").notNull(),
    status: text("status").default("submitted").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    reportIdIdx: index("idx_report_items_report_id").on(table.reportId),
  })
);

export const reportHistory = pgTable("report_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  originalReportId: uuid("original_report_id").notNull(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  rawText: text("raw_text").notNull(),
  replacedAt: timestamp("replaced_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dailyStats = pgTable(
  "daily_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    statDate: date("stat_date").notNull(),
    department: text("department"),
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

export const botMessageLog = pgTable("bot_message_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  telegramChatId: bigint("telegram_chat_id", { mode: "bigint" }),
  rawUpdate: jsonb("raw_update").notNull(),
  processedOk: boolean("processed_ok"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 3. Project & Task Management (Rotello Staff)
// ==========================================

// Projects (Boards)
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => employees.id),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    isArchivedIdx: index("idx_projects_archived").on(table.isArchived),
  })
);

// Per-Project Members & Roles ('manager' | 'member')
export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(), // 'manager' | 'member'
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectEmployeeUnique: unique("uniq_project_employee").on(table.projectId, table.employeeId),
    employeeIdx: index("idx_project_members_employee").on(table.employeeId),
  })
);

// Kanban Columns
export const boardColumns = pgTable(
  "board_columns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: doublePrecision("position").notNull(),
    isDoneColumn: boolean("is_done_column").default(false).notNull(),
    isEntryColumn: boolean("is_entry_column").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectPosIdx: index("idx_board_columns_project_pos").on(table.projectId, table.position),
  })
);

// Tasks (Supports both Project Kanban Tasks and Individual Standalone Tasks)
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    columnId: uuid("column_id").references(() => boardColumns.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    deadline: timestamp("deadline", { withTimezone: true }),
    priority: text("priority").default("normal").notNull(), // 'normal' | 'important' | 'urgent'
    position: doublePrecision("position"),
    status: text("status"), // For individual tasks: 'todo' | 'in_progress' | 'done' | 'cancelled'
    createdBy: uuid("created_by")
      .notNull()
      .references(() => employees.id),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: uuid("deleted_by").references(() => employees.id),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectColumnIdx: index("idx_tasks_project_column").on(table.projectId, table.columnId),
    deadlineIdx: index("idx_tasks_deadline").on(table.deadline),
    isDeletedIdx: index("idx_tasks_deleted").on(table.isDeleted),
  })
);

// Multi-Assignees per Task
export const taskAssignees = pgTable(
  "task_assignees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => employees.id),
  },
  (table) => ({
    taskEmployeeUnique: unique("uniq_task_employee").on(table.taskId, table.employeeId),
    employeeIdx: index("idx_task_assignees_employee").on(table.employeeId),
  })
);

// Multiple Checklists per Task
export const checklists = pgTable(
  "checklists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: doublePrecision("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    taskPosIdx: index("idx_checklists_task_pos").on(table.taskId, table.position),
  })
);

// Checklist Items with Audit History (Preserved on Uncheck)
export const checklistItems = pgTable(
  "checklist_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    checklistId: uuid("checklist_id")
      .notNull()
      .references(() => checklists.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: doublePrecision("position").notNull(),
    isDone: boolean("is_done").default(false).notNull(),
    doneBy: uuid("done_by").references(() => employees.id),
    doneAt: timestamp("done_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    checklistIdx: index("idx_checklist_items_checklist").on(table.checklistId),
  })
);

// Append-only Task Reports Timeline
export const taskReports = pgTable(
  "task_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => employees.id),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    taskCreatedAtIdx: index("idx_task_reports_task_created").on(table.taskId, table.createdAt),
  })
);

// System Activity Log
export const taskActivityLog = pgTable(
  "task_activity_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => employees.id),
    actionType: text("action_type").notNull(), // 'created' | 'moved_column' | 'assignee_added' | 'assignee_removed' | 'edited' | 'deleted' | 'checklist_item_checked'
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    taskCreatedAtIdx: index("idx_task_activity_task_created").on(table.taskId, table.createdAt),
  })
);

// ==========================================
// Relations
// ==========================================

export const employeesRelations = relations(employees, ({ many }) => ({
  reports: many(dailyReports),
  history: many(reportHistory),
  loginTokens: many(loginTokens),
  projectMemberships: many(projectMembers),
  assignedTasks: many(taskAssignees),
  createdProjects: many(projects),
  createdTasks: many(tasks),
  taskReports: many(taskReports),
  activities: many(taskActivityLog),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(employees, {
    fields: [projects.createdBy],
    references: [employees.id],
  }),
  members: many(projectMembers),
  columns: many(boardColumns),
  tasks: many(tasks),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  employee: one(employees, {
    fields: [projectMembers.employeeId],
    references: [employees.id],
  }),
}));

export const boardColumnsRelations = relations(boardColumns, ({ one, many }) => ({
  project: one(projects, {
    fields: [boardColumns.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  column: one(boardColumns, {
    fields: [tasks.columnId],
    references: [boardColumns.id],
  }),
  creator: one(employees, {
    fields: [tasks.createdBy],
    references: [employees.id],
  }),
  assignees: many(taskAssignees),
  checklists: many(checklists),
  reports: many(taskReports),
  activities: many(taskActivityLog),
}));

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignees.taskId],
    references: [tasks.id],
  }),
  employee: one(employees, {
    fields: [taskAssignees.employeeId],
    references: [employees.id],
  }),
  assignedByEmployee: one(employees, {
    fields: [taskAssignees.assignedBy],
    references: [employees.id],
  }),
}));

export const checklistsRelations = relations(checklists, ({ one, many }) => ({
  task: one(tasks, {
    fields: [checklists.taskId],
    references: [tasks.id],
  }),
  items: many(checklistItems),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  checklist: one(checklists, {
    fields: [checklistItems.checklistId],
    references: [checklists.id],
  }),
  doneByEmployee: one(employees, {
    fields: [checklistItems.doneBy],
    references: [employees.id],
  }),
}));

export const taskReportsRelations = relations(taskReports, ({ one }) => ({
  task: one(tasks, {
    fields: [taskReports.taskId],
    references: [tasks.id],
  }),
  author: one(employees, {
    fields: [taskReports.authorId],
    references: [employees.id],
  }),
}));

export const taskActivityLogRelations = relations(taskActivityLog, ({ one }) => ({
  task: one(tasks, {
    fields: [taskActivityLog.taskId],
    references: [tasks.id],
  }),
  actor: one(employees, {
    fields: [taskActivityLog.actorId],
    references: [employees.id],
  }),
}));

// ==========================================
// Types
// ==========================================

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type LoginToken = typeof loginTokens.$inferSelect;
export type DailyReport = typeof dailyReports.$inferSelect;
export type ReportItem = typeof reportItems.$inferSelect;
export type DailyStat = typeof dailyStats.$inferSelect;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;
export type BoardColumn = typeof boardColumns.$inferSelect;
export type NewBoardColumn = typeof boardColumns.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskAssignee = typeof taskAssignees.$inferSelect;
export type NewTaskAssignee = typeof taskAssignees.$inferInsert;
export type Checklist = typeof checklists.$inferSelect;
export type NewChecklist = typeof checklists.$inferInsert;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type NewChecklistItem = typeof checklistItems.$inferInsert;
export type TaskReport = typeof taskReports.$inferSelect;
export type NewTaskReport = typeof taskReports.$inferInsert;
export type TaskActivityLog = typeof taskActivityLog.$inferSelect;
export type NewTaskActivityLog = typeof taskActivityLog.$inferInsert;
