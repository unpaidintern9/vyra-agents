import type { GitHubPlanningDashboardSummary } from './githubPlanning';
import type { ReleaseBlockerSummary, ReleaseProjectReadiness, ReleaseReadinessDashboardSummary } from './releaseReadiness';
import type { SharedTaskDashboardSummary } from './sharedTaskQueue';

export type ShipPlanStatus = 'draft' | 'needs_review' | 'approved_to_prepare' | 'blocked' | 'rejected' | 'archived';

export interface ReleaseShipPlanEntry {
  blockers: ReleaseBlockerSummary[];
  branch: string;
  createdTimestamp: string;
  linkedGitHubPlans: string[];
  linkedTasks: string[];
  projectId: string;
  projectName: string;
  qaNotes: string[];
  readinessScore: number;
  recommendedShipDecision: string;
  releaseChecklist: { complete: boolean; label: string; required: boolean; status: string }[];
  requiredApprovals: string[];
  riskLevel: string;
  rollbackNotes: string[];
  shipPlanId: string;
  status: ShipPlanStatus;
  targetReleaseType: string;
}

export interface ReleaseShipPlanDashboardSummary {
  approvedPreparationPlans: number;
  blockedShipPlans: number;
  commands: string[];
  generatedReports: string[];
  highestRiskPlannedReleases: ReleaseShipPlanEntry[];
  latestShipPlanReport: string;
  localApprovalStatus: string;
  recommendedExecutiveDecision: string;
  releaseSafetyStatus: string;
  shipPlanQueue: ReleaseShipPlanEntry[];
  shipPlansNeedingReview: number;
  totalShipPlans: number;
}

export const releaseShipPlanCommands = [
  'npm run release:ship-plans',
  'npm run release:create-ship-plan',
  'npm run release:review-ship-plan',
  'npm run release:approve-ship-plan',
  'npm run release:reject-ship-plan',
  'npm run release:ship-plan-report',
  'npm run release:ship-plan-validate',
];

export function buildDashboardReleaseShipPlanSummary(input: {
  githubPlanning: GitHubPlanningDashboardSummary;
  releaseReadiness: ReleaseReadinessDashboardSummary;
  sharedTasks: SharedTaskDashboardSummary;
}): ReleaseShipPlanDashboardSummary {
  const shipPlanQueue = input.releaseReadiness.projects.map((project) => buildShipPlan(project, input)).sort(sortShipPlans);
  const blockedShipPlans = shipPlanQueue.filter((plan) => plan.status === 'blocked').length;
  const shipPlansNeedingReview = shipPlanQueue.filter((plan) => plan.status === 'needs_review').length;
  const approvedPreparationPlans = shipPlanQueue.filter((plan) => plan.status === 'approved_to_prepare').length;
  const highestRiskPlannedReleases = [...shipPlanQueue].sort((a, b) => riskRank(b.riskLevel) - riskRank(a.riskLevel) || a.readinessScore - b.readinessScore).slice(0, 5);

  return {
    approvedPreparationPlans,
    blockedShipPlans,
    commands: releaseShipPlanCommands,
    generatedReports: ['Ship Plan Markdown', 'Ship Plan JSON', 'Executive Ship Decision Summary Markdown', 'Blocked Ship Plan Report Markdown'],
    highestRiskPlannedReleases,
    latestShipPlanReport: input.releaseReadiness.latestReleaseReport,
    localApprovalStatus: approvedPreparationPlans ? 'approved_to_prepare_local_only' : blockedShipPlans ? 'blocked_local_only' : 'needs_review_local_only',
    recommendedExecutiveDecision: blockedShipPlans
      ? 'No-ship for blocked plans; assign Engineering owners to clear blockers.'
      : shipPlansNeedingReview
        ? 'Review ship plans before approving preparation.'
        : 'Approved preparation may proceed locally; release execution remains outside Vyra Agents.',
    releaseSafetyStatus: 'Local approval only; no deploys, tags, GitHub releases, pushes, project writes, production writes, or secrets output',
    shipPlanQueue,
    shipPlansNeedingReview,
    totalShipPlans: shipPlanQueue.length,
  };
}

function buildShipPlan(
  project: ReleaseProjectReadiness,
  input: { githubPlanning: GitHubPlanningDashboardSummary; sharedTasks: SharedTaskDashboardSummary },
): ReleaseShipPlanEntry {
  const linkedTasks = input.sharedTasks.activeWorkQueue
    .filter((task) => JSON.stringify(task).toLowerCase().includes(project.projectName.toLowerCase()))
    .map((task) => task.id);
  const linkedGitHubPlans = input.githubPlanning.plans
    .filter((plan) => JSON.stringify(plan).toLowerCase().includes(project.projectName.toLowerCase()))
    .map((plan) => plan.id);

  return {
    blockers: project.releaseBlockers,
    branch: project.branch,
    createdTimestamp: project.lastCheckedTimestamp,
    linkedGitHubPlans,
    linkedTasks,
    projectId: project.projectId,
    projectName: project.projectName,
    qaNotes: [
      `Verify build=${project.buildStatus}, lint=${project.lintStatus}, tests=${project.testStatus}, docs=${project.docsStatus}, secrets=${project.secretsStatus}.`,
      'Record manual QA evidence locally before any external release process.',
    ],
    readinessScore: project.readinessScore,
    recommendedShipDecision: recommendedShipDecision(project),
    releaseChecklist: [
      checklistItem('Build', project.buildStatus),
      checklistItem('Lint', project.lintStatus),
      checklistItem('Validation', project.validationStatus),
      checklistItem('Tests', project.testStatus),
      checklistItem('Docs', project.docsStatus),
      checklistItem('Secrets', project.secretsStatus),
      { label: 'Executive approval', status: project.releaseBlockers.length ? 'blocked' : 'needs_review', required: true, complete: false },
      { label: 'Rollback notes reviewed', status: 'needs_review', required: true, complete: false },
    ],
    requiredApprovals: requiredApprovals(project),
    riskLevel: project.riskLevel,
    rollbackNotes: [
      `Rollback notes for ${project.projectName} are local preparation notes only.`,
      'Before a real release, record previous deployed ref, migration reversibility, owner, and restore procedure.',
    ],
    shipPlanId: `ship-plan-${project.projectId}-${project.branch}`.replace(/[^a-zA-Z0-9:_-]+/g, '-'),
    status: derivedStatus(project),
    targetReleaseType: project.projectName.toLowerCase().includes('website') ? 'patch' : 'internal',
  };
}

function checklistItem(label: string, status: string) {
  return {
    complete: ['pass', 'ready', 'configured_not_run', 'not_required', 'planned'].includes(status),
    label,
    required: true,
    status,
  };
}

function requiredApprovals(project: ReleaseProjectReadiness) {
  const approvals = ['Executive approval', 'Engineering approval'];
  if (!project.projectName.toLowerCase().includes('agents')) approvals.push('QA approval');
  if (project.riskLevel === 'Critical' || project.releaseBlockers.some((blocker) => blocker.severity === 'critical')) approvals.push('Security/safety approval');
  return approvals;
}

function recommendedShipDecision(project: ReleaseProjectReadiness) {
  if (project.releaseBlockers.some((blocker) => ['critical', 'high'].includes(blocker.severity)) || project.readinessScore < 75) return 'no_ship';
  if (project.releaseBlockers.length || project.readinessScore < 90) return 'prepare_only_needs_review';
  return 'approved_to_prepare_candidate';
}

function derivedStatus(project: ReleaseProjectReadiness): ShipPlanStatus {
  if (project.releaseBlockers.some((blocker) => ['critical', 'high'].includes(blocker.severity)) || project.readinessScore < 75) return 'blocked';
  return 'needs_review';
}

function sortShipPlans(a: ReleaseShipPlanEntry, b: ReleaseShipPlanEntry) {
  return statusRank(a.status) - statusRank(b.status) || riskRank(b.riskLevel) - riskRank(a.riskLevel) || a.projectName.localeCompare(b.projectName);
}

function statusRank(status: ShipPlanStatus) {
  return { blocked: 0, needs_review: 1, approved_to_prepare: 2, draft: 3, rejected: 4, archived: 5 }[status] ?? 9;
}

function riskRank(risk: string) {
  const ranks: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1, Planned: 0 };
  return ranks[risk] ?? 0;
}
