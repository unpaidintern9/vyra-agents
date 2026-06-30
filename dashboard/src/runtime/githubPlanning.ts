export interface GitHubPlanDashboardItem {
  approvalStatus: string;
  branchNameSuggestion: string;
  commitMessageSuggestion: string;
  id: string;
  linkedEngineeringBlocker: string;
  linkedExecutivePriority: string;
  linkedTask: string;
  planType: 'issue' | 'pr';
  releaseNoteSuggestion: string;
  title: string;
}

export interface GitHubPlanningDashboardSummary {
  archivedPlans: number;
  approvedLocalPlans: number;
  commands: string[];
  githubWritesEnabled: boolean;
  issuePlans: number;
  planRoot: string;
  plans: GitHubPlanDashboardItem[];
  plansNeedingReview: number;
  prPlans: number;
  queueHealth: string;
  rejectedLocalPlans: number;
  safetyLabels: string[];
  totalPlans: number;
}

export function buildDashboardGitHubPlanningSummary(): GitHubPlanningDashboardSummary {
  const plans: GitHubPlanDashboardItem[] = [
    {
      approvalStatus: 'needs_review',
      branchNameSuggestion: 'plan/review-engineering-backlog-warning',
      commitMessageSuggestion: 'Plan review for engineering backlog warning',
      id: 'dashboard-github-plan-engineering-warning',
      linkedEngineeringBlocker: 'engineering-warning-review',
      linkedExecutivePriority: 'executive-github-planning-review',
      linkedTask: 'phase34-smoke-task',
      planType: 'issue',
      releaseNoteSuggestion: 'Adds tracking for an Engineering warning after Executive review.',
      title: 'Issue plan: Review engineering backlog warning',
    },
    {
      approvalStatus: 'draft',
      branchNameSuggestion: 'feature/local-github-planning-follow-up',
      commitMessageSuggestion: 'Prepare local GitHub planning follow-up',
      id: 'dashboard-github-plan-local-follow-up',
      linkedEngineeringBlocker: 'engineering-readiness-review',
      linkedExecutivePriority: 'executive-review-local-plan',
      linkedTask: 'local-shared-task-placeholder',
      planType: 'pr',
      releaseNoteSuggestion: 'Prepares local planning notes for a future implementation review.',
      title: 'PR plan: Local GitHub planning follow-up',
    },
  ];

  return {
    archivedPlans: 0,
    approvedLocalPlans: 0,
    commands: [
      'npm run github:plans',
      'npm run github:create-plan',
      'npm run github:review-plan',
      'npm run github:archive-plan',
      'npm run github:plan-report',
      'npm run github:planning-validate',
    ],
    githubWritesEnabled: false,
    issuePlans: plans.filter((plan) => plan.planType === 'issue').length,
    planRoot: 'codex-agent-threads/shared/github-plans/',
    plans,
    plansNeedingReview: plans.filter((plan) => plan.approvalStatus === 'needs_review').length,
    prPlans: plans.filter((plan) => plan.planType === 'pr').length,
    queueHealth: 'Needs Review',
    rejectedLocalPlans: 0,
    safetyLabels: ['Local only', 'No issue creation', 'No PR creation', 'No commits', 'No branches', 'No GitHub write endpoints'],
    totalPlans: plans.length,
  };
}
