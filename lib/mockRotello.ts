// Persistent In-memory Store for Rotello Projects, Columns, and Tasks
// Provides seamless local/offline operation when Neon DB is disconnected

export interface MockProject {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  membersCount: number;
  activeTasksCount: number;
  members: any[];
  userRole: string;
}

export interface MockColumn {
  id: string;
  projectId: string;
  name: string;
  position: number;
  isDoneColumn: boolean;
  isEntryColumn: boolean;
}

export interface MockTask {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  description: string | null;
  priority: "normal" | "important" | "urgent";
  deadline: string | null;
  isDeleted: boolean;
  orderInColumn: number;
  createdAt: string;
  updatedAt: string;
  assignees: any[];
  checklists: any[];
}

const initialProjects: MockProject[] = [
  {
    id: "proj-1",
    name: "سامانه اتوماسیون و پایش کارکنان (روتلو)",
    description: "توسعه داشبورد مدیریت وظایف، ربات تلگرام و ثبت خودکار گزارش‌های روزانه",
    createdBy: "emp-1",
    isArchived: false,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    membersCount: 3,
    activeTasksCount: 4,
    members: [
      { id: "pm-1", employeeId: "emp-1", fullName: "علی رضایی", role: "manager" },
      { id: "pm-2", employeeId: "emp-2", fullName: "فاطمه کاظمی", role: "member" },
      { id: "pm-3", employeeId: "emp-3", fullName: "محمد حسینی", role: "member" },
    ],
    userRole: "owner",
  },
  {
    id: "proj-2",
    name: "طراحی رابط کاربری و هویت بصری استودیو",
    description: "طراحی دیزاین سیستم، تایپوگرافی، پالت دارک‌مود و انیمیشن‌های مینیمال",
    createdBy: "emp-1",
    isArchived: false,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    membersCount: 2,
    activeTasksCount: 2,
    members: [
      { id: "pm-4", employeeId: "emp-1", fullName: "علی رضایی", role: "manager" },
      { id: "pm-5", employeeId: "emp-2", fullName: "فاطمه کاظمی", role: "member" },
    ],
    userRole: "owner",
  },
];

const initialColumns: MockColumn[] = [
  // For proj-1
  { id: "col-1", projectId: "proj-1", name: "برای انجام", position: 1000, isDoneColumn: false, isEntryColumn: true },
  { id: "col-2", projectId: "proj-1", name: "در حال انجام", position: 2000, isDoneColumn: false, isEntryColumn: false },
  { id: "col-3", projectId: "proj-1", name: "بازبینی", position: 3000, isDoneColumn: false, isEntryColumn: false },
  { id: "col-4", projectId: "proj-1", name: "انجام‌شده", position: 4000, isDoneColumn: true, isEntryColumn: false },
  // For proj-2
  { id: "col-5", projectId: "proj-2", name: "برای انجام", position: 1000, isDoneColumn: false, isEntryColumn: true },
  { id: "col-6", projectId: "proj-2", name: "در حال انجام", position: 2000, isDoneColumn: false, isEntryColumn: false },
  { id: "col-7", projectId: "proj-2", name: "بازبینی", position: 3000, isDoneColumn: false, isEntryColumn: false },
  { id: "col-8", projectId: "proj-2", name: "انجام‌شده", position: 4000, isDoneColumn: true, isEntryColumn: false },
];

const initialTasks: MockTask[] = [
  {
    id: "task-1",
    projectId: "proj-1",
    columnId: "col-1",
    title: "پیاده‌سازی هویت بصری جدید و رنگ‌های استاندارد دارک مود",
    description: "تنظیم توکن‌های رنگ و سایه جهت ارتقای کنتراست در محیط تاریک",
    priority: "important",
    deadline: "2026-09-12",
    isDeleted: false,
    orderInColumn: 1000,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    assignees: [{ id: "emp-1", fullName: "علی رضایی" }],
    checklists: [
      {
        id: "chk-1",
        title: "مراحل انجام",
        items: [
          { id: "chi-1", title: "بررسی کامپوننت‌های تیره", isDone: true },
          { id: "chi-2", title: "تست کنتراست WCAG", isDone: false },
        ],
      },
    ],
  },
  {
    id: "task-2",
    projectId: "proj-1",
    columnId: "col-2",
    title: "توسعه وب‌هوک ربات تلگرام برای ثبت سریع گزارش",
    description: "اندپوینت دریافت پیام‌های /report و اعتبارسنجی خودکار ساختار ورودی",
    priority: "urgent",
    deadline: "2026-09-10",
    isDeleted: false,
    orderInColumn: 1000,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    assignees: [{ id: "emp-3", fullName: "محمد حسینی" }],
    checklists: [],
  },
];

// Global in-memory storage during node runtime
const globalStore = global as any;
if (!globalStore.__rotelloProjects) {
  globalStore.__rotelloProjects = [...initialProjects];
}
if (!globalStore.__rotelloColumns) {
  globalStore.__rotelloColumns = [...initialColumns];
}
if (!globalStore.__rotelloTasks) {
  globalStore.__rotelloTasks = [...initialTasks];
}

export function getMockProjects(includeArchived = false): MockProject[] {
  const all: MockProject[] = globalStore.__rotelloProjects;
  if (includeArchived) return all;
  return all.filter((p) => !p.isArchived);
}

export function createMockProject({
  name,
  description,
  creatorId = "emp-1",
}: {
  name: string;
  description?: string | null;
  creatorId?: string;
}): MockProject {
  const newId = "proj-" + Date.now();
  const now = new Date().toISOString();

  const newProj: MockProject = {
    id: newId,
    name: name.trim(),
    description: description?.trim() || null,
    createdBy: creatorId,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
    membersCount: 1,
    activeTasksCount: 0,
    members: [{ id: "pm-" + Date.now(), employeeId: creatorId, fullName: "مدیر سیستم", role: "manager" }],
    userRole: "owner",
  };

  // Add default 4 Kanban columns
  const cols: MockColumn[] = [
    { id: `col-${Date.now()}-1`, projectId: newId, name: "برای انجام", position: 1000, isDoneColumn: false, isEntryColumn: true },
    { id: `col-${Date.now()}-2`, projectId: newId, name: "در حال انجام", position: 2000, isDoneColumn: false, isEntryColumn: false },
    { id: `col-${Date.now()}-3`, projectId: newId, name: "بازبینی", position: 3000, isDoneColumn: false, isEntryColumn: false },
    { id: `col-${Date.now()}-4`, projectId: newId, name: "انجام‌شده", position: 4000, isDoneColumn: true, isEntryColumn: false },
  ];

  globalStore.__rotelloProjects.unshift(newProj);
  globalStore.__rotelloColumns.push(...cols);

  return newProj;
}

export function getMockColumns(projectId: string): MockColumn[] {
  return globalStore.__rotelloColumns
    .filter((c: MockColumn) => c.projectId === projectId)
    .sort((a: MockColumn, b: MockColumn) => a.position - b.position);
}

export function createMockColumn({
  projectId,
  name,
  isDoneColumn = false,
  isEntryColumn = false,
}: {
  projectId: string;
  name: string;
  isDoneColumn?: boolean;
  isEntryColumn?: boolean;
}): MockColumn {
  const existingCols = getMockColumns(projectId);
  const position = (existingCols.length + 1) * 1000;
  const newCol: MockColumn = {
    id: `col-${Date.now()}`,
    projectId,
    name: name.trim(),
    position,
    isDoneColumn,
    isEntryColumn,
  };
  globalStore.__rotelloColumns.push(newCol);
  return newCol;
}

export function createMockTask({
  projectId,
  columnId,
  title,
  description = null,
  deadline = null,
  priority = "normal",
  assigneeIds = [],
}: {
  projectId: string;
  columnId?: string;
  title: string;
  description?: string | null;
  deadline?: string | null;
  priority?: "normal" | "important" | "urgent";
  assigneeIds?: string[];
}): MockTask {
  // If columnId not given, find entry or first column
  let targetColId = columnId;
  if (!targetColId) {
    const cols = getMockColumns(projectId);
    targetColId = cols.find((c) => c.isEntryColumn)?.id || cols[0]?.id || "col-1";
  }

  const newId = `task-${Date.now()}`;
  const now = new Date().toISOString();

  // Map assignees
  const allEmps = [
    { id: "emp-1", fullName: "علی رضایی" },
    { id: "emp-2", fullName: "فاطمه کاظمی" },
    { id: "emp-3", fullName: "محمد حسینی" },
  ];
  const assignees = assigneeIds.map((id) => {
    const found = allEmps.find((e) => e.id === id);
    return found || { id, fullName: "همکار" };
  });

  const newTask: MockTask = {
    id: newId,
    projectId,
    columnId: targetColId,
    title: title.trim(),
    description: description ? description.trim() : null,
    priority: priority as any,
    deadline: deadline || null,
    isDeleted: false,
    orderInColumn: 1000,
    createdAt: now,
    updatedAt: now,
    assignees,
    checklists: [],
  };

  globalStore.__rotelloTasks.unshift(newTask);

  // Update project task count
  const proj = globalStore.__rotelloProjects.find((p: MockProject) => p.id === projectId);
  if (proj) {
    proj.activeTasksCount = (proj.activeTasksCount || 0) + 1;
    proj.updatedAt = now;
  }

  return newTask;
}

export function addMockMember({
  projectId,
  employeeId,
  role = "member",
}: {
  projectId: string;
  employeeId: string;
  role?: string;
}) {
  const proj = globalStore.__rotelloProjects.find((p: MockProject) => p.id === projectId);
  if (!proj) return null;

  const allEmps = [
    { id: "emp-1", fullName: "علی رضایی", department: "پسرانه" },
    { id: "emp-2", fullName: "فاطمه کاظمی", department: "دخترانه" },
    { id: "emp-3", fullName: "محمد حسینی", department: "پسرانه" },
  ];
  const emp = allEmps.find((e) => e.id === employeeId) || { id: employeeId, fullName: "همکار جدید", department: "پسرانه" };

  if (!proj.members) proj.members = [];
  const existingIdx = proj.members.findIndex((m: any) => m.employeeId === employeeId);
  if (existingIdx >= 0) {
    proj.members[existingIdx].role = role;
    return proj.members[existingIdx];
  }

  const newMember = {
    id: `pm-${Date.now()}`,
    employeeId,
    fullName: emp.fullName,
    department: emp.department,
    role,
  };
  proj.members.push(newMember);
  proj.membersCount = proj.members.length;
  return newMember;
}

export function removeMockMember({
  projectId,
  employeeId,
}: {
  projectId: string;
  employeeId: string;
}) {
  const proj = globalStore.__rotelloProjects.find((p: MockProject) => p.id === projectId);
  if (!proj || !proj.members) return false;
  proj.members = proj.members.filter((m: any) => m.employeeId !== employeeId);
  proj.membersCount = proj.members.length;
  return true;
}

export function getMockProjectBoard(projectId: string) {
  const project = globalStore.__rotelloProjects.find((p: MockProject) => p.id === projectId);
  if (!project) return null;

  const columns = globalStore.__rotelloColumns
    .filter((c: MockColumn) => c.projectId === projectId)
    .sort((a: MockColumn, b: MockColumn) => a.position - b.position);

  const tasks = globalStore.__rotelloTasks
    .filter((t: MockTask) => t.projectId === projectId && !t.isDeleted)
    .sort((a: MockTask, b: MockTask) => a.orderInColumn - b.orderInColumn);

  // Group tasks by column
  const columnsWithTasks = columns.map((col: MockColumn) => ({
    ...col,
    tasks: tasks.filter((t: MockTask) => t.columnId === col.id),
  }));

  return {
    project,
    userRole: "owner",
    isAdmin: true,
    columns: columnsWithTasks,
    tasks: tasks,
    members: project.members || [],
    allEmployees: [
      { id: "emp-1", fullName: "علی رضایی", department: "پسرانه", position: "توسعه‌دهنده فرانت‌اند" },
      { id: "emp-2", fullName: "فاطمه کاظمی", department: "دخترانه", position: "طراح UI/UX" },
      { id: "emp-3", fullName: "محمد حسینی", department: "پسرانه", position: "مدیر پروژه" },
    ],
  };
}

