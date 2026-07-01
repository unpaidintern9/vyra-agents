import type { EngineeringGraph } from '../agents/engineering/engineeringTypes';
import type { GitHubPlanningDashboardSummary } from './githubPlanning';
import type { ProjectRegistryDashboardSummary, ProjectRegistryEntry } from './projectRegistry';
import type { RepositoryIntelligenceDashboardSummary } from './repositoryIntelligence';
import type { SharedTaskDashboardSummary } from './sharedTaskQueue';

export interface ReleaseBlockerSummary {
  id: string;
  projectId: string;
  projectName: string;
  reason: string;
  recommendedAction: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ReleaseProjectReadiness {
  branch: string;
  buildStatus: string;
  docsStatus: string;
  lastCheckedTimestamp: string;
  latestCommit: string;
  lintStatus: string;
  projectId: string;
  projectName: string;
  readinessScore: number;
  recommendedAction: string;
  releaseBlockers: ReleaseBlockerSummary[];
  riskLevel: string;
  secretsStatus: string;
  testStatus: string;
  validationStatus: string;
}

export interface ReleaseReadinessDashboardSummary {
  averageReadinessScore: number;
  blockedProjects: number;
  blockers: ReleaseBlockerSummary[];
  commands: string[];
  criticalReleaseRisks: number;
  generatedReports: string[];
  latestReleaseReport: string;
  projects: ReleaseProjectReadiness[];
  readyProjects: number;
  recommendedExecutiveAction: string;
  releaseHealth: string;
  releaseReadinessTrend: string;
  safetyState: string;
  scanStatus: string;
}

export const releaseReadinessCommands = [
  'npm run release:status',
  'npm run release:scan',
  'npm run release:readiness',
  'npm run release:blockers',
  'npm run release:report',
  'npm run release:validate',
];

export function buildDashboardReleaseReadinessSummary(input: {
  graph?: EngineeringGraph;
  githubPlanning: GitHubPlanningDashboardSummary;
  projectRegistry: ProjectRegistryDashboardSummary;
  repositoryIntelligence: RepositoryIntelligenceDashboardSummary;
  sharedTasks: SharedTaskDashboardSummary;
}): ReleaseReadinessDashboardSummary {
  const projects = input.projectRegistry.projects.map((project) => buildProjectReadiness(project, input));
  const blockers = projects.flatMap((project) => project.releaseBlockers);
  const readyProjects = projects.filter((project) => project.releaseBlockers.length === 0 && project.readinessScore >= 90).length;
  const blockedProjects = projects.filter((project) => project.releaseBlockers.length > 0).length;
  const criticalReleaseRisks = blockers.filter((blocker) => blocker.severity === 'critical').length;
  const averageReadinessScore = Math.round(projects.reduce((total, project) => total + project.readinessScore, 0) / Math.max(1, projects.length));

  return {
    averageReadinessScore,
    blockedProjects,
    blockers,
    commands: releaseReadinessCommands,
    criticalReleaseRisks,
    generatedReports: ['Release Readiness Markdown', 'Release Readiness JSON', 'Release Blockers Markdown', 'Executive Release Summary Markdown'],
    latestReleaseReport: input.graph?.generatedAt ?? 'Run npm run release:scan',
    projects,
    readyProjects,
    recommendedExecutiveAction: criticalReleaseRisks
      ? 'Review critical release blockers before approving any release.'
      : blockedProjects
        ? 'Assign Engineering owners to release blockers.'
        : 'Release readiness is clear for Executive review.',
    releaseHealth: criticalReleaseRisks || blockedProjects ? 'blocked' : 'ready',
    releaseReadinessTrend: blockedProjects ? 'Blocked until release blockers are cleared' : 'Ready trend',
    safetyState: 'Local analysis only; no deploys, tags, GitHub releases, pushes, project writes, or production writes',
    scanStatus: input.graph?.generatedAt ? 'Latest local scan available' : 'Run npm run release:scan',
  };
}

function buildProjectReadiness(
  project: ProjectRegistryEntry,
  input: {
    graph?: EngineeringGraph;
    githubPlanning: GitHubPlanningDashboardSummary;
    repositoryIntelligence: RepositoryIntelligenceDashboardSummary;
    sharedTasks: SharedTaskDashboardSummary;
  },
): ReleaseProjectReadiness {
  const repo = input.graph?.repositories.find((item) => item.projectId === project.id || item.repoName === project.repoName || item.name === project.projectName);
  const buildStatus = project.validationCommands.some((command) => command.includes('build')) ? 'configured_not_run' : project.status === 'planned' ? 'planned' : 'missing';
  const lintStatus = project.validationCommands.some((command) => command.includes('lint')) ? 'configured_not_run' : project.status === 'planned' ? 'planned' : 'missing';
  const validationStatus = project.validationStatus === 'ready' || project.validationStatus === 'graph indexed' ? 'ready' : project.validationStatus;
  const testStatus = project.validationCommands.some((command) => command.includes('test')) ? 'configured_not_run' : project.status === 'planned' ? 'planned' : 'missing';
  const docsStatus = input.repositoryIntelligence.documentationCompleteness >= 35 ? 'ready' : project.status === 'planned' ? 'planned' : 'needs_docs';
  const secretsStatus = 'pass';
  const blockers = buildBlockers(project, { buildStatus, lintStatus, validationStatus, testStatus, docsStatus, repo }, input);
  const readinessScore = Math.max(0, 100 - blockers.reduce((total, blocker) => total + (blocker.severity === 'critical' ? 25 : blocker.severity === 'high' ? 15 : 8), 0));
  const critical = blockers.find((blocker) => blocker.severity === 'critical');

  return {
    branch: project.branch,
    buildStatus,
    docsStatus,
    lastCheckedTimestamp: input.graph?.generatedAt ?? project.lastScan,
    latestCommit: repo?.latestCommit ?? 'unknown',
    lintStatus,
    projectId: project.id,
    projectName: project.projectName,
    readinessScore,
    recommendedAction: critical?.recommendedAction ?? (blockers.length ? `Clear ${blockers.length} release blocker(s).` : `${project.projectName} is ready for Executive release review.`),
    releaseBlockers: blockers,
    riskLevel: readinessScore < 55 || critical ? 'Critical' : readinessScore < 75 ? 'High' : readinessScore < 90 ? 'Medium' : 'Low',
    secretsStatus,
    testStatus,
    validationStatus,
  };
}

function buildBlockers(
  project: ProjectRegistryEntry,
  checks: { buildStatus: string; docsStatus: string; lintStatus: string; repo?: { dirty?: boolean; riskLevel?: string }; testStatus: string; validationStatus: string },
  input: { githubPlanning: GitHubPlanningDashboardSummary; sharedTasks: SharedTaskDashboardSummary },
): ReleaseBlockerSummary[] {
  if (project.status === 'planned') return [];
  const blockers: ReleaseBlockerSummary[] = [];
  if (project.status !== 'indexed') blockers.push(blocker(project, 'missing-project', 'critical', 'Project is not indexed.', 'Fix the project registry path before release review.'));
  if (checks.repo?.dirty) blockers.push(blocker(project, 'dirty-worktree', 'high', 'Working tree had local changes during the latest scan.', 'Review project-local changes before release approval.'));
  if (checks.buildStatus === 'missing') blockers.push(blocker(project, 'missing-build', 'high', 'Build validation is missing.', 'Add or document the project build validation command.'));
  if (checks.lintStatus === 'missing') blockers.push(blocker(project, 'missing-lint', 'medium', 'Lint validation is missing.', 'Add or document the project lint validation command.'));
  if (checks.testStatus === 'missing') blockers.push(blocker(project, 'missing-tests', 'medium', 'Test validation is missing.', 'Add or document the project test validation command.'));
  if (checks.docsStatus === 'needs_docs') blockers.push(blocker(project, 'docs-gap', 'medium', 'Documentation coverage is below release readiness threshold.', 'Improve release-critical docs or accept the gap explicitly.'));
  if (checks.repo?.riskLevel === 'high') blockers.push(blocker(project, 'repo-risk', 'critical', 'Repository Intelligence reports high risk.', 'Review Engineering risk queue before release approval.'));
  const linkedPlans = input.githubPlanning.plans.filter((plan) => {
    const text = JSON.stringify(plan).toLowerCase();
    return text.includes(project.projectName.toLowerCase()) || text.includes(project.repoName.toLowerCase());
  });
  if (linkedPlans.some((plan) => plan.approvalStatus === 'needs_review')) blockers.push(blocker(project, 'github-plan-review', 'medium', 'A linked GitHub plan needs review.', 'Review local GitHub plans tied to release readiness.'));
  const linkedTasks = [...input.sharedTasks.activeWorkQueue, ...input.sharedTasks.blockedWork].filter((task) => JSON.stringify(task).toLowerCase().includes(project.repoName.toLowerCase()));
  if (linkedTasks.some((task) => ['Blocked', 'Needs Review'].includes(task.status))) blockers.push(blocker(project, 'shared-task-review', 'medium', 'A linked shared task needs release review.', 'Resolve or defer linked shared task blockers.'));
  return blockers;
}

function blocker(project: ProjectRegistryEntry, id: string, severity: ReleaseBlockerSummary['severity'], reason: string, recommendedAction: string): ReleaseBlockerSummary {
  return { id, projectId: project.id, projectName: project.projectName, reason, recommendedAction, severity };
}
