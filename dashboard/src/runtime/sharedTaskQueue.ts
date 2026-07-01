export type SharedTaskStatus =
  | 'New'
  | 'Assigned'
  | 'In Progress'
  | 'Waiting'
  | 'Blocked'
  | 'Needs Review'
  | 'Approved'
  | 'Rejected'
  | 'Completed'
  | 'Archived';

export interface SharedTaskDashboardItem {
  agingBucket: string;
  assignedAgent: string;
  blockers: string[];
  category: string;
  dueDate: string;
  id: string;
  organization: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  priorityScore: number;
  queueReasons: string[];
  recommendedNextAction: string;
  slaRisk: string;
  status: SharedTaskStatus;
  taskType: string;
  title: string;
  urgencyLabel: string;
}

export interface SharedTaskDependencySummary {
  dependencyEdges: number;
  blockedByDependencies: number;
  tasks: Array<{
    id: string;
    title: string;
    dependencies: string[];
    readinessState: string;
    downstreamImpact: Array<{ id: string; title: string; assignedAgent: string; status: SharedTaskStatus }>;
  }>;
}

export interface SharedTaskDashboardSummary {
  activeWorkQueue: SharedTaskDashboardItem[];
  blockedTasks: number;
  blockedWork: SharedTaskDashboardItem[];
  completionTrend: Record<string, number>;
  completedToday: SharedTaskDashboardItem[];
  dependencySummary: SharedTaskDependencySummary;
  dueSoon: SharedTaskDashboardItem[];
  engineeringTasks: number;
  executiveQueue: SharedTaskDashboardItem[];
  followUpTasks: number;
  memoryQueue: SharedTaskDashboardItem[];
  migrationTasks: number;
  newestAssignments: SharedTaskDashboardItem[];
  openTasks: number;
  operatorQueue: SharedTaskDashboardItem[];
  overdueTasks: number;
  overdueWork: SharedTaskDashboardItem[];
  proposalQueue: SharedTaskDashboardItem[];
  proposalTasks: number;
  queueHealth: string;
  recentlyCompleted: SharedTaskDashboardItem[];
  salesQueue: SharedTaskDashboardItem[];
  salesTasks: number;
  tasksByAgent: Record<string, number>;
  tasksByPriority: Record<string, number>;
  tasksRequiringExecutiveReview: number;
  universalQueues: Record<string, SharedTaskDashboardItem[]>;
  workloadByAgent: Record<string, { blocked: number; completed: number; open: number }>;
}

const activeTasks: SharedTaskDashboardItem[] = [
  task({
    id: 'task-sales-follow-up-louisville',
    title: 'Prepare Louisville follow-up package',
    taskType: 'follow-up',
    assignedAgent: 'Sales',
    category: 'Sales',
    organization: 'Louisville Combat Academy',
    priority: 'High',
    status: 'In Progress',
    dueDate: '2026-07-02T14:00:00.000Z',
    priorityScore: 74,
    reasons: ['High-fit Louisville prospect needs next-step prep.', 'Follow-up date is within the next operating window.'],
    nextAction: 'Draft local follow-up notes and hand proposal gaps to Proposal Prep.',
  }),
  task({
    id: 'task-operator-verification-area-502',
    title: 'Verify Area 502 source confidence',
    taskType: 'verification',
    assignedAgent: 'Operator',
    category: 'Operator',
    organization: 'Area 502 MMA',
    priority: 'High',
    status: 'Assigned',
    dueDate: '2026-07-02T18:00:00.000Z',
    priorityScore: 68,
    reasons: ['Sales research depends on reviewed source fields.', 'Operator owns verification before Executive reporting.'],
    nextAction: 'Review pasted source notes and mark missing fields locally.',
  }),
  task({
    id: 'task-executive-approval-core-combat',
    title: 'Review Core Combat proposal readiness',
    taskType: 'executive approval',
    assignedAgent: 'Executive',
    category: 'Executive',
    organization: 'Core Combat Sports',
    priority: 'Critical',
    status: 'Needs Review',
    dueDate: '2026-07-03T13:00:00.000Z',
    priorityScore: 88,
    reasons: ['Manual approval is required before any external action gate.', 'Opportunity has proposal-ready buying signals.'],
    nextAction: 'Approve, reject, or request missing requirements locally.',
  }),
  task({
    id: 'task-proposal-prep-apex',
    title: 'Assemble Apex proposal prep packet',
    taskType: 'proposal preparation',
    assignedAgent: 'Proposal Prep',
    category: 'Proposal',
    organization: 'Apex Martial Arts Academy',
    priority: 'High',
    status: 'Waiting',
    dueDate: '2026-07-04T16:00:00.000Z',
    priorityScore: 62,
    reasons: ['Proposal queue item is waiting on pricing and source verification.', 'Sales workflow marked the opportunity as warm.'],
    blockers: ['Waiting on verified pricing requirements.'],
    nextAction: 'Collect missing requirements and keep proposal submission disabled.',
  }),
  task({
    id: 'task-memory-conflict-butcher',
    title: 'Resolve Butchertown conflicting relationship facts',
    taskType: 'memory maintenance',
    assignedAgent: 'Operator',
    category: 'Memory',
    organization: 'Butchertown CrossFit',
    priority: 'Medium',
    status: 'Blocked',
    dueDate: '2026-07-01T16:00:00.000Z',
    priorityScore: 70,
    reasons: ['Memory conflict blocks clean handoff context.', 'Blocked work is visible to Operator and global queues.'],
    blockers: ['Needs human review of duplicate organization facts.'],
    nextAction: 'Review duplicate facts and choose the surviving local record.',
  }),
  task({
    id: 'task-contract-review-full-moon',
    title: 'Check Full Moon contract review gate',
    taskType: 'contract review',
    assignedAgent: 'Contract Intelligence',
    category: 'Contract',
    organization: 'Full Moon Martial Arts',
    priority: 'Medium',
    status: 'Assigned',
    dueDate: '2026-07-06T14:00:00.000Z',
    priorityScore: 47,
    reasons: ['Contract review must happen before proposal-ready status.', 'No proposal submission is allowed from the queue.'],
    nextAction: 'Prepare contract notes for Executive review.',
  }),
];

const completedTasks: SharedTaskDashboardItem[] = [
  task({
    id: 'task-completed-research-louisville',
    title: 'Compile Louisville KY research intake notes',
    taskType: 'research',
    assignedAgent: 'Research',
    category: 'Research',
    organization: 'Louisville Prospect Set',
    priority: 'Low',
    status: 'Completed',
    dueDate: '2026-07-01T12:00:00.000Z',
    priorityScore: 28,
    reasons: ['Research intake was completed locally today.'],
    nextAction: 'Use approved notes in Sales queues only after verification.',
  }),
];

export function buildDashboardSharedTaskSummary(): SharedTaskDashboardSummary {
  const open = activeTasks;
  const blockedWork = open.filter((task) => task.status === 'Blocked');
  const dueSoon = open.filter((task) => ['Critical', 'High'].includes(task.urgencyLabel) || task.slaRisk === 'At risk');
  const overdueWork = open.filter((task) => task.urgencyLabel === 'Overdue' || task.slaRisk === 'Past due');
  const universalQueues = buildQueues(open, completedTasks, dueSoon, overdueWork);
  return {
    activeWorkQueue: universalQueues['Universal Work Queue'],
    blockedTasks: blockedWork.length,
    blockedWork,
    completionTrend: { '2026-07-01': completedTasks.length },
    completedToday: completedTasks,
    dependencySummary: {
      dependencyEdges: 4,
      blockedByDependencies: 2,
      tasks: [
        {
          id: 'task-proposal-prep-apex',
          title: 'Assemble Apex proposal prep packet',
          dependencies: ['task-operator-verification-area-502'],
          readinessState: 'blocked_or_waiting',
          downstreamImpact: [{ id: 'task-executive-approval-core-combat', title: 'Review Core Combat proposal readiness', assignedAgent: 'Executive', status: 'Needs Review' }],
        },
        {
          id: 'task-memory-conflict-butcher',
          title: 'Resolve Butchertown conflicting relationship facts',
          dependencies: [],
          readinessState: 'blocked_or_waiting',
          downstreamImpact: [{ id: 'task-sales-follow-up-louisville', title: 'Prepare Louisville follow-up package', assignedAgent: 'Sales', status: 'In Progress' }],
        },
      ],
    },
    dueSoon,
    engineeringTasks: open.filter((task) => task.category === 'Engineering').length,
    executiveQueue: universalQueues['Executive Queue'],
    followUpTasks: open.filter((task) => task.taskType === 'follow-up').length,
    memoryQueue: universalQueues['Memory Queue'],
    migrationTasks: open.filter((task) => task.category === 'Migration').length,
    newestAssignments: open.slice(0, 4),
    openTasks: open.length,
    operatorQueue: universalQueues['Operator Queue'],
    overdueTasks: overdueWork.length,
    overdueWork,
    proposalQueue: universalQueues['Proposal Queue'],
    proposalTasks: universalQueues['Proposal Queue'].length,
    queueHealth: blockedWork.length || overdueWork.length ? 'Watch' : 'Ready',
    recentlyCompleted: completedTasks,
    salesQueue: universalQueues['Sales Queue'],
    salesTasks: universalQueues['Sales Queue'].length,
    tasksByAgent: countBy(open, 'assignedAgent'),
    tasksByPriority: countBy(open, 'priority'),
    tasksRequiringExecutiveReview: universalQueues['Executive Queue'].length,
    universalQueues,
    workloadByAgent: buildWorkload(open, completedTasks),
  };
}

function task(input: {
  assignedAgent: string;
  blockers?: string[];
  category: string;
  dueDate: string;
  id: string;
  nextAction: string;
  organization: string;
  priority: SharedTaskDashboardItem['priority'];
  priorityScore: number;
  reasons: string[];
  status: SharedTaskStatus;
  taskType: string;
  title: string;
}): SharedTaskDashboardItem {
  const urgencyLabel = input.priorityScore >= 80 ? 'Critical' : input.priorityScore >= 60 ? 'High' : input.priorityScore >= 40 ? 'Normal' : 'Low';
  return {
    agingBucket: input.status === 'Blocked' ? '3-6 days' : '0-2 days',
    assignedAgent: input.assignedAgent,
    blockers: input.blockers ?? [],
    category: input.category,
    dueDate: input.dueDate,
    id: input.id,
    organization: input.organization,
    priority: input.priority,
    priorityScore: input.priorityScore,
    queueReasons: input.reasons,
    recommendedNextAction: input.nextAction,
    slaRisk: input.status === 'Blocked' ? 'Blocked' : input.priorityScore >= 70 ? 'At risk' : 'On track',
    status: input.status,
    taskType: input.taskType,
    title: input.title,
    urgencyLabel,
  };
}

function buildQueues(open: SharedTaskDashboardItem[], completed: SharedTaskDashboardItem[], dueSoon: SharedTaskDashboardItem[], overdueWork: SharedTaskDashboardItem[]) {
  const sorted = [...open].sort((a, b) => b.priorityScore - a.priorityScore);
  return {
    'Universal Work Queue': sorted,
    'My Work': sorted.filter((taskItem) => ['Assigned', 'In Progress', 'Waiting'].includes(taskItem.status)),
    'Executive Queue': sorted.filter((taskItem) => taskItem.assignedAgent === 'Executive' || taskItem.taskType === 'executive approval'),
    'Operator Queue': sorted.filter((taskItem) => taskItem.assignedAgent === 'Operator' || taskItem.category === 'Operator' || taskItem.category === 'Memory'),
    'Sales Queue': sorted.filter((taskItem) => taskItem.assignedAgent === 'Sales' || taskItem.category === 'Sales'),
    'Proposal Queue': sorted.filter((taskItem) => taskItem.assignedAgent === 'Proposal Prep' || taskItem.category === 'Proposal'),
    'Contract Queue': sorted.filter((taskItem) => taskItem.assignedAgent === 'Contract Intelligence' || taskItem.category === 'Contract'),
    'Memory Queue': sorted.filter((taskItem) => taskItem.category === 'Memory' || taskItem.taskType === 'memory maintenance'),
    'Blocked Work': sorted.filter((taskItem) => taskItem.status === 'Blocked'),
    'Due Soon': dueSoon,
    Overdue: overdueWork,
    'Completed Today': completed,
    Archived: [],
  };
}

function countBy(items: SharedTaskDashboardItem[], key: keyof SharedTaskDashboardItem): Record<string, number> {
  return items.reduce<Record<string, number>>((result, item) => {
    const value = String(item[key]);
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});
}

function buildWorkload(active: SharedTaskDashboardItem[], completed: SharedTaskDashboardItem[]) {
  const agents = Array.from(new Set([...active, ...completed].map((taskItem) => taskItem.assignedAgent))).sort();
  return agents.reduce<Record<string, { blocked: number; completed: number; open: number }>>((result, agent) => {
    result[agent] = {
      blocked: active.filter((taskItem) => taskItem.assignedAgent === agent && taskItem.status === 'Blocked').length,
      completed: completed.filter((taskItem) => taskItem.assignedAgent === agent).length,
      open: active.filter((taskItem) => taskItem.assignedAgent === agent).length,
    };
    return result;
  }, {});
}
