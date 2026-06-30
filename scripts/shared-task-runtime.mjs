import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const sharedTaskRoot = path.join(repoRoot, 'codex-agent-threads/shared/tasks');
export const sharedTaskReportRoot = path.join(repoRoot, 'reports/agents/runtime');

export const taskAgentTypes = [
  'Executive',
  'Engineering',
  'Sales',
  'Migration',
  'Support',
  'Operations',
  'Customer Success',
  'Research',
  'Future agents',
];

export const taskStatuses = ['New', 'Assigned', 'In Progress', 'Waiting', 'Blocked', 'Needs Review', 'Approved', 'Completed', 'Archived'];
export const taskPriorities = ['Critical', 'High', 'Medium', 'Low'];
export const taskCategories = ['Sales', 'Engineering', 'Migration', 'Customer', 'Operations', 'Research', 'Executive', 'Documentation', 'Compliance'];

const openStatuses = new Set(['New', 'Assigned', 'In Progress', 'Waiting', 'Blocked', 'Needs Review', 'Approved']);
const blockedExternalActions = [
  'email sends',
  'SMS sends',
  'CRM writes',
  'Stripe writes',
  'Supabase production writes',
  'production business writes',
  'background execution',
];

export function ensureSharedTaskDirectories() {
  mkdirSync(sharedTaskRoot, { recursive: true });
  mkdirSync(sharedTaskReportRoot, { recursive: true });
}

export function listSharedTasks() {
  ensureSharedTaskDirectories();
  return readdirSync(sharedTaskRoot)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) => readTaskFile(path.join(sharedTaskRoot, fileName)))
    .filter((item) => item.parsed);
}

export function buildSharedTaskStatus() {
  const tasks = listSharedTasks().map((item) => item.parsed);
  const now = new Date();
  const openTasks = tasks.filter((task) => openStatuses.has(task.status));
  const blockedTasks = tasks.filter((task) => task.status === 'Blocked');
  const completedTasks = tasks.filter((task) => task.status === 'Completed');
  const archivedTasks = tasks.filter((task) => task.status === 'Archived');
  const overdueTasks = openTasks.filter((task) => task.dueDate && new Date(task.dueDate) < now);
  const reviewTasks = tasks.filter((task) => task.status === 'Needs Review' || task.approvalRequired);
  const recentlyCompleted = completedTasks
    .filter((task) => task.completionTimestamp)
    .sort((a, b) => String(b.completionTimestamp).localeCompare(String(a.completionTimestamp)))
    .slice(0, 5);
  const newestAssignments = openTasks.sort((a, b) => String(b.createdTimestamp).localeCompare(String(a.createdTimestamp))).slice(0, 5);
  const activeWorkQueue = openTasks.slice(0, 8);

  return {
    safetyMode: 'local/mock/read-only',
    taskRoot: path.relative(repoRoot, sharedTaskRoot),
    totalTasks: tasks.length,
    openTasks: openTasks.length,
    blockedTasks: blockedTasks.length,
    overdueTasks: overdueTasks.length,
    archivedTasks: archivedTasks.length,
    tasksRequiringExecutiveReview: reviewTasks.length,
    tasksByAgent: countBy(tasks, 'assignedAgent'),
    tasksByPriority: countBy(openTasks, 'priority'),
    tasksByCategory: countBy(tasks, 'category'),
    completionTrend: buildCompletionTrend(completedTasks),
    workloadByAgent: buildWorkloadByAgent(tasks),
    activeWorkQueue,
    newestAssignments,
    recentlyCompleted,
    blockedWork: blockedTasks.slice(0, 8),
    queueHealth: queueHealth({ openTasks, blockedTasks, overdueTasks }),
    knowledgeGraph: buildTaskKnowledgeGraph(tasks),
    blockedExternalActions,
  };
}

export function createSharedTask(options = {}) {
  ensureSharedTaskDirectories();
  const now = new Date().toISOString();
  const task = normalizeTask({
    id: options.id || `task-${compactStamp(now)}-${slugify(options.title || 'shared-task')}`,
    title: options.title || 'Untitled shared task',
    description: options.description || 'Local shared task created through the Vyra work queue.',
    sourceAgent: options.sourceAgent || 'Operations',
    assignedAgent: options.assignedAgent || options.sourceAgent || 'Operations',
    organization: options.organization || 'Unassigned organization',
    priority: options.priority || 'Medium',
    status: options.status || (options.assignedAgent ? 'Assigned' : 'New'),
    category: options.category || 'Operations',
    createdTimestamp: now,
    dueDate: options.dueDate || null,
    completionTimestamp: null,
    approvalRequired: coerceBoolean(options.approvalRequired),
    linkedEntities: parseList(options.linkedEntities),
    notes: parseList(options.notes),
    relatedGraphNodeIds: parseList(options.relatedGraphNodeIds),
    activityLog: [
      {
        action: 'create_task',
        operator: options.operator || 'local operator',
        timestamp: now,
        note: 'Created locally. No external action or production write occurred.',
      },
    ],
    localOnly: true,
  });
  const validation = validateSharedTask(task);
  if (!validation.valid) return { status: 'fail', errors: validation.errors, task };
  writeTask(task);
  return { status: 'success', action: 'create_task', task, safety: safetySummary() };
}

export function assignSharedTask({ id, assignedAgent, operator = 'local operator', notes = 'Assigned locally.', priority }) {
  return transitionTask({
    id,
    action: 'assign_task',
    operator,
    notes,
    update(task) {
      const action = task.assignedAgent && task.assignedAgent !== assignedAgent ? 'reassign_task' : 'assign_task';
      task.assignedAgent = normalizeAgent(assignedAgent || task.assignedAgent);
      task.status = 'Assigned';
      if (priority) task.priority = normalizePriority(priority);
      return action;
    },
  });
}

export function claimSharedTask({ id, agent, operator = 'local operator', notes = 'Claimed locally.' }) {
  return transitionTask({
    id,
    action: 'claim_task',
    operator,
    notes,
    update(task) {
      task.assignedAgent = normalizeAgent(agent || task.assignedAgent);
      task.status = 'In Progress';
      return 'claim_task';
    },
  });
}

export function completeSharedTask({ id, operator = 'local operator', notes = 'Completed locally.' }) {
  return transitionTask({
    id,
    action: 'complete_task',
    operator,
    notes,
    update(task) {
      task.status = 'Completed';
      task.completionTimestamp = new Date().toISOString();
      return 'complete_task';
    },
  });
}

export function archiveSharedTask({ id, operator = 'local operator', notes = 'Archived locally.' }) {
  return transitionTask({
    id,
    action: 'archive_task',
    operator,
    notes,
    update(task) {
      task.status = 'Archived';
      return 'archive_task';
    },
  });
}

export function escalateSharedTask({ id, operator = 'local operator', notes = 'Escalated locally for Executive review.' }) {
  return transitionTask({
    id,
    action: 'escalate_task',
    operator,
    notes,
    update(task) {
      task.assignedAgent = 'Executive';
      task.priority = 'Critical';
      task.status = 'Needs Review';
      task.approvalRequired = true;
      return 'escalate_task';
    },
  });
}

export function getSharedTaskReport() {
  const status = buildSharedTaskStatus();
  const payload = {
    title: 'Shared Work Queue',
    generatedAt: new Date().toISOString(),
    status,
    tasks: listSharedTasks().map((item) => item.parsed),
    safety: safetySummary(),
  };
  writeTaskReport('work-queue', payload);
  writeTaskReport('executive-task-summary', buildExecutiveTaskSummary(status));
  writeTaskReport('agent-workload-report', buildAgentWorkloadReport(status));
  writeTaskReport('blocked-work-report', buildBlockedWorkReport(status));
  return payload;
}

export function validateSharedTaskLayer() {
  ensureSharedTaskDirectories();
  const tasks = listSharedTasks();
  const examplePath = path.join(repoRoot, 'codex-agent-threads/shared/examples/shared-task.example.json');
  const exampleValidation = existsSync(examplePath)
    ? validateSharedTask(JSON.parse(readFileSync(examplePath, 'utf8')))
    : { valid: false, errors: ['missing shared task example'] };
  const validations = tasks.map((item) => ({
    file: path.relative(repoRoot, item.path),
    ...validateSharedTask(item.parsed),
  }));
  const commands = ['tasks:status', 'tasks:list', 'tasks:create', 'tasks:assign', 'tasks:claim', 'tasks:complete', 'tasks:archive', 'tasks:validate'];
  const status = exampleValidation.valid && validations.every((item) => item.valid) ? 'pass' : 'fail';
  return {
    status,
    commands,
    directoriesReady: { tasks: existsSync(sharedTaskRoot), reports: existsSync(sharedTaskReportRoot) },
    supported: { agentTypes: taskAgentTypes, statuses: taskStatuses, priorities: taskPriorities, categories: taskCategories },
    exampleValidation,
    validations,
    taskSummary: buildSharedTaskStatus(),
    safety: safetySummary(),
  };
}

export function validateSharedTask(task) {
  const errors = [];
  if (!nonEmpty(task?.id)) errors.push('task id is required.');
  if (!nonEmpty(task?.title)) errors.push('title is required.');
  if (!nonEmpty(task?.description)) errors.push('description is required.');
  if (!taskAgentTypes.includes(task?.sourceAgent)) errors.push(`sourceAgent must be one of: ${taskAgentTypes.join(', ')}.`);
  if (!taskAgentTypes.includes(task?.assignedAgent)) errors.push(`assignedAgent must be one of: ${taskAgentTypes.join(', ')}.`);
  if (!taskStatuses.includes(task?.status)) errors.push(`status must be one of: ${taskStatuses.join(', ')}.`);
  if (!taskPriorities.includes(task?.priority)) errors.push(`priority must be one of: ${taskPriorities.join(', ')}.`);
  if (!taskCategories.includes(task?.category)) errors.push(`category must be one of: ${taskCategories.join(', ')}.`);
  if (!nonEmpty(task?.createdTimestamp) || Number.isNaN(new Date(task.createdTimestamp).valueOf())) errors.push('createdTimestamp must be an ISO date.');
  if (task?.dueDate && Number.isNaN(new Date(task.dueDate).valueOf())) errors.push('dueDate must be an ISO date or null.');
  if (task?.completionTimestamp && Number.isNaN(new Date(task.completionTimestamp).valueOf())) errors.push('completionTimestamp must be an ISO date or null.');
  if (!Array.isArray(task?.linkedEntities)) errors.push('linkedEntities must be an array.');
  if (!Array.isArray(task?.notes)) errors.push('notes must be an array.');
  if (!Array.isArray(task?.relatedGraphNodeIds)) errors.push('relatedGraphNodeIds must be an array.');
  if (task?.localOnly !== true) errors.push('localOnly must be true.');
  return { valid: errors.length === 0, errors };
}

function transitionTask({ id, action, operator, notes, update }) {
  ensureSharedTaskDirectories();
  const existing = findTask(id);
  if (!existing) return { status: 'fail', errors: [`Task not found: ${id}`] };
  const task = { ...existing.parsed, activityLog: Array.isArray(existing.parsed.activityLog) ? [...existing.parsed.activityLog] : [] };
  const resolvedAction = update(task) || action;
  task.updatedTimestamp = new Date().toISOString();
  task.activityLog.push({
    action: resolvedAction,
    operator,
    timestamp: task.updatedTimestamp,
    note: notes,
  });
  const normalized = normalizeTask(task);
  const validation = validateSharedTask(normalized);
  if (!validation.valid) return { status: 'fail', errors: validation.errors, task: normalized };
  writeTask(normalized);
  return { status: 'success', action: resolvedAction, task: normalized, safety: safetySummary() };
}

function findTask(id) {
  if (!id) return null;
  return listSharedTasks().find((item) => item.parsed.id === id) ?? null;
}

function normalizeTask(task) {
  return {
    ...task,
    sourceAgent: normalizeAgent(task.sourceAgent),
    assignedAgent: normalizeAgent(task.assignedAgent),
    priority: normalizePriority(task.priority),
    status: normalizeStatus(task.status),
    category: normalizeCategory(task.category),
    approvalRequired: Boolean(task.approvalRequired),
    linkedEntities: Array.isArray(task.linkedEntities) ? task.linkedEntities : parseList(task.linkedEntities),
    notes: Array.isArray(task.notes) ? task.notes : parseList(task.notes),
    relatedGraphNodeIds: Array.isArray(task.relatedGraphNodeIds) ? task.relatedGraphNodeIds : parseList(task.relatedGraphNodeIds),
    localOnly: true,
  };
}

function normalizeAgent(value) {
  const match = taskAgentTypes.find((item) => item.toLowerCase() === String(value || '').toLowerCase());
  return match || 'Operations';
}

function normalizePriority(value) {
  const match = taskPriorities.find((item) => item.toLowerCase() === String(value || '').toLowerCase());
  return match || 'Medium';
}

function normalizeStatus(value) {
  const match = taskStatuses.find((item) => item.toLowerCase() === String(value || '').toLowerCase());
  return match || 'New';
}

function normalizeCategory(value) {
  const match = taskCategories.find((item) => item.toLowerCase() === String(value || '').toLowerCase());
  return match || 'Operations';
}

function writeTask(task) {
  const destination = path.join(sharedTaskRoot, `${safeFileName(task.id)}.json`);
  writeFileSync(destination, `${JSON.stringify(task, null, 2)}\n`);
}

function readTaskFile(filePath) {
  try {
    return {
      fileName: path.basename(filePath),
      path: filePath,
      parsed: JSON.parse(readFileSync(filePath, 'utf8')),
    };
  } catch (error) {
    return { fileName: path.basename(filePath), path: filePath, parsed: null, error: error.message };
  }
}

function buildExecutiveTaskSummary(status) {
  return {
    title: 'Executive Task Summary',
    generatedAt: new Date().toISOString(),
    openTasks: status.openTasks,
    blockedTasks: status.blockedTasks,
    overdueTasks: status.overdueTasks,
    tasksRequiringExecutiveReview: status.tasksRequiringExecutiveReview,
    tasksByPriority: status.tasksByPriority,
    queueHealth: status.queueHealth,
    safety: safetySummary(),
  };
}

function buildAgentWorkloadReport(status) {
  return {
    title: 'Agent Workload Report',
    generatedAt: new Date().toISOString(),
    workloadByAgent: status.workloadByAgent,
    tasksByAgent: status.tasksByAgent,
    newestAssignments: status.newestAssignments,
    safety: safetySummary(),
  };
}

function buildBlockedWorkReport(status) {
  return {
    title: 'Blocked Work Report',
    generatedAt: new Date().toISOString(),
    blockedTasks: status.blockedWork,
    overdueTasks: status.overdueTasks,
    queueHealth: status.queueHealth,
    safety: safetySummary(),
  };
}

function buildTaskKnowledgeGraph(tasks) {
  const nodes = [];
  const edges = [];
  tasks.forEach((task) => {
    nodes.push({ id: task.id, type: 'shared_task', label: task.title, status: task.status, priority: task.priority });
    nodes.push({ id: `agent:${task.assignedAgent}`, type: 'agent', label: task.assignedAgent });
    edges.push({ from: `agent:${task.assignedAgent}`, to: task.id, relationship: 'assigned_to' });
    if (task.sourceAgent) {
      nodes.push({ id: `agent:${task.sourceAgent}`, type: 'agent', label: task.sourceAgent });
      edges.push({ from: `agent:${task.sourceAgent}`, to: task.id, relationship: 'created_by' });
    }
    if (task.organization) {
      nodes.push({ id: `organization:${slugify(task.organization)}`, type: 'organization', label: task.organization });
      edges.push({ from: task.id, to: `organization:${slugify(task.organization)}`, relationship: 'related_to' });
    }
    task.linkedEntities.forEach((entity) => {
      const entityId = typeof entity === 'object' && entity !== null ? entity.id || entity.name || JSON.stringify(entity) : String(entity);
      const entityType = typeof entity === 'object' && entity !== null ? entity.type || 'linked_entity' : 'linked_entity';
      nodes.push({ id: `entity:${slugify(entityId)}`, type: entityType, label: entityId });
      edges.push({ from: task.id, to: `entity:${slugify(entityId)}`, relationship: 'linked_entity' });
    });
    task.relatedGraphNodeIds.forEach((nodeId) => edges.push({ from: task.id, to: nodeId, relationship: 'related_graph_node' }));
  });
  return {
    localOnly: true,
    nodes: dedupeById(nodes),
    edges,
    relationshipTypes: ['assigned_to', 'created_by', 'related_to', 'linked_entity', 'related_graph_node'],
  };
}

function buildWorkloadByAgent(tasks) {
  return taskAgentTypes.reduce((result, agent) => {
    const agentTasks = tasks.filter((task) => task.assignedAgent === agent);
    result[agent] = {
      open: agentTasks.filter((task) => openStatuses.has(task.status)).length,
      blocked: agentTasks.filter((task) => task.status === 'Blocked').length,
      completed: agentTasks.filter((task) => task.status === 'Completed').length,
    };
    return result;
  }, {});
}

function buildCompletionTrend(tasks) {
  return tasks.reduce((result, task) => {
    const day = String(task.completionTimestamp || '').slice(0, 10) || 'unknown';
    result[day] = (result[day] ?? 0) + 1;
    return result;
  }, {});
}

function queueHealth({ openTasks, blockedTasks, overdueTasks }) {
  if (blockedTasks.length > 0 || overdueTasks.length > 0) return 'Watch';
  if (openTasks.length > 0) return 'Ready';
  return 'Clear';
}

function countBy(items, key) {
  return items.reduce((result, item) => {
    const value = item[key] || 'Unassigned';
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});
}

function writeTaskReport(slug, payload) {
  mkdirSync(sharedTaskReportRoot, { recursive: true });
  const stamp = compactStamp(payload.generatedAt || new Date().toISOString());
  const base = `${stamp}-${slug}`;
  writeFileSync(path.join(sharedTaskReportRoot, `${base}.json`), `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(path.join(sharedTaskReportRoot, `${base}.md`), toMarkdown(payload));
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title || 'Shared Task Report'}`, ''];
  Object.entries(payload)
    .filter(([key]) => key !== 'title')
    .forEach(([key, value]) => {
      lines.push(`## ${labelize(key)}`, '');
      if (Array.isArray(value)) {
        value.forEach((item) => lines.push(`- ${formatValue(item)}`));
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([childKey, child]) => lines.push(`- ${labelize(childKey)}: ${formatValue(child)}`));
      } else {
        lines.push(String(value ?? ''));
      }
      lines.push('');
    });
  return `${lines.join('\n').trim()}\n`;
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      return [value];
    }
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function coerceBoolean(value) {
  if (typeof value === 'boolean') return value;
  return ['true', 'yes', '1'].includes(String(value || '').toLowerCase());
}

function safetySummary() {
  return {
    localOnly: true,
    externalActions: 'blocked',
    productionWrites: false,
    backgroundExecution: false,
    blockedExternalActions,
  };
}

function dedupeById(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function safeFileName(value) {
  return slugify(value).slice(0, 140);
}

function slugify(value) {
  return String(value || 'item')
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function compactStamp(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function labelize(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
