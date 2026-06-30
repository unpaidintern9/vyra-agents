export interface SharedTaskDashboardItem {
  assignedAgent: string;
  category: string;
  dueDate: string;
  id: string;
  organization: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'New' | 'Assigned' | 'In Progress' | 'Waiting' | 'Blocked' | 'Needs Review' | 'Approved' | 'Completed' | 'Archived';
  title: string;
}

export interface SharedTaskDashboardSummary {
  activeWorkQueue: SharedTaskDashboardItem[];
  blockedTasks: number;
  blockedWork: SharedTaskDashboardItem[];
  completionTrend: Record<string, number>;
  engineeringTasks: number;
  followUpTasks: number;
  migrationTasks: number;
  newestAssignments: SharedTaskDashboardItem[];
  openTasks: number;
  overdueTasks: number;
  proposalTasks: number;
  queueHealth: string;
  recentlyCompleted: SharedTaskDashboardItem[];
  salesTasks: number;
  tasksByAgent: Record<string, number>;
  tasksByPriority: Record<string, number>;
  tasksRequiringExecutiveReview: number;
  workloadByAgent: Record<string, { blocked: number; completed: number; open: number }>;
}

const dashboardTasks: SharedTaskDashboardItem[] = [
  {
    assignedAgent: 'Sales',
    category: 'Sales',
    dueDate: '2026-07-02T14:00:00.000Z',
    id: 'task-dashboard-sales-follow-up',
    organization: 'Louisville MMA Prospect',
    priority: 'High',
    status: 'In Progress',
    title: 'Prepare local follow-up plan for Louisville MMA prospect',
  },
  {
    assignedAgent: 'Migration',
    category: 'Migration',
    dueDate: '2026-07-03T14:00:00.000Z',
    id: 'task-dashboard-migration-review',
    organization: 'Cincinnati CrossFit Prospect',
    priority: 'High',
    status: 'Needs Review',
    title: 'Review migration readiness for imported member list',
  },
  {
    assignedAgent: 'Engineering',
    category: 'Engineering',
    dueDate: '2026-07-01T14:00:00.000Z',
    id: 'task-dashboard-engineering-blocker',
    organization: 'Los Angeles Small Gym Prospect',
    priority: 'Critical',
    status: 'Blocked',
    title: 'Clarify integration blocker before proposal review',
  },
  {
    assignedAgent: 'Executive',
    category: 'Executive',
    dueDate: '2026-07-05T14:00:00.000Z',
    id: 'task-dashboard-executive-approval',
    organization: 'New York Boutique Gym Prospect',
    priority: 'Medium',
    status: 'Needs Review',
    title: 'Review proposal approval gate before manual outreach',
  },
  {
    assignedAgent: 'Customer Success',
    category: 'Customer',
    dueDate: '2026-07-06T14:00:00.000Z',
    id: 'task-dashboard-onboarding-plan',
    organization: 'Louisville MMA Prospect',
    priority: 'Medium',
    status: 'Assigned',
    title: 'Draft local customer onboarding checklist',
  },
];

const completedTasks: SharedTaskDashboardItem[] = [
  {
    assignedAgent: 'Research',
    category: 'Research',
    dueDate: '2026-06-29T14:00:00.000Z',
    id: 'task-dashboard-research-complete',
    organization: 'Cincinnati CrossFit Prospect',
    priority: 'Low',
    status: 'Completed',
    title: 'Compile deterministic prospect dossier notes',
  },
];

export function buildDashboardSharedTaskSummary(): SharedTaskDashboardSummary {
  const active = dashboardTasks;
  const blockedWork = active.filter((task) => task.status === 'Blocked');
  const reviewTasks = active.filter((task) => task.status === 'Needs Review');
  return {
    activeWorkQueue: active,
    blockedTasks: blockedWork.length,
    blockedWork,
    completionTrend: { '2026-06-29': completedTasks.length },
    engineeringTasks: active.filter((task) => task.category === 'Engineering').length,
    followUpTasks: active.filter((task) => task.title.toLowerCase().includes('follow-up')).length,
    migrationTasks: active.filter((task) => task.category === 'Migration').length,
    newestAssignments: active.slice(0, 4),
    openTasks: active.length,
    overdueTasks: 0,
    proposalTasks: active.filter((task) => task.title.toLowerCase().includes('proposal')).length,
    queueHealth: blockedWork.length ? 'Watch' : 'Ready',
    recentlyCompleted: completedTasks,
    salesTasks: active.filter((task) => task.category === 'Sales').length,
    tasksByAgent: countBy(active, 'assignedAgent'),
    tasksByPriority: countBy(active, 'priority'),
    tasksRequiringExecutiveReview: reviewTasks.length,
    workloadByAgent: buildWorkload(active, completedTasks),
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
  const agents = Array.from(new Set([...active, ...completed].map((task) => task.assignedAgent))).sort();
  return agents.reduce<Record<string, { blocked: number; completed: number; open: number }>>((result, agent) => {
    result[agent] = {
      blocked: active.filter((task) => task.assignedAgent === agent && task.status === 'Blocked').length,
      completed: completed.filter((task) => task.assignedAgent === agent).length,
      open: active.filter((task) => task.assignedAgent === agent).length,
    };
    return result;
  }, {});
}
