import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGitHubPlanningStatus } from './github-planning-runtime.mjs';
import { buildProjectRegistry } from './project-registry-runtime.mjs';
import { buildReleaseReadiness } from './release-readiness-runtime.mjs';
import { buildRepositoryIntelligence } from './repository-intelligence-runtime.mjs';
import { buildSharedTaskStatus } from './shared-task-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const engineeringTaskReportRoot = path.join(repoRoot, 'reports/agents/engineering');

export const engineeringTaskCommands = [
  'engineering:tasks',
  'engineering:generate-tasks',
  'engineering:task-report',
  'engineering:validate',
];

export const engineeringTaskCategories = [
  'bug fix',
  'refactor',
  'documentation',
  'test coverage',
  'dependency cleanup',
  'migration support',
  'sales blocker',
  'release readiness',
  'security/safety review',
];

const safety = {
  localOnly: true,
  createsSharedTasks: false,
  modifiesCode: false,
  createsGitHubIssues: false,
  createsPullRequests: false,
  productionWrites: false,
  externalWrites: false,
  secretsPrinted: false,
};

export function buildEngineeringTaskCandidateSet() {
  const repositoryIntelligence = buildRepositoryIntelligence();
  const githubPlanning = buildGitHubPlanningStatus();
  const projectRegistry = buildProjectRegistry();
  const releaseReadiness = buildReleaseReadiness();
  const sharedTasks = buildSharedTaskStatus();
  const candidates = dedupeCandidates([
    ...repositoryRiskCandidates(repositoryIntelligence),
    ...dependencyCandidates(repositoryIntelligence),
    ...orphanCandidates(repositoryIntelligence),
    ...documentationCandidates(repositoryIntelligence),
    ...validationCandidates(repositoryIntelligence),
    ...githubPlanCandidates(githubPlanning),
    ...executivePriorityCandidates(repositoryIntelligence, githubPlanning, sharedTasks),
    ...blockedOpportunityCandidates(sharedTasks),
    ...projectRegistryCandidates(projectRegistry),
    ...releaseBlockerCandidates(releaseReadiness),
  ]);
  const summary = summarizeCandidates(candidates);

  return {
    title: 'Engineering Task Candidates',
    generatedAt: new Date().toISOString(),
    schemaVersion: 1,
    summary,
    candidates,
    sources: {
      repositoryIntelligence: repositoryIntelligence.sourceGraph,
      projectRegistry: projectRegistry.configRoot,
      releaseReadiness: 'reports/agents/release',
      githubPlanning: githubPlanning.planRoot,
      sharedTasks: sharedTasks.taskRoot,
      executivePriorities: 'derived locally from repository, GitHub planning, and shared task signals',
    },
    supportedCategories: engineeringTaskCategories,
    safety,
  };
}

export function listEngineeringTaskCandidates() {
  const set = buildEngineeringTaskCandidateSet();
  return {
    status: 'ready',
    generatedAt: set.generatedAt,
    summary: set.summary,
    candidates: set.candidates.slice(0, 20),
    safety,
  };
}

export function generateEngineeringTaskCandidates() {
  const set = buildEngineeringTaskCandidateSet();
  writeEngineeringTaskReports(set);
  return {
    status: 'success',
    action: 'generate_engineering_task_candidates',
    summary: set.summary,
    reportsWritten: true,
    safety,
  };
}

export function getEngineeringTaskReport() {
  const set = buildEngineeringTaskCandidateSet();
  writeEngineeringTaskReports(set);
  return set;
}

export function validateEngineeringTaskGenerator() {
  const errors = [];
  let set = null;
  try {
    set = buildEngineeringTaskCandidateSet();
  } catch (error) {
    errors.push(error.message);
  }
  if (set && !Array.isArray(set.candidates)) errors.push('candidates must be an array.');
  if (set && set.candidates.some((candidate) => !engineeringTaskCategories.includes(candidate.category))) errors.push('all candidates must use a supported deterministic category.');
  if (set && set.candidates.some((candidate) => candidate.localOnly !== true)) errors.push('all candidates must be local only.');
  if (set && set.candidates.some((candidate) => candidate.createdSharedTask === true)) errors.push('candidate generation must not create shared tasks.');
  if (!existsSync(path.join(repoRoot, 'dashboard/public/engineering-graph.json'))) errors.push('repository graph is missing; run npm run repo:scan.');

  return {
    status: errors.length === 0 ? 'pass' : 'fail',
    generatedAt: new Date().toISOString(),
    commands: engineeringTaskCommands,
    supportedCategories: engineeringTaskCategories,
    errors,
    summary: set?.summary ?? null,
    safety,
  };
}

export function writeEngineeringTaskReports(set = buildEngineeringTaskCandidateSet()) {
  return [
    writeReport(engineeringTaskReportRoot, 'engineering-task-candidates', set),
    writeReport(engineeringTaskReportRoot, 'executive-engineering-task-summary', {
      title: 'Executive Engineering Task Summary',
      generatedAt: set.generatedAt,
      summary: set.summary,
      criticalCandidates: set.candidates.filter((candidate) => candidate.recommendedPriority === 'Critical'),
      salesBlockingCandidates: set.candidates.filter((candidate) => candidate.category === 'sales blocker'),
      migrationBlockingCandidates: set.candidates.filter((candidate) => candidate.category === 'migration support'),
      releaseReadinessCandidates: set.candidates.filter((candidate) => candidate.category === 'release readiness'),
      releaseBlockerCandidates: set.candidates.filter((candidate) => candidate.linkedReleaseBlocker),
      projectSpecificCandidates: set.candidates.filter((candidate) => candidate.linkedProjectId),
      safety,
    }),
  ].flat();
}

function releaseBlockerCandidates(releaseReadiness) {
  return (releaseReadiness.projects ?? [])
    .flatMap((project) =>
      project.releaseBlockers
        .filter((blocker) => ['critical', 'high'].includes(blocker.severity))
        .slice(0, 4)
        .map((blocker) =>
          candidate({
            id: `engineering-task:release-blocker:${slugify(project.projectId)}:${slugify(blocker.id)}`,
            title: `Resolve release blocker for ${project.projectName}`,
            category: 'release readiness',
            recommendedPriority: blocker.severity === 'critical' ? 'Critical' : 'High',
            reason: `${blocker.reason} ${blocker.recommendedAction}`,
            linkedProjectId: project.projectId,
            linkedReleaseBlocker: blocker.id,
            linkedRepoRisk: `${project.repoName}:${project.riskLevel}`,
            linkedGitHubPlan: project.linkedGitHubPlans[0] ?? null,
            linkedSharedTask: project.linkedSharedTasks[0] ?? null,
            linkedExecutivePriority: 'release-readiness-command-center',
            signals: [`releaseBlocker:${blocker.id}`, `severity:${blocker.severity}`, `readinessScore:${project.readinessScore}`],
          }),
        ),
    )
    .slice(0, 20);
}

function projectRegistryCandidates(projectRegistry) {
  return (projectRegistry.projects ?? [])
    .filter((project) => String(project.health?.releaseReadiness).toLowerCase() === 'blocked' || ['missing_path', 'missing_git'].includes(project.status))
    .slice(0, 12)
    .map((project) =>
      candidate({
        id: `engineering-task:project-registry:${slugify(project.id)}`,
        title: `Review ${project.projectName} project readiness`,
        category: 'release readiness',
        recommendedPriority: project.status === 'indexed' ? 'High' : 'Critical',
        reason: `${project.projectName} is ${project.status} with release readiness ${project.health?.releaseReadiness ?? 'unknown'}.`,
        linkedProjectId: project.id,
        linkedRepoRisk: `${project.repoName}:${project.health?.riskLevel ?? 'unknown'}`,
        linkedGraphNodeIds: [`project:${project.id}`],
        linkedExecutivePriority: 'multi-project-release-readiness',
        signals: [`projectStatus:${project.status}`, `releaseReadiness:${project.health?.releaseReadiness ?? 'unknown'}`],
      }),
    );
}

function repositoryRiskCandidates(intelligence) {
  return intelligence.repositories
    .filter((repo) => ['high', 'medium'].includes(String(repo.health.riskLevel).toLowerCase()) || repo.health.healthScore < 75)
    .map((repo) =>
      candidate({
        id: `engineering-task:repo-risk:${slugify(repo.name)}`,
        title: `Stabilize ${repo.name} repository risk`,
        category: repo.health.riskLevel === 'high' ? 'release readiness' : 'refactor',
        recommendedPriority: repo.health.riskLevel === 'high' ? 'Critical' : 'High',
        reason: `${repo.name} has ${repo.health.riskLevel} repository risk and health score ${repo.health.healthScore}/100.`,
        linkedRepoRisk: `${repo.name}:${repo.health.riskLevel}`,
        linkedGraphNodeIds: [repo.id],
        signals: [`health:${repo.health.healthScore}`, `risk:${repo.health.riskLevel}`, `warnings:${repo.health.engineeringWarnings.length}`],
      }),
    );
}

function dependencyCandidates(intelligence) {
  const items = [];
  if (intelligence.summary.dependencyHealth !== 'Ready' || intelligence.summary.circularDependencies > 0) {
    items.push(
      candidate({
        id: 'engineering-task:dependency-cleanup:repository-graph',
        title: 'Review repository dependency health',
        category: 'dependency cleanup',
        recommendedPriority: intelligence.summary.circularDependencies > 0 ? 'High' : 'Medium',
        reason: `Dependency health is ${intelligence.summary.dependencyHealth}; circular dependency count is ${intelligence.summary.circularDependencies}.`,
        linkedRepoRisk: intelligence.summary.repositoryRisk,
        linkedGraphNodeIds: intelligence.dependencyGraph.circularDependencies.flat().slice(0, 8),
        signals: [`dependencyHealth:${intelligence.summary.dependencyHealth}`, `dependencyEdges:${intelligence.summary.dependencyEdges}`],
      }),
    );
  }
  return items;
}

function orphanCandidates(intelligence) {
  if (intelligence.summary.orphanedModules === 0) return [];
  return [
    candidate({
      id: 'engineering-task:orphaned-modules:review',
      title: 'Review orphaned module candidates',
      category: 'refactor',
      recommendedPriority: intelligence.summary.orphanedModules > 50 ? 'High' : 'Medium',
      reason: `${intelligence.summary.orphanedModules} orphaned module candidate(s) were detected by local repository intelligence.`,
      linkedRepoRisk: intelligence.summary.repositoryRisk,
      linkedGraphNodeIds: intelligence.dependencyGraph.orphanedModules.slice(0, 10).map((module) => module.id),
      signals: [`orphanedModules:${intelligence.summary.orphanedModules}`],
    }),
  ];
}

function documentationCandidates(intelligence) {
  return intelligence.repositories
    .filter((repo) => repo.health.documentationCoverage < 35)
    .map((repo) =>
      candidate({
        id: `engineering-task:documentation:${slugify(repo.name)}`,
        title: `Improve ${repo.name} documentation coverage`,
        category: 'documentation',
        recommendedPriority: repo.health.documentationCoverage < 20 ? 'High' : 'Medium',
        reason: `${repo.name} documentation coverage is ${repo.health.documentationCoverage}%, below the local readiness threshold.`,
        linkedRepoRisk: `${repo.name}:${repo.health.riskLevel}`,
        linkedGraphNodeIds: [repo.id],
        signals: [`documentationCoverage:${repo.health.documentationCoverage}`],
      }),
    );
}

function validationCandidates(intelligence) {
  if (intelligence.sourceGraph?.generatedAt && intelligence.health.validationStatus) {
    return [];
  }
  return [
    candidate({
      id: 'engineering-task:validation:repo-intelligence',
      title: 'Run repository intelligence validation',
      category: 'test coverage',
      recommendedPriority: 'High',
      reason: 'Repository validation state is missing or stale.',
      linkedRepoRisk: intelligence.summary.repositoryRisk,
      signals: ['validation:missing'],
    }),
  ];
}

function githubPlanCandidates(githubPlanning) {
  return (githubPlanning.plans ?? []).slice(0, 12).map((plan) =>
    candidate({
      id: `engineering-task:github-plan:${slugify(plan.id)}`,
      title: `Review local GitHub ${plan.planType} plan: ${plan.title}`,
      category: plan.planType === 'pr' ? 'release readiness' : 'bug fix',
      recommendedPriority: plan.approvalStatus === 'needs_review' ? 'High' : 'Medium',
      reason: `GitHub ${plan.planType} plan ${plan.id} is ${String(plan.approvalStatus).replace(/_/g, ' ')} and needs local Engineering review before any future write approval.`,
      linkedGitHubPlan: plan.id,
      linkedExecutivePriority: plan.linkedExecutivePriority?.id,
      linkedSharedTask: plan.linkedTask?.id,
      signals: [`planType:${plan.planType}`, `approvalStatus:${plan.approvalStatus}`],
    }),
  );
}

function executivePriorityCandidates(intelligence, githubPlanning, sharedTasks) {
  const items = [];
  if (intelligence.summary.repositoryRisk !== 'Low') {
    items.push(
      candidate({
        id: 'engineering-task:executive-priority:repository-risk',
        title: 'Prepare Executive review for repository risk',
        category: 'security/safety review',
        recommendedPriority: intelligence.summary.repositoryRisk === 'High' ? 'Critical' : 'High',
        reason: `Executive summary should review ${intelligence.summary.repositoryRisk} repository risk before release planning.`,
        linkedExecutivePriority: 'repository-intelligence-risk',
        linkedRepoRisk: intelligence.summary.repositoryRisk,
        signals: [`repositoryRisk:${intelligence.summary.repositoryRisk}`, `engineeringHealth:${intelligence.summary.engineeringHealthScore}`],
      }),
    );
  }
  if ((githubPlanning.plansNeedingReview ?? 0) > 0 || (sharedTasks.tasksRequiringExecutiveReview ?? 0) > 0) {
    items.push(
      candidate({
        id: 'engineering-task:executive-priority:review-queue',
        title: 'Triage Engineering review queue',
        category: 'release readiness',
        recommendedPriority: 'High',
        reason: `${githubPlanning.plansNeedingReview ?? 0} GitHub plan(s) and ${sharedTasks.tasksRequiringExecutiveReview ?? 0} shared task(s) require local review.`,
        linkedExecutivePriority: 'engineering-review-queue',
        signals: [`githubPlansNeedingReview:${githubPlanning.plansNeedingReview ?? 0}`, `sharedTasksNeedingReview:${sharedTasks.tasksRequiringExecutiveReview ?? 0}`],
      }),
    );
  }
  return items;
}

function blockedOpportunityCandidates(sharedTasks) {
  const blocked = [...(sharedTasks.blockedWork ?? []), ...(sharedTasks.activeWorkQueue ?? [])].filter((task) => {
    const text = JSON.stringify(task).toLowerCase();
    return task.status === 'Blocked' || text.includes('blocker') || text.includes('blocked');
  });
  return blocked
    .filter((task) => ['Sales', 'Migration'].includes(task.category) || ['Sales', 'Migration'].includes(task.assignedAgent) || /sales|migration|proposal/i.test(task.title))
    .slice(0, 10)
    .map((task) =>
      candidate({
        id: `engineering-task:blocker:${slugify(task.id)}`,
        title: `Resolve Engineering blocker for ${task.title}`,
        category: task.category === 'Migration' || /migration/i.test(task.title) ? 'migration support' : 'sales blocker',
        recommendedPriority: task.priority === 'Critical' ? 'Critical' : 'High',
        reason: `Shared task ${task.id} is linked to ${task.category}/${task.assignedAgent} work and may block Sales or Migration progress.`,
        linkedSalesMigrationBlocker: task.id,
        linkedSharedTask: task.id,
        signals: [`taskStatus:${task.status}`, `taskPriority:${task.priority}`, `organization:${task.organization}`],
      }),
    );
}

function candidate(input) {
  return {
    approvalRequired: true,
    assignedAgent: 'Engineering',
    category: input.category,
    createdSharedTask: false,
    id: input.id,
    linkedExecutivePriority: input.linkedExecutivePriority ?? null,
    linkedGitHubPlan: input.linkedGitHubPlan ?? null,
    linkedGraphNodeIds: input.linkedGraphNodeIds ?? [],
    linkedProjectId: input.linkedProjectId ?? null,
    linkedReleaseBlocker: input.linkedReleaseBlocker ?? null,
    linkedRepoRisk: input.linkedRepoRisk ?? null,
    linkedSalesMigrationBlocker: input.linkedSalesMigrationBlocker ?? null,
    linkedSharedTask: input.linkedSharedTask ?? null,
    localOnly: true,
    reason: input.reason,
    recommendedPriority: input.recommendedPriority,
    signals: input.signals ?? [],
    sourceAgent: 'Engineering',
    status: 'candidate',
    title: input.title,
  };
}

function summarizeCandidates(candidates) {
  return {
    totalCandidates: candidates.length,
    generatedTasks: candidates.length,
    criticalEngineeringTasks: candidates.filter((candidate) => candidate.recommendedPriority === 'Critical').length,
    highPriorityEngineeringTasks: candidates.filter((candidate) => candidate.recommendedPriority === 'High').length,
    salesBlockingEngineeringTasks: candidates.filter((candidate) => candidate.category === 'sales blocker').length,
    migrationBlockingEngineeringTasks: candidates.filter((candidate) => candidate.category === 'migration support').length,
    projectSpecificEngineeringTasks: candidates.filter((candidate) => candidate.linkedProjectId).length,
    releaseBlockerEngineeringTasks: candidates.filter((candidate) => candidate.linkedReleaseBlocker).length,
    releaseReadinessTasks: candidates.filter((candidate) => candidate.category === 'release readiness').length,
    categoryCounts: countBy(candidates, 'category'),
    priorityCounts: countBy(candidates, 'recommendedPriority'),
    linkedRepoRisks: candidates.filter((candidate) => candidate.linkedRepoRisk).length,
    linkedGitHubPlans: candidates.filter((candidate) => candidate.linkedGitHubPlan).length,
    linkedExecutivePriorities: candidates.filter((candidate) => candidate.linkedExecutivePriority).length,
    linkedSalesMigrationBlockers: candidates.filter((candidate) => candidate.linkedSalesMigrationBlocker).length,
  };
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.id)) return false;
    seen.add(candidate.id);
    return true;
  });
}

function countBy(items, key) {
  return items.reduce((result, item) => {
    const value = String(item[key] ?? 'Unknown');
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});
}

function writeReport(directory, slug, payload) {
  mkdirSync(directory, { recursive: true });
  const stamp = compactStamp(payload.generatedAt || new Date().toISOString());
  const base = `${stamp}-${slug}`;
  const jsonPath = path.join(directory, `${base}.json`);
  const mdPath = path.join(directory, `${base}.md`);
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(mdPath, toMarkdown(payload));
  return [jsonPath, mdPath];
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title || 'Engineering Task Candidate Report'}`, ''];
  Object.entries(payload)
    .filter(([key]) => key !== 'title')
    .forEach(([key, value]) => appendMarkdownValue(lines, labelize(key), value, 2));
  return `${lines.join('\n').trim()}\n`;
}

function appendMarkdownValue(lines, title, value, level) {
  lines.push(`${'#'.repeat(level)} ${title}`, '');
  if (Array.isArray(value)) {
    value.forEach((item) => lines.push(`- ${formatValue(item)}`));
  } else if (typeof value === 'object' && value !== null) {
    Object.entries(value).forEach(([key, child]) => lines.push(`- ${labelize(key)}: ${formatValue(child)}`));
  } else {
    lines.push(String(value ?? ''));
  }
  lines.push('');
}

function compactStamp(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
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

function slugify(value) {
  return String(value || 'item')
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}
