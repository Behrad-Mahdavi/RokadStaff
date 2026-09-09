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

const initialProjects: MockProject[] = [];
const initialColumns: MockColumn[] = [];
const initialTasks: MockTask[] = [];

// Global in-memory storage during node runtime
const globalStore = global as any;
globalStore.__rotelloProjects = [];
globalStore.__rotelloColumns = [];
globalStore.__rotelloTasks = [];

export function getMockProjects(includeArchived = false): MockProject[] {
  const all: MockProject[] = globalStore.__rotelloProjects || [];
  if (includeArchived) return all;
  return all.filter((p) => !p.isArchived);
}

export function updateMockProject(
  id: string,
  data: { name?: string; description?: string | null; isArchived?: boolean }
): MockProject | null {
  const projects = globalStore.__rotelloProjects || [];
  const proj = projects.find((p: MockProject) => p.id === id);
  if (!proj) return null;
  if (data.name !== undefined) proj.name = data.name.trim();
  if (data.description !== undefined) proj.description = data.description ? data.description.trim() : null;
  if (data.isArchived !== undefined) proj.isArchived = data.isArchived;
  proj.updatedAt = new Date().toISOString();
  return proj;
}

export function deleteMockProject(id: string): boolean {
  const projects = globalStore.__rotelloProjects || [];
  const initialLen = projects.length;
  globalStore.__rotelloProjects = projects.filter((p: MockProject) => p.id !== id);
  globalStore.__rotelloColumns = (globalStore.__rotelloColumns || []).filter((c: MockColumn) => c.projectId !== id);
  globalStore.__rotelloTasks = (globalStore.__rotelloTasks || []).filter((t: MockTask) => t.projectId !== id);
  return globalStore.__rotelloProjects.length < initialLen;
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
  const assignees = assigneeIds.map((id) => ({ id, fullName: "همکار" }));

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

  if (!proj.members) proj.members = [];
  const existingIdx = proj.members.findIndex((m: any) => m.employeeId === employeeId);
  if (existingIdx >= 0) {
    proj.members[existingIdx].role = role;
    return proj.members[existingIdx];
  }

  const newMember = {
    id: `pm-${Date.now()}`,
    employeeId,
    fullName: "همکار",
    department: "عمومی",
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
    allEmployees: [],
  };
}
