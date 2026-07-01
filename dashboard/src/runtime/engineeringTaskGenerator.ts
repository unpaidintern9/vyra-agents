import type { GitHubPlanningDashboardSummary } from './githubPlanning';
import type { ProjectRegistryDashboardSummary } from './projectRegistry';
import type { RepositoryIntelligenceDashboardSummary } from './repositoryIntelligence';
import type { SharedTaskDashboardSummary } from './sharedTaskQueue';

export type EngineeringTaskCategory =
  | 'bug fix'
  | 'refactor'
  | 'documentation'
  | 'test coverage'
  | 'dependency cleanup'
  | 'migration support'
  | 'sales blocker'
  | 'release readiness'
  | 'security/safety review';

export interface EngineeringTaskCandidate {
  approvalRequired: true;
  category: EngineeringTaskCategory;
  id: string;
  linkedExecutivePriority: string | null;
  linkedGitHubPlan: string | null;
  linkedRepoRisk: string | null;
  linkedSalesMigrationBlocker: string | null;
  linkedSharedTask: string | null;
  localOnly: true;
  reason: string;
  recommendedPriority: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
}

export interface EngineeringTaskGeneratorSummary {
  candidates: EngineeringTaskCandidate[];
  commands: string[];
  criticalEngineeringTasks: number;
  generatedTasks: number;
  highPriorityEngineeringTasks: number;
  linkedExecutivePriorities: number;
  linkedGitHubPlans: number;
  linkedRepoRisks: number;
  linkedSalesMigrationBlockers: number;
  migrationBlockingEngineeringTasks: number;
  projectSpecificEngineeringTasks: number;
  releaseReadinessTasks: number;
  safetyLabels: string[];
  salesBlockingEngineeringTasks: number;
  totalCandidates: number;
}

export function buildDashboardEngineeringTaskSummary(input: {
  githubPlanning: GitHubPlanningDashboardSummary;
  repositoryIntelligence: RepositoryIntelligenceDashboardSummary;
  projectRegistry?: ProjectRegistryDashboardSummary;
  sharedTasks: SharedTaskDashboardSummary;
}): EngineeringTaskGeneratorSummary {
  const candidates = dedupeCandidates([
    ...repoRiskCandidates(input.repositoryIntelligence),
    ...dependencyCandidates(input.repositoryIntelligence),
    ...documentationCandidates(input.repositoryIntelligence),
    ...githubPlanCandidates(input.githubPlanning),
    ...executiveReviewCandidates(input.repositoryIntelligence, input.githubPlanning, input.sharedTasks),
    ...blockedOpportunityCandidates(input.sharedTasks),
    ...projectRegistryCandidates(input.projectRegistry),
  ]);

  return {
    candidates,
    commands: engineeringTaskCommands,
    criticalEngineeringTasks: candidates.filter((candidate) => candidate.recommendedPriority === 'Critical').length,
    generatedTasks: candidates.length,
    highPriorityEngineeringTasks: candidates.filter((candidate) => candidate.recommendedPriority === 'High').length,
    linkedExecutivePriorities: candidates.filter((candidate) => candidate.linkedExecutivePriority).length,
    linkedGitHubPlans: candidates.filter((candidate) => candidate.linkedGitHubPlan).length,
    linkedRepoRisks: candidates.filter((candidate) => candidate.linkedRepoRisk).length,
    linkedSalesMigrationBlockers: candidates.filter((candidate) => candidate.linkedSalesMigrationBlocker).length,
    migrationBlockingEngineeringTasks: candidates.filter((candidate) => candidate.category === 'migration support').length,
    projectSpecificEngineeringTasks: candidates.filter((candidate) => candidate.id.includes('project-registry')).length,
    releaseReadinessTasks: candidates.filter((candidate) => candidate.category === 'release readiness').length,
    safetyLabels: ['Local candidates only', 'No shared task creation', 'No GitHub issues', 'No PRs', 'No code changes', 'No production writes'],
    salesBlockingEngineeringTasks: candidates.filter((candidate) => candidate.category === 'sales blocker').length,
    totalCandidates: candidates.length,
  };
}

export function defaultEngineeringTaskSummary(): EngineeringTaskGeneratorSummary {
  return {
    candidates: [],
    commands: engineeringTaskCommands,
    criticalEngineeringTasks: 0,
    generatedTasks: 0,
    highPriorityEngineeringTasks: 0,
    linkedExecutivePriorities: 0,
    linkedGitHubPlans: 0,
    linkedRepoRisks: 0,
    linkedSalesMigrationBlockers: 0,
    migrationBlockingEngineeringTasks: 0,
    projectSpecificEngineeringTasks: 0,
    releaseReadinessTasks: 0,
    safetyLabels: ['Local candidates only', 'No external actions'],
    salesBlockingEngineeringTasks: 0,
    totalCandidates: 0,
  };
}

function projectRegistryCandidates(projectRegistry?: ProjectRegistryDashboardSummary): EngineeringTaskCandidate[] {
  if (!projectRegistry) return [];
  return projectRegistry.projects
    .filter((project) => project.releaseReadiness === 'blocked' || ['missing_path', 'missing_git'].includes(project.status))
    .slice(0, 6)
    .map((project) =>
      candidate({
        id: `dashboard-engineering-task-project-registry-${project.id}`,
        title: `Review ${project.projectName} project readiness`,
        category: 'release readiness',
        recommendedPriority: project.status === 'indexed' ? 'High' : 'Critical',
        reason: `${project.projectName} is ${project.status} with release readiness ${project.releaseReadiness}.`,
        linkedRepoRisk: `${project.repoName}:${project.releaseReadiness}`,
        linkedExecutivePriority: 'multi-project-release-readiness',
      }),
    );
}

function repoRiskCandidates(repo: RepositoryIntelligenceDashboardSummary): EngineeringTaskCandidate[] {
  if (repo.repositoryRisk === 'Low' && repo.engineeringHealthScore >= 75) return [];
  return [
    candidate({
      id: 'dashboard-engineering-task-repository-risk',
      title: 'Triage repository risk from Repository Intelligence',
      category: repo.repositoryRisk === 'High' ? 'release readiness' : 'refactor',
      recommendedPriority: repo.repositoryRisk === 'High' ? 'Critical' : 'High',
      reason: `Repository risk is ${repo.repositoryRisk} with Engineering health ${repo.engineeringHealthScore}/100.`,
      linkedRepoRisk: repo.repositoryRisk,
      linkedExecutivePriority: 'repository-intelligence-risk',
    }),
  ];
}

function dependencyCandidates(repo: RepositoryIntelligenceDashboardSummary): EngineeringTaskCandidate[] {
  if (repo.dependencyHealth === 'Ready' && repo.orphanedModules === 0) return [];
  return [
    candidate({
      id: 'dashboard-engineering-task-dependency-cleanup',
      title: 'Review dependency and orphan module warnings',
      category: 'dependency cleanup',
      recommendedPriority: repo.orphanedModules > 50 ? 'High' : 'Medium',
      reason: `${repo.orphanedModules} orphaned module candidate(s), ${repo.dependencyEdges} dependency edge(s), dependency health ${repo.dependencyHealth}.`,
      linkedRepoRisk: repo.repositoryRisk,
    }),
  ];
}

function documentationCandidates(repo: RepositoryIntelligenceDashboardSummary): EngineeringTaskCandidate[] {
  if (repo.documentationCompleteness >= 35) return [];
  return [
    candidate({
      id: 'dashboard-engineering-task-documentation',
      title: 'Improve repository documentation coverage',
      category: 'documentation',
      recommendedPriority: repo.documentationCompleteness < 20 ? 'High' : 'Medium',
      reason: `Documentation completeness is ${repo.documentationCompleteness}%, below the local readiness target.`,
      linkedRepoRisk: repo.repositoryRisk,
    }),
  ];
}

function githubPlanCandidates(githubPlanning: GitHubPlanningDashboardSummary): EngineeringTaskCandidate[] {
  return githubPlanning.plans.slice(0, 6).map((plan) =>
    candidate({
      id: `dashboard-engineering-task-github-plan-${plan.id}`,
      title: `Review local GitHub ${plan.planType} plan`,
      category: plan.planType === 'pr' ? 'release readiness' : 'bug fix',
      recommendedPriority: plan.approvalStatus === 'needs_review' ? 'High' : 'Medium',
      reason: `${plan.title} is ${plan.approvalStatus.replace(/_/g, ' ')} and remains local until approved.`,
      linkedGitHubPlan: plan.id,
      linkedExecutivePriority: plan.linkedExecutivePriority,
      linkedSharedTask: plan.linkedTask,
    }),
  );
}

function executiveReviewCandidates(
  repo: RepositoryIntelligenceDashboardSummary,
  githubPlanning: GitHubPlanningDashboardSummary,
  sharedTasks: SharedTaskDashboardSummary,
): EngineeringTaskCandidate[] {
  if (!githubPlanning.plansNeedingReview && !sharedTasks.tasksRequiringExecutiveReview && repo.repositoryRisk === 'Low') return [];
  return [
    candidate({
      id: 'dashboard-engineering-task-executive-review',
      title: 'Prepare Engineering review queue for Executive',
      category: 'security/safety review',
      recommendedPriority: repo.repositoryRisk === 'High' ? 'Critical' : 'High',
      reason: `${githubPlanning.plansNeedingReview} GitHub plan(s), ${sharedTasks.tasksRequiringExecutiveReview} task(s), repository risk ${repo.repositoryRisk}.`,
      linkedExecutivePriority: 'engineering-review-queue',
      linkedRepoRisk: repo.repositoryRisk,
    }),
  ];
}

function blockedOpportunityCandidates(sharedTasks: SharedTaskDashboardSummary): EngineeringTaskCandidate[] {
  return sharedTasks.blockedWork
    .filter((task) => ['Sales', 'Migration'].includes(task.category) || /sales|migration|proposal/i.test(task.title))
    .map((task) =>
      candidate({
        id: `dashboard-engineering-task-blocker-${task.id}`,
        title: `Resolve blocker for ${task.title}`,
        category: task.category === 'Migration' || /migration/i.test(task.title) ? 'migration support' : 'sales blocker',
        recommendedPriority: task.priority === 'Critical' ? 'Critical' : 'High',
        reason: `${task.title} is ${task.status} for ${task.organization}.`,
        linkedSalesMigrationBlocker: task.id,
        linkedSharedTask: task.id,
      }),
    );
}

function candidate(
  input: Pick<EngineeringTaskCandidate, 'category' | 'id' | 'reason' | 'recommendedPriority' | 'title'> &
    Partial<Omit<EngineeringTaskCandidate, 'approvalRequired' | 'category' | 'id' | 'localOnly' | 'reason' | 'recommendedPriority' | 'title'>>,
): EngineeringTaskCandidate {
  return {
    approvalRequired: true,
    localOnly: true,
    linkedExecutivePriority: null,
    linkedGitHubPlan: null,
    linkedRepoRisk: null,
    linkedSalesMigrationBlocker: null,
    linkedSharedTask: null,
    ...input,
  };
}

function dedupeCandidates(candidates: EngineeringTaskCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.id)) return false;
    seen.add(candidate.id);
    return true;
  });
}

export const engineeringTaskCommands = [
  'npm run engineering:tasks',
  'npm run engineering:generate-tasks',
  'npm run engineering:task-report',
  'npm run engineering:validate',
];
