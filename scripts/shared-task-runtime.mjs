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
  'Operator',
  'Proposal Prep',
  'Contract Intelligence',
  'Memory',
  'Marketing',
  'Finance',
  'Customer Success',
  'Research',
  'Future Marketing',
  'Future Finance',
  'Future Engineering',
  'Future agents',
];

export const universalTaskStatuses = ['draft', 'queued', 'assigned', 'in_progress', 'waiting', 'blocked', 'review', 'approved', 'rejected', 'completed', 'archived'];
export const taskStatuses = ['New', 'Assigned', 'In Progress', 'Waiting', 'Blocked', 'Needs Review', 'Approved', 'Rejected', 'Completed', 'Archived', ...universalTaskStatuses];
export const taskPriorities = ['Critical', 'High', 'Medium', 'Low'];
export const taskCategories = [
  'Sales',
  'Engineering',
  'Migration',
  'Customer',
  'Operations',
  'Operator',
  'Research',
  'Executive',
  'Proposal',
  'Contract',
  'Memory',
  'Marketing',
  'Finance',
  'Documentation',
  'Compliance',
];
export const taskTypes = [
  'research',
  'verification',
  'duplicate review',
  'missing information',
  'follow-up',
  'proposal preparation',
  'executive approval',
  'contract review',
  'compliance review',
  'operator action',
  'sales action',
  'marketing action',
  'finance action',
  'engineering action',
  'memory maintenance',
  'source review',
  'workflow review',
  'general',
];

const statusAlias = new Map([
  ['new', 'queued'],
  ['assigned', 'assigned'],
  ['in progress', 'in_progress'],
  ['in_progress', 'in_progress'],
  ['waiting', 'waiting'],
  ['blocked', 'blocked'],
  ['needs review', 'review'],
  ['review', 'review'],
  ['approved', 'approved'],
  ['rejected', 'rejected'],
  ['completed', 'completed'],
  ['archived', 'archived'],
  ['draft', 'draft'],
  ['queued', 'queued'],
]);
const canonicalToLegacyStatus = {
  draft: 'New',
  queued: 'New',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  waiting: 'Waiting',
  blocked: 'Blocked',
  review: 'Needs Review',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  archived: 'Archived',
};
const openCanonicalStatuses = new Set(['draft', 'queued', 'assigned', 'in_progress', 'waiting', 'blocked', 'review', 'approved', 'rejected']);
const blockedExternalActions = [
  'email sends',
  'SMS sends',
  'CRM writes',
  'Stripe writes',
  'Supabase production writes',
  'proposal submissions',
  'source approvals',
  'executive approvals',
  'production business writes',
  'background execution',
];
const allowedTransitions = {
  draft: ['queued', 'archived'],
  queued: ['assigned', 'blocked', 'archived'],
  assigned: ['in_progress', 'waiting', 'blocked', 'review', 'completed', 'archived'],
  in_progress: ['waiting', 'blocked', 'review', 'completed', 'archived'],
  waiting: ['assigned', 'in_progress', 'blocked', 'review', 'archived'],
  blocked: ['waiting', 'in_progress', 'review', 'archived'],
  review: ['approved', 'rejected', 'in_progress', 'blocked', 'archived'],
  approved: ['completed', 'archived'],
  rejected: ['in_progress', 'archived'],
  completed: ['archived'],
  archived: [],
};
const routeRules = [
  ['Sales', ['Operator', 'Executive', 'Proposal Prep']],
  ['Executive', ['Operator', 'Sales']],
  ['Operator', ['Sales']],
  ['Contract Intelligence', ['Proposal Prep', 'Executive']],
  ['Memory', ['Operator']],
  ['Marketing', ['Sales']],
  ['Future Marketing', ['Sales']],
  ['Finance', ['Executive']],
  ['Future Finance', ['Executive']],
  ['Engineering', ['Operator']],
  ['Future Engineering', ['Operator']],
  ['Operations', ['Operator', 'Sales', 'Executive']],
  ['Research', ['Operator', 'Sales']],
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
    .filter((item) => item.parsed)
    .map((item) => ({ ...item, parsed: normalizeTask(item.parsed) }));
}

export function buildSharedTaskStatus() {
  const tasks = listSharedTasks().map((item) => item.parsed);
  const decorated = decorateTasks(tasks);
  const openTasks = decorated.filter((task) => openCanonicalStatuses.has(task.statusCanonical));
  const blockedTasks = decorated.filter((task) => task.statusCanonical === 'blocked');
  const completedTasks = decorated.filter((task) => task.statusCanonical === 'completed');
  const archivedTasks = decorated.filter((task) => task.statusCanonical === 'archived');
  const overdueTasks = openTasks.filter((task) => task.overdue);
  const reviewTasks = decorated.filter((task) => task.statusCanonical === 'review' || task.approvalRequired);
  const queues = buildUniversalWorkQueues(decorated);

  return {
    safetyMode: 'local/mock/read-only',
    taskRoot: path.relative(repoRoot, sharedTaskRoot),
    totalTasks: tasks.length,
    openTasks: openTasks.length,
    blockedTasks: blockedTasks.length,
    overdueTasks: overdueTasks.length,
    archivedTasks: archivedTasks.length,
    tasksRequiringExecutiveReview: reviewTasks.length,
    tasksByAgent: countBy(decorated, 'assignedAgent'),
    tasksByPriority: countBy(openTasks, 'priority'),
    tasksByCategory: countBy(decorated, 'category'),
    completionTrend: buildCompletionTrend(completedTasks),
    workloadByAgent: buildWorkloadByAgent(decorated),
    activeWorkQueue: openTasks.slice(0, 12),
    newestAssignments: openTasks.sort((a, b) => String(b.createdDate).localeCompare(String(a.createdDate))).slice(0, 6),
    recentlyCompleted: completedTasks.sort((a, b) => String(b.completedDate).localeCompare(String(a.completedDate))).slice(0, 6),
    blockedWork: blockedTasks.slice(0, 12),
    dueSoon: queues['Due Soon'],
    overdueWork: queues.Overdue,
    completedToday: queues['Completed Today'],
    universalQueues: queues,
    queueHealth: queueHealth({ openTasks, blockedTasks, overdueTasks }),
    dependencySummary: buildDependencySummary(decorated),
    knowledgeGraph: buildTaskKnowledgeGraph(decorated),
    blockedExternalActions,
  };
}

export function createSharedTask(options = {}) {
  ensureSharedTaskDirectories();
  const now = new Date().toISOString();
  const task = normalizeTask({
    id: options.id || `task-${compactStamp(now)}-${slugify(options.title || 'shared-task')}`,
    taskId: options.taskId || options.id,
    title: options.title || 'Untitled shared task',
    description: options.description || 'Local shared task created through the Vyra universal work queue.',
    taskType: normalizeTaskType(options.taskType || options.type || inferTaskType(options)),
    sourceAgent: options.sourceAgent || 'Operations',
    owningAgent: options.owningAgent || options.assignedAgent || options.sourceAgent || 'Operations',
    assignedAgent: options.assignedAgent || options.sourceAgent || 'Operations',
    assignedUser: options.assignedUser || null,
    organization: options.organization || options.company || 'Unassigned organization',
    company: options.company || options.organization || 'Unassigned organization',
    priority: options.priority || 'Medium',
    status: options.status || (options.assignedAgent ? 'Assigned' : 'New'),
    category: options.category || inferCategory(options),
    createdTimestamp: now,
    createdDate: now,
    updatedDate: now,
    dueDate: options.dueDate || null,
    completedDate: null,
    completionTimestamp: null,
    blockedReason: options.blockedReason || null,
    approvalRequired: coerceBoolean(options.approvalRequired),
    linkedEntities: parseList(options.linkedEntities),
    linkedWorkflows: parseList(options.linkedWorkflows),
    linkedOpportunities: parseList(options.linkedOpportunities),
    linkedOrganizations: parseList(options.linkedOrganizations || options.organization),
    linkedContacts: parseList(options.linkedContacts),
    linkedReports: parseList(options.linkedReports),
    linkedFacts: parseList(options.linkedFacts),
    linkedProposals: parseList(options.linkedProposals),
    dependencies: parseList(options.dependencies),
    parentTask: options.parentTask || null,
    childTasks: parseList(options.childTasks),
    notes: parseList(options.notes),
    relatedGraphNodeIds: parseList(options.relatedGraphNodeIds),
    auditHistory: [
      buildAuditEntry({
        action: 'create_task',
        operator: options.operator || 'local operator',
        previousStatus: null,
        newStatus: canonicalStatus(options.status || (options.assignedAgent ? 'Assigned' : 'New')),
        reason: 'Created locally. No external action or production write occurred.',
        affectedEntities: parseList(options.linkedEntities),
        nextAction: options.nextAction || 'Review queue assignment and required inputs.',
      }),
    ],
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

export function updateSharedTask({ id, operator = 'local operator', notes = 'Updated locally.', ...updates }) {
  return transitionTask({
    id,
    action: 'update_task',
    operator,
    notes,
    update(task) {
      const fields = [
        'title',
        'description',
        'taskType',
        'owningAgent',
        'assignedUser',
        'organization',
        'company',
        'priority',
        'category',
        'dueDate',
        'blockedReason',
        'approvalRequired',
        'parentTask',
      ];
      fields.forEach((field) => {
        if (updates[field] !== undefined) task[field] = updates[field];
      });
      ['linkedEntities', 'linkedWorkflows', 'linkedOpportunities', 'linkedOrganizations', 'linkedContacts', 'linkedReports', 'linkedFacts', 'linkedProposals', 'dependencies', 'childTasks', 'notes'].forEach(
        (field) => {
          if (updates[field] !== undefined) task[field] = parseList(updates[field]);
        },
      );
      return 'update_task';
    },
  });
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
      task.owningAgent = task.owningAgent || task.assignedAgent;
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

export function blockSharedTask({ id, operator = 'local operator', notes = 'Blocked locally.', blockedReason }) {
  return transitionTask({
    id,
    action: 'block_task',
    operator,
    notes,
    update(task) {
      task.status = 'Blocked';
      task.blockedReason = blockedReason || notes || 'Blocked pending local review.';
      return 'block_task';
    },
  });
}

export function unblockSharedTask({ id, operator = 'local operator', notes = 'Unblocked locally.', nextStatus = 'Waiting' }) {
  return transitionTask({
    id,
    action: 'unblock_task',
    operator,
    notes,
    update(task) {
      task.status = nextStatus;
      task.blockedReason = null;
      return 'unblock_task';
    },
  });
}

export function routeSharedTask({ id, sourceAgent, targetAgent, operator = 'local operator', notes = 'Routed locally.', reason }) {
  return transitionTask({
    id,
    action: 'route_task',
    operator,
    notes,
    update(task) {
      const source = normalizeAgent(sourceAgent || task.assignedAgent || task.sourceAgent);
      const target = normalizeAgent(targetAgent || task.assignedAgent);
      if (!routeAllowed(source, target)) {
        task.__transitionError = `Route from ${source} to ${target} is not supported by the local routing map.`;
        return 'route_task_rejected';
      }
      task.sourceAgent = source;
      task.assignedAgent = target;
      task.owningAgent = target;
      task.status = 'Assigned';
      task.routeHistory = [
        ...(Array.isArray(task.routeHistory) ? task.routeHistory : []),
        {
          timestamp: new Date().toISOString(),
          sourceAgent: source,
          targetAgent: target,
          operator,
          reason: reason || notes,
          localOnly: true,
        },
      ];
      return 'route_task';
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
      task.completedDate = new Date().toISOString();
      task.completionTimestamp = task.completedDate;
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
      task.owningAgent = 'Executive';
      task.priority = 'Critical';
      task.status = 'Needs Review';
      task.approvalRequired = true;
      task.taskType = 'executive approval';
      return 'escalate_task';
    },
  });
}

export function getTaskQueue(queueName = 'Universal Work Queue') {
  const status = buildSharedTaskStatus();
  const queues = status.universalQueues;
  const queue = queues[queueName] || queues[labelize(queueName)] || queues['Universal Work Queue'] || [];
  return {
    title: queueName,
    generatedAt: new Date().toISOString(),
    queue,
    availableQueues: Object.keys(queues),
    safety: safetySummary(),
  };
}

export function getTaskDependencies(id) {
  const tasks = decorateTasks(listSharedTasks().map((item) => item.parsed));
  const task = tasks.find((item) => item.id === id);
  const payload = task
    ? {
        task,
        dependencies: tasks.filter((item) => task.dependencies.includes(item.id)),
        dependents: tasks.filter((item) => item.dependencies.includes(task.id) || item.parentTask === task.id),
        childTasks: tasks.filter((item) => task.childTasks.includes(item.id) || item.parentTask === task.id),
        dependencyPath: task.dependencyPath,
        downstreamImpact: task.downstreamImpact,
      }
    : buildDependencySummary(tasks);
  return { title: id ? 'Task Dependency Detail' : 'Task Dependency Summary', generatedAt: new Date().toISOString(), ...payload, safety: safetySummary() };
}

export function getSharedTaskReport() {
  const status = buildSharedTaskStatus();
  const tasks = listSharedTasks().map((item) => item.parsed);
  const decorated = decorateTasks(tasks);
  const payload = {
    title: 'Universal Task Inventory',
    generatedAt: new Date().toISOString(),
    status,
    tasks: decorated,
    safety: safetySummary(),
  };
  const reports = [
    ['universal-task-inventory', payload],
    ['work-queue-summary', { title: 'Work Queue Summary', generatedAt: payload.generatedAt, queues: status.universalQueues, queueHealth: status.queueHealth, safety: safetySummary() }],
    ['overdue-task-report', { title: 'Overdue Task Report', generatedAt: payload.generatedAt, tasks: status.overdueWork, safety: safetySummary() }],
    ['blocked-work-report', buildBlockedWorkReport(status)],
    ['dependency-report', { title: 'Dependency Report', generatedAt: payload.generatedAt, dependencySummary: status.dependencySummary, tasks: decorated, safety: safetySummary() }],
    ['cross-agent-workload-report', buildAgentWorkloadReport(status)],
    ['executive-task-summary', buildAgentTaskSummary(status, 'Executive')],
    ['operator-task-summary', buildAgentTaskSummary(status, 'Operator')],
    ['sales-task-summary', buildAgentTaskSummary(status, 'Sales')],
    ['completion-report', { title: 'Completion Report', generatedAt: payload.generatedAt, completionTrend: status.completionTrend, completedToday: status.completedToday, recentlyCompleted: status.recentlyCompleted, safety: safetySummary() }],
    ['bottleneck-report', { title: 'Bottleneck Report', generatedAt: payload.generatedAt, blockedWork: status.blockedWork, overdueWork: status.overdueWork, dependencySummary: status.dependencySummary, safety: safetySummary() }],
    ['work-queue', { title: 'Shared Work Queue', generatedAt: payload.generatedAt, status, tasks: decorated, safety: safetySummary() }],
    ['agent-workload-report', buildAgentWorkloadReport(status)],
  ];
  reports.forEach(([slug, report]) => writeTaskReport(slug, report));
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
  const requiredCommands = [
    'tasks:list',
    'tasks:create',
    'tasks:update',
    'tasks:assign',
    'tasks:route',
    'tasks:block',
    'tasks:unblock',
    'tasks:complete',
    'tasks:archive',
    'tasks:dependencies',
    'tasks:queue',
    'tasks:report',
    'tasks:validate',
  ];
  const status = exampleValidation.valid && validations.every((item) => item.valid) ? 'pass' : 'fail';
  return {
    status,
    commands: ['tasks:status', ...requiredCommands, 'tasks:claim'],
    directoriesReady: { tasks: existsSync(sharedTaskRoot), reports: existsSync(sharedTaskReportRoot) },
    supported: { agentTypes: taskAgentTypes, statuses: taskStatuses, universalStatuses: universalTaskStatuses, priorities: taskPriorities, categories: taskCategories, taskTypes },
    universalQueues: Object.keys(buildSharedTaskStatus().universalQueues),
    routeRules: routeRules.map(([source, targets]) => ({ source, targets })),
    exampleValidation,
    validations,
    taskSummary: buildSharedTaskStatus(),
    safety: safetySummary(),
  };
}

export function validateSharedTask(taskInput) {
  const task = normalizeTask(taskInput || {});
  const errors = [];
  if (!nonEmpty(task.id)) errors.push('task id is required.');
  if (!nonEmpty(task.title)) errors.push('title is required.');
  if (!nonEmpty(task.description)) errors.push('description is required.');
  if (!taskAgentTypes.includes(task.sourceAgent)) errors.push(`sourceAgent must be one of: ${taskAgentTypes.join(', ')}.`);
  if (!taskAgentTypes.includes(task.assignedAgent)) errors.push(`assignedAgent must be one of: ${taskAgentTypes.join(', ')}.`);
  if (!taskAgentTypes.includes(task.owningAgent)) errors.push(`owningAgent must be one of: ${taskAgentTypes.join(', ')}.`);
  if (!taskStatuses.includes(task.status)) errors.push(`status must be one of: ${taskStatuses.join(', ')}.`);
  if (!universalTaskStatuses.includes(task.statusCanonical)) errors.push(`statusCanonical must be one of: ${universalTaskStatuses.join(', ')}.`);
  if (!taskPriorities.includes(task.priority)) errors.push(`priority must be one of: ${taskPriorities.join(', ')}.`);
  if (!taskCategories.includes(task.category)) errors.push(`category must be one of: ${taskCategories.join(', ')}.`);
  if (!taskTypes.includes(task.taskType)) errors.push(`taskType must be one of: ${taskTypes.join(', ')}.`);
  if (!nonEmpty(task.createdTimestamp) || Number.isNaN(new Date(task.createdTimestamp).valueOf())) errors.push('createdTimestamp must be an ISO date.');
  if (!nonEmpty(task.createdDate) || Number.isNaN(new Date(task.createdDate).valueOf())) errors.push('createdDate must be an ISO date.');
  if (task.dueDate && Number.isNaN(new Date(task.dueDate).valueOf())) errors.push('dueDate must be an ISO date or null.');
  if (task.completedDate && Number.isNaN(new Date(task.completedDate).valueOf())) errors.push('completedDate must be an ISO date or null.');
  ['linkedEntities', 'linkedWorkflows', 'linkedOpportunities', 'linkedOrganizations', 'linkedContacts', 'linkedReports', 'linkedFacts', 'linkedProposals', 'dependencies', 'childTasks', 'auditHistory'].forEach((field) => {
    if (!Array.isArray(task[field])) errors.push(`${field} must be an array.`);
  });
  if (task.localOnly !== true) errors.push('localOnly must be true.');
  return { valid: errors.length === 0, errors };
}

function transitionTask({ id, action, operator, notes, update }) {
  ensureSharedTaskDirectories();
  const existing = findTask(id);
  if (!existing) return { status: 'fail', errors: [`Task not found: ${id}`] };
  const previous = normalizeTask(existing.parsed);
  const task = {
    ...previous,
    activityLog: Array.isArray(previous.activityLog) ? [...previous.activityLog] : [],
    auditHistory: Array.isArray(previous.auditHistory) ? [...previous.auditHistory] : [],
    routeHistory: Array.isArray(previous.routeHistory) ? [...previous.routeHistory] : [],
  };
  const previousStatus = canonicalStatus(task.status);
  const resolvedAction = update(task) || action;
  if (task.__transitionError) return { status: 'fail', errors: [task.__transitionError], task: previous, safety: safetySummary() };
  const nextStatus = canonicalStatus(task.status);
  if (!isValidTransition(previousStatus, nextStatus, resolvedAction)) {
    return {
      status: 'fail',
      errors: [`Invalid task transition: ${previousStatus} -> ${nextStatus} via ${resolvedAction}.`],
      task: previous,
      safety: safetySummary(),
    };
  }
  task.updatedTimestamp = new Date().toISOString();
  task.updatedDate = task.updatedTimestamp;
  task.activityLog.push({ action: resolvedAction, operator, timestamp: task.updatedTimestamp, note: notes });
  task.auditHistory.push(
    buildAuditEntry({
      action: resolvedAction,
      operator,
      previousStatus,
      newStatus: nextStatus,
      reason: notes || resolvedAction,
      affectedEntities: task.linkedEntities,
      affectedWorkflows: task.linkedWorkflows,
      nextAction: recommendedNextAction(normalizeTask(task)),
    }),
  );
  const normalized = normalizeTask(task);
  const validation = validateSharedTask(normalized);
  if (!validation.valid) return { status: 'fail', errors: validation.errors, task: normalized };
  writeTask(normalized);
  return { status: 'success', action: resolvedAction, task: normalized, safety: safetySummary() };
}

function findTask(id) {
  if (!id) return null;
  return listSharedTasks().find((item) => item.parsed.id === id || item.parsed.taskId === id) ?? null;
}

function normalizeTask(task) {
  const now = new Date().toISOString();
  const createdDate = task.createdDate || task.createdTimestamp || now;
  const statusCanonical = canonicalStatus(task.status);
  const organization = task.organization || task.company || firstValue(task.linkedOrganizations) || 'Unassigned organization';
  const completedDate = task.completedDate || task.completionTimestamp || null;
  const activityLog = Array.isArray(task.activityLog) ? task.activityLog : [];
  const auditHistory = Array.isArray(task.auditHistory) && task.auditHistory.length
    ? task.auditHistory
    : activityLog.map((entry) =>
        buildAuditEntry({
          action: entry.action || 'legacy_activity',
          operator: entry.operator || 'local operator',
          previousStatus: null,
          newStatus: statusCanonical,
          reason: entry.note || 'Legacy activity imported into universal audit trail.',
          timestamp: entry.timestamp,
          affectedEntities: task.linkedEntities,
        }),
      );
  return {
    ...task,
    id: task.id || task.taskId || `task-${compactStamp(createdDate)}-${slugify(task.title || 'shared-task')}`,
    taskId: task.taskId || task.id || `task-${compactStamp(createdDate)}-${slugify(task.title || 'shared-task')}`,
    title: task.title || 'Untitled shared task',
    description: task.description || 'Local shared task.',
    taskType: normalizeTaskType(task.taskType || task.type || inferTaskType(task)),
    sourceAgent: normalizeAgent(task.sourceAgent),
    owningAgent: normalizeAgent(task.owningAgent || task.assignedAgent || task.sourceAgent),
    assignedAgent: normalizeAgent(task.assignedAgent || task.owningAgent || task.sourceAgent),
    assignedUser: task.assignedUser || null,
    organization,
    company: task.company || organization,
    priority: normalizePriority(task.priority),
    status: normalizeStatus(task.status),
    statusCanonical,
    category: normalizeCategory(task.category || inferCategory(task)),
    createdTimestamp: task.createdTimestamp || createdDate,
    createdDate,
    updatedTimestamp: task.updatedTimestamp || task.updatedDate || createdDate,
    updatedDate: task.updatedDate || task.updatedTimestamp || createdDate,
    dueDate: task.dueDate || null,
    completedDate,
    completionTimestamp: task.completionTimestamp || completedDate,
    blockedReason: task.blockedReason || null,
    approvalRequired: Boolean(task.approvalRequired),
    linkedEntities: parseList(task.linkedEntities),
    linkedWorkflows: parseList(task.linkedWorkflows),
    linkedOpportunities: parseList(task.linkedOpportunities),
    linkedOrganizations: uniqueList([...parseList(task.linkedOrganizations), organization].filter(Boolean)),
    linkedContacts: parseList(task.linkedContacts),
    linkedReports: parseList(task.linkedReports),
    linkedFacts: parseList(task.linkedFacts),
    linkedProposals: parseList(task.linkedProposals),
    dependencies: parseList(task.dependencies),
    parentTask: task.parentTask || null,
    childTasks: parseList(task.childTasks),
    notes: parseList(task.notes),
    relatedGraphNodeIds: parseList(task.relatedGraphNodeIds),
    auditHistory,
    activityLog,
    routeHistory: Array.isArray(task.routeHistory) ? task.routeHistory : [],
    localOnly: true,
  };
}

function decorateTasks(tasks) {
  const normalized = tasks.map(normalizeTask);
  return normalized.map((task) => decorateTask(task, normalized));
}

function decorateTask(task, allTasks) {
  const now = new Date();
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const ageDays = Math.max(0, Math.floor((now - new Date(task.createdDate)) / 86400000));
  const dependencyTasks = allTasks.filter((item) => task.dependencies.includes(item.id));
  const blockers = [
    ...(task.statusCanonical === 'blocked' ? [task.blockedReason || 'Task is blocked.'] : []),
    ...dependencyTasks.filter((item) => item.statusCanonical !== 'completed' && item.statusCanonical !== 'archived').map((item) => `Waiting on ${item.title}`),
    ...(task.approvalRequired && !['approved', 'completed', 'archived'].includes(task.statusCanonical) ? ['Manual approval required.'] : []),
  ];
  const priorityScore = calculatePriorityScore(task, due, blockers.length);
  return {
    ...task,
    priorityScore,
    urgencyLabel: urgencyLabel(priorityScore, due),
    slaRisk: slaRisk(priorityScore, due, task.statusCanonical),
    agingBucket: agingBucket(ageDays),
    overdue: Boolean(due && due < now && openCanonicalStatuses.has(task.statusCanonical)),
    dueSoon: Boolean(due && due >= now && due.getTime() - now.getTime() <= 72 * 3600000 && openCanonicalStatuses.has(task.statusCanonical)),
    recommendedNextAction: recommendedNextAction(task),
    readinessState: blockers.length ? 'blocked_or_waiting' : task.statusCanonical === 'review' ? 'ready_for_review' : 'ready_for_work',
    blockers,
    unblockRecommendations: blockers.map((blocker) => `Resolve: ${blocker}`),
    dependencyPath: buildDependencyPath(task, allTasks),
    downstreamImpact: buildDownstreamImpact(task, allTasks),
    queueReasons: queueReasons(task, priorityScore, blockers),
  };
}

function buildUniversalWorkQueues(tasks) {
  const open = tasks.filter((task) => openCanonicalStatuses.has(task.statusCanonical));
  return {
    'Universal Work Queue': sortTasks(open),
    'My Work': sortTasks(open.filter((task) => task.assignedUser || ['assigned', 'in_progress'].includes(task.statusCanonical))),
    'Executive Queue': sortTasks(open.filter((task) => task.assignedAgent === 'Executive' || task.approvalRequired || task.taskType === 'executive approval')),
    'Operator Queue': sortTasks(open.filter((task) => task.assignedAgent === 'Operator' || task.category === 'Operator')),
    'Sales Queue': sortTasks(open.filter((task) => task.assignedAgent === 'Sales' || task.category === 'Sales')),
    'Proposal Queue': sortTasks(open.filter((task) => task.assignedAgent === 'Proposal Prep' || task.category === 'Proposal' || task.taskType === 'proposal preparation')),
    'Contract Queue': sortTasks(open.filter((task) => task.assignedAgent === 'Contract Intelligence' || task.category === 'Contract' || task.taskType === 'contract review')),
    'Memory Queue': sortTasks(open.filter((task) => task.assignedAgent === 'Memory' || task.category === 'Memory' || task.taskType === 'memory maintenance')),
    'Blocked Work': sortTasks(tasks.filter((task) => task.statusCanonical === 'blocked')),
    'Due Soon': sortTasks(tasks.filter((task) => task.dueSoon)),
    Overdue: sortTasks(tasks.filter((task) => task.overdue)),
    'Completed Today': sortTasks(tasks.filter((task) => task.statusCanonical === 'completed' && isToday(task.completedDate || task.updatedDate))),
    Archived: sortTasks(tasks.filter((task) => task.statusCanonical === 'archived')),
  };
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => b.priorityScore - a.priorityScore || String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')) || a.title.localeCompare(b.title));
}

function buildAuditEntry({ action, operator, previousStatus, newStatus, reason, affectedEntities = [], affectedWorkflows = [], nextAction = 'Review locally.', timestamp }) {
  return {
    timestamp: timestamp || new Date().toISOString(),
    action,
    previousStatus,
    newStatus,
    actor: operator || 'local operator',
    operator: operator || 'local operator',
    reason: reason || action,
    affectedEntities: parseList(affectedEntities),
    affectedWorkflows: parseList(affectedWorkflows),
    nextAction,
    localOnly: true,
  };
}

function isValidTransition(previous, next, action) {
  if (previous === next) return true;
  if (action.includes('update')) return true;
  if (action.includes('assign') || action.includes('route') || action.includes('escalate')) return !['completed', 'archived'].includes(previous) && (next === 'assigned' || next === 'review');
  if (action.includes('block')) return !['completed', 'archived'].includes(previous) && next === 'blocked';
  if (action.includes('unblock')) return previous === 'blocked' && ['waiting', 'in_progress', 'assigned', 'review'].includes(next);
  if (action.includes('archive')) return next === 'archived';
  return (allowedTransitions[previous] || []).includes(next);
}

function calculatePriorityScore(task, due, blockerCount) {
  const priority = { Critical: 40, High: 30, Medium: 20, Low: 10 }[task.priority] || 20;
  const dueScore = !due ? 5 : due < new Date() ? 30 : due.getTime() - Date.now() <= 72 * 3600000 ? 20 : 8;
  const executive = task.assignedAgent === 'Executive' || task.approvalRequired ? 15 : 0;
  const proposal = task.taskType === 'proposal preparation' || task.category === 'Proposal' ? 10 : 0;
  const risk = task.statusCanonical === 'blocked' || blockerCount ? 12 : 0;
  return Math.min(100, priority + dueScore + executive + proposal + risk);
}

function urgencyLabel(score, due) {
  if (due && due < new Date()) return 'Overdue';
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Normal';
  return 'Low';
}

function slaRisk(score, due, status) {
  if (status === 'blocked') return 'Blocked';
  if (due && due < new Date()) return 'Past due';
  if (score >= 70) return 'At risk';
  return 'On track';
}

function agingBucket(days) {
  if (days >= 14) return '14+ days';
  if (days >= 7) return '7-13 days';
  if (days >= 3) return '3-6 days';
  return '0-2 days';
}

function recommendedNextAction(task) {
  if (task.statusCanonical === 'blocked') return `Resolve blocker: ${task.blockedReason || 'missing local input'}`;
  if (task.approvalRequired && task.statusCanonical !== 'approved') return 'Route for manual Executive approval.';
  if (task.dependencies.length) return 'Review dependency path before starting work.';
  if (task.statusCanonical === 'queued') return 'Assign an owning agent and due date.';
  if (task.taskType === 'missing information') return 'Collect missing information locally and update linked records.';
  if (task.taskType === 'proposal preparation') return 'Prepare proposal package locally; do not submit.';
  if (task.taskType === 'memory maintenance') return 'Review stale or conflicting memory facts locally.';
  return 'Continue local work and record the next status transition.';
}

function queueReasons(task, score, blockers) {
  return [
    `${task.assignedAgent} owns this ${task.taskType} task.`,
    `Priority score ${score} from ${task.priority} priority, due date, blockers, and approval visibility.`,
    ...(blockers.length ? blockers : []),
  ];
}

function buildDependencyPath(task, allTasks, seen = new Set()) {
  if (seen.has(task.id)) return [`cycle:${task.id}`];
  seen.add(task.id);
  const dependencies = allTasks.filter((item) => task.dependencies.includes(item.id));
  return dependencies.flatMap((dependency) => [dependency.id, ...buildDependencyPath(dependency, allTasks, seen)]);
}

function buildDownstreamImpact(task, allTasks) {
  return allTasks
    .filter((item) => item.dependencies.includes(task.id) || item.parentTask === task.id)
    .map((item) => ({ id: item.id, title: item.title, assignedAgent: item.assignedAgent, status: item.status }));
}

function buildDependencySummary(tasks) {
  const tasksWithDependencies = tasks.filter((task) => task.dependencies.length || task.parentTask || task.childTasks.length);
  return {
    totalLinkedTasks: tasksWithDependencies.length,
    blockedByDependencies: tasks.filter((task) => task.blockers?.length).length,
    dependencyEdges: tasks.reduce((count, task) => count + task.dependencies.length + (task.parentTask ? 1 : 0), 0),
    tasks: tasksWithDependencies.map((task) => ({
      id: task.id,
      title: task.title,
      dependencies: task.dependencies,
      parentTask: task.parentTask,
      childTasks: task.childTasks,
      readinessState: task.readinessState,
      downstreamImpact: task.downstreamImpact,
    })),
  };
}

function buildExecutiveTaskSummary(status) {
  return buildAgentTaskSummary(status, 'Executive');
}

function buildAgentTaskSummary(status, agent) {
  const queue = status.universalQueues[`${agent} Queue`] || status.activeWorkQueue.filter((task) => task.assignedAgent === agent);
  return {
    title: `${agent} Task Summary`,
    generatedAt: new Date().toISOString(),
    openTasks: queue.length,
    blockedTasks: queue.filter((task) => task.statusCanonical === 'blocked').length,
    overdueTasks: queue.filter((task) => task.overdue).length,
    tasksRequiringExecutiveReview: status.tasksRequiringExecutiveReview,
    queue,
    queueHealth: status.queueHealth,
    safety: safetySummary(),
  };
}

function buildAgentWorkloadReport(status) {
  return {
    title: 'Cross-Agent Workload Report',
    generatedAt: new Date().toISOString(),
    workloadByAgent: status.workloadByAgent,
    tasksByAgent: status.tasksByAgent,
    newestAssignments: status.newestAssignments,
    universalQueues: Object.fromEntries(Object.entries(status.universalQueues).map(([queue, tasks]) => [queue, tasks.length])),
    safety: safetySummary(),
  };
}

function buildBlockedWorkReport(status) {
  return {
    title: 'Blocked Work Report',
    generatedAt: new Date().toISOString(),
    blockedTasks: status.blockedWork,
    overdueTasks: status.overdueWork,
    dependencySummary: status.dependencySummary,
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
    if (task.parentTask) edges.push({ from: task.parentTask, to: task.id, relationship: 'parent_task' });
    task.dependencies.forEach((dependencyId) => edges.push({ from: task.id, to: dependencyId, relationship: 'depends_on' }));
    task.linkedOrganizations.forEach((organization) => {
      nodes.push({ id: `organization:${slugify(organization)}`, type: 'organization', label: organization });
      edges.push({ from: task.id, to: `organization:${slugify(organization)}`, relationship: 'related_to' });
    });
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
    relationshipTypes: ['assigned_to', 'created_by', 'related_to', 'linked_entity', 'related_graph_node', 'depends_on', 'parent_task'],
  };
}

function buildWorkloadByAgent(tasks) {
  return taskAgentTypes.reduce((result, agent) => {
    const agentTasks = tasks.filter((task) => task.assignedAgent === agent);
    result[agent] = {
      open: agentTasks.filter((task) => openCanonicalStatuses.has(task.statusCanonical)).length,
      blocked: agentTasks.filter((task) => task.statusCanonical === 'blocked').length,
      completed: agentTasks.filter((task) => task.statusCanonical === 'completed').length,
    };
    return result;
  }, {});
}

function buildCompletionTrend(tasks) {
  return tasks.reduce((result, task) => {
    const day = String(task.completedDate || task.completionTimestamp || '').slice(0, 10) || 'unknown';
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

function routeAllowed(source, target) {
  if (source === target) return true;
  return routeRules.some(([ruleSource, targets]) => ruleSource === source && targets.includes(target));
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

function normalizeAgent(value) {
  const match = taskAgentTypes.find((item) => item.toLowerCase() === String(value || '').toLowerCase());
  return match || 'Operations';
}

function normalizePriority(value) {
  const match = taskPriorities.find((item) => item.toLowerCase() === String(value || '').toLowerCase());
  return match || 'Medium';
}

function normalizeStatus(value) {
  const canonical = canonicalStatus(value);
  return canonicalToLegacyStatus[canonical] || 'New';
}

function canonicalStatus(value) {
  return statusAlias.get(String(value || 'New').toLowerCase().replace(/-/g, '_')) || 'queued';
}

function normalizeCategory(value) {
  const match = taskCategories.find((item) => item.toLowerCase() === String(value || '').toLowerCase());
  return match || 'Operations';
}

function normalizeTaskType(value) {
  const match = taskTypes.find((item) => item.toLowerCase() === String(value || '').toLowerCase());
  return match || 'general';
}

function inferTaskType(task) {
  const text = `${task.title || ''} ${task.description || ''} ${task.category || ''}`.toLowerCase();
  if (text.includes('executive') || text.includes('approval')) return 'executive approval';
  if (text.includes('verify')) return 'verification';
  if (text.includes('duplicate')) return 'duplicate review';
  if (text.includes('missing')) return 'missing information';
  if (text.includes('follow')) return 'follow-up';
  if (text.includes('proposal')) return 'proposal preparation';
  if (text.includes('contract')) return 'contract review';
  if (text.includes('memory')) return 'memory maintenance';
  if (text.includes('source')) return 'source review';
  if (text.includes('workflow')) return 'workflow review';
  if (text.includes('research')) return 'research';
  if (text.includes('engineering')) return 'engineering action';
  if (text.includes('sales')) return 'sales action';
  return 'general';
}

function inferCategory(task) {
  const text = `${task.title || ''} ${task.description || ''} ${task.assignedAgent || ''} ${task.sourceAgent || ''}`.toLowerCase();
  if (text.includes('sales')) return 'Sales';
  if (text.includes('operator')) return 'Operator';
  if (text.includes('proposal')) return 'Proposal';
  if (text.includes('contract')) return 'Contract';
  if (text.includes('memory')) return 'Memory';
  if (text.includes('executive')) return 'Executive';
  if (text.includes('engineering')) return 'Engineering';
  if (text.includes('research')) return 'Research';
  return 'Operations';
}

function parseList(value) {
  if (Array.isArray(value)) return value.filter((item) => item !== null && item !== undefined && item !== '');
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
    automaticApprovals: false,
    blockedExternalActions,
  };
}

function dedupeById(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function uniqueList(items) {
  return [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];
}

function firstValue(value) {
  return parseList(value)[0];
}

function isToday(value) {
  if (!value) return false;
  return String(value).slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function safeFileName(value) {
  return slugify(value).slice(0, 140);
}

function slugify(value) {
  return (
    String(value || 'item')
      .toLowerCase()
      .replace(/[^a-z0-9:_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  );
}

function compactStamp(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function labelize(key) {
  return String(key)
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
