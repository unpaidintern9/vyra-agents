import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGitHubPlanningStatus } from './github-planning-runtime.mjs';
import { buildProjectRegistry } from './project-registry-runtime.mjs';
import { buildRepositoryIntelligence } from './repository-intelligence-runtime.mjs';
import { buildSharedTaskStatus } from './shared-task-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const releaseReportRoot = path.join(repoRoot, 'reports/agents/release');

export const releaseCommands = ['release:status', 'release:scan', 'release:readiness', 'release:blockers', 'release:report', 'release:validate'];

export function buildReleaseReadiness(options = {}) {
  ensureReleaseDirectories();
  const generatedAt = new Date().toISOString();
  const projectRegistry = buildProjectRegistry();
  const repositoryIntelligence = safe(() => buildRepositoryIntelligence(), null);
  const sharedTasks = buildSharedTaskStatus();
  const githubPlanning = buildGitHubPlanningStatus();
  const projects = projectRegistry.projects.map((project) =>
    buildProjectReleaseReadiness(project, {
      generatedAt,
      githubPlanning,
      repositoryIntelligence,
      sharedTasks,
    }),
  );
  const summary = summarizeReleaseReadiness(projects);
  const blockers = projects.flatMap((project) => project.releaseBlockers.map((blocker) => ({ ...blocker, projectId: project.projectId, projectName: project.projectName })));
  return {
    title: 'Release Readiness Command Center',
    generatedAt,
    schemaVersion: 1,
    scanMode: options.scanMode ?? 'local-analysis-only',
    summary,
    projects,
    blockers,
    executiveSummary: buildExecutiveReleaseSummary(projects, blockers, summary),
    integrations: {
      projectRegistry: projectRegistry.configRoot,
      repositoryIntelligence: repositoryIntelligence?.sourceGraph ?? null,
      sharedTaskQueue: sharedTasks.taskRoot,
      githubPlanning: githubPlanning.planRoot,
    },
    safety: safetySummary(),
  };
}

export function getReleaseStatus() {
  const readiness = buildReleaseReadiness();
  return {
    title: 'Release Status',
    generatedAt: readiness.generatedAt,
    status: readiness.summary.releaseHealth,
    latestReleaseReport: latestReleaseReportLabel(readiness.generatedAt),
    summary: readiness.summary,
    projects: readiness.projects.map(statusRow),
    safety: readiness.safety,
  };
}

export function scanReleaseReadiness() {
  const readiness = buildReleaseReadiness({ scanMode: 'manual-local-scan' });
  const reports = writeReleaseReports(readiness);
  return {
    title: 'Release Readiness Scan',
    generatedAt: readiness.generatedAt,
    status: readiness.summary.releaseHealth,
    scannedProjects: readiness.projects.length,
    readyProjects: readiness.summary.readyProjects,
    blockedProjects: readiness.summary.blockedProjects,
    reports,
    safety: readiness.safety,
  };
}

export function getReleaseReadiness() {
  const readiness = buildReleaseReadiness();
  writeReport(releaseReportRoot, 'release-readiness', readiness);
  return readiness;
}

export function getReleaseBlockers() {
  const readiness = buildReleaseReadiness();
  const payload = {
    title: 'Release Blockers',
    generatedAt: readiness.generatedAt,
    summary: {
      totalBlockers: readiness.blockers.length,
      criticalBlockers: readiness.blockers.filter((blocker) => blocker.severity === 'critical').length,
      highBlockers: readiness.blockers.filter((blocker) => blocker.severity === 'high').length,
      blockedProjects: readiness.summary.blockedProjects,
    },
    blockers: readiness.blockers,
    safety: readiness.safety,
  };
  writeReport(releaseReportRoot, 'release-blockers', payload);
  return payload;
}

export function getReleaseReport() {
  const readiness = buildReleaseReadiness();
  return {
    reports: writeReleaseReports(readiness),
    ...readiness,
  };
}

export function validateReleaseReadiness() {
  ensureReleaseDirectories();
  const errors = [];
  let readiness = null;
  try {
    readiness = buildReleaseReadiness();
  } catch (error) {
    errors.push(error.message);
  }
  if (readiness && readiness.projects.length < 5) errors.push('release readiness must include required registered projects.');
  if (readiness && readiness.projects.some((project) => typeof project.readinessScore !== 'number')) errors.push('every project must include a numeric readiness score.');
  if (readiness && readiness.projects.some((project) => !Array.isArray(project.releaseBlockers))) errors.push('every project must include release blockers.');
  if (readiness && readiness.safety.deploysEnabled !== false) errors.push('release readiness must not enable deploys.');
  return {
    title: 'Release Readiness Validation',
    generatedAt: new Date().toISOString(),
    status: errors.length === 0 ? 'pass' : 'fail',
    commands: releaseCommands,
    errors,
    summary: readiness?.summary ?? null,
    safety: safetySummary(),
  };
}

function buildProjectReleaseReadiness(project, context) {
  const packageJson = safeJson(path.join(project.localPath || '', 'package.json'));
  const repo = (context.repositoryIntelligence?.repositories ?? []).find((item) => item.projectId === project.id || item.repoName === project.repoName || item.name === project.projectName);
  const relatedTasks = relatedSharedTasks(context.sharedTasks, project);
  const relatedPlans = relatedGitHubPlans(context.githubPlanning, project);
  const checks = buildChecks(project, packageJson, repo);
  const releaseBlockers = buildReleaseBlockers(project, checks, repo, relatedTasks, relatedPlans);
  const readinessScore = scoreReadiness(checks, releaseBlockers, project, repo);
  const riskLevel =
    project.projectType === 'future_project'
      ? 'Planned'
      : readinessScore < 55 || releaseBlockers.some((blocker) => blocker.severity === 'critical')
        ? 'Critical'
        : readinessScore < 75
          ? 'High'
          : readinessScore < 90
            ? 'Medium'
            : 'Low';
  return {
    projectId: project.id,
    projectName: project.projectName,
    branch: project.branch,
    latestCommit: project.latestCommit,
    buildStatus: checks.buildStatus,
    lintStatus: checks.lintStatus,
    validationStatus: checks.validationStatus,
    testStatus: checks.testStatus,
    docsStatus: checks.docsStatus,
    secretsStatus: checks.secretsStatus,
    releaseBlockers,
    riskLevel,
    readinessScore,
    recommendedAction: recommendedActionForProject(readinessScore, releaseBlockers, project),
    lastCheckedTimestamp: context.generatedAt,
    localPath: project.localPath,
    repoOwner: project.repoOwner,
    repoName: project.repoName,
    projectType: project.projectType,
    owningAgent: project.owningAgent,
    linkedSharedTasks: relatedTasks.map((task) => task.id),
    linkedGitHubPlans: relatedPlans.map((plan) => plan.id),
    checklist: [
      checkItem('Build', checks.buildStatus),
      checkItem('Lint', checks.lintStatus),
      checkItem('Validation', checks.validationStatus),
      checkItem('Tests', checks.testStatus),
      checkItem('Docs', checks.docsStatus),
      checkItem('Secrets', checks.secretsStatus),
    ],
  };
}

function buildChecks(project, packageJson, repo) {
  const scripts = packageJson?.scripts ?? {};
  const validationMissing = project.validation?.missingCommands ?? [];
  return {
    buildStatus: project.status === 'planned' ? 'planned' : scriptStatus(scripts, 'build', validationMissing),
    lintStatus: project.status === 'planned' ? 'planned' : scriptStatus(scripts, 'lint', validationMissing),
    validationStatus: project.status === 'indexed' && validationMissing.length === 0 ? 'ready' : project.status === 'planned' ? 'planned' : 'needs_review',
    testStatus: project.status === 'planned' ? 'planned' : scripts.test ? 'configured_not_run' : 'missing',
    docsStatus: repo ? (repo.health.documentationCoverage >= 35 ? 'ready' : 'needs_docs') : project.status === 'planned' ? 'planned' : 'unknown',
    secretsStatus: project.status === 'planned' ? 'planned' : trackedSecretFiles(project.localPath).length ? 'blocked_tracked_secret_file' : 'pass',
  };
}

function buildReleaseBlockers(project, checks, repo, relatedTasks, relatedPlans) {
  const blockers = [];
  if (project.status === 'planned') return blockers;
  if (project.status === 'missing_path') blockers.push(blocker('missing-path', 'critical', 'Project local path is missing.', 'Configure a local project path before release review.'));
  if (project.status === 'missing_git') blockers.push(blocker('missing-git', 'critical', 'Project is not a Git repository.', 'Point the registry at a Git checkout before release review.'));
  if (project.dirty) blockers.push(blocker('dirty-worktree', 'high', 'Working tree has local changes.', 'Review or commit project-local changes before release approval.'));
  if (checks.buildStatus === 'missing') blockers.push(blocker('missing-build', 'high', 'Build script is not configured.', 'Add or document the project build validation command.'));
  if (checks.lintStatus === 'missing') blockers.push(blocker('missing-lint', 'medium', 'Lint script is not configured.', 'Add or document the project lint validation command.'));
  if (checks.testStatus === 'missing') blockers.push(blocker('missing-tests', 'medium', 'Test script is not configured.', 'Add or document test coverage before release approval.'));
  if (checks.docsStatus === 'needs_docs') blockers.push(blocker('docs-gap', 'medium', 'Documentation coverage is below readiness threshold.', 'Improve release-critical docs or explicitly accept the doc gap.'));
  if (checks.secretsStatus !== 'pass' && checks.secretsStatus !== 'planned') blockers.push(blocker('secrets-risk', 'critical', 'Tracked secret-like files were detected.', 'Remove tracked secret files before release approval.'));
  if (repo?.health?.riskLevel === 'high') blockers.push(blocker('repo-risk', 'critical', 'Repository Intelligence reports high risk.', 'Review Engineering risk queue before release approval.'));
  relatedTasks
    .filter((task) => task.status === 'Blocked' || task.status === 'Needs Review')
    .slice(0, 3)
    .forEach((task) => blockers.push(blocker(`task-${task.id}`, task.status === 'Blocked' ? 'high' : 'medium', `Shared task needs release review: ${task.title}`, 'Resolve or explicitly defer the shared task.')));
  relatedPlans
    .filter((plan) => plan.approvalStatus === 'needs_review')
    .slice(0, 3)
    .forEach((plan) => blockers.push(blocker(`github-plan-${plan.id}`, 'medium', `GitHub plan needs release review: ${plan.title}`, 'Review the local GitHub plan before release approval.')));
  return blockers;
}

function summarizeReleaseReadiness(projects) {
  const releaseProjects = projects.filter((project) => project.projectType !== 'future_project');
  const readyProjects = releaseProjects.filter((project) => project.releaseBlockers.length === 0 && project.readinessScore >= 90).length;
  const blockedProjects = releaseProjects.filter((project) => project.releaseBlockers.length > 0).length;
  const needsReviewProjects = releaseProjects.filter((project) => project.releaseBlockers.length === 0 && project.readinessScore < 90).length;
  const criticalRisks = releaseProjects.reduce((total, project) => total + project.releaseBlockers.filter((blocker) => blocker.severity === 'critical').length, 0);
  const averageReadinessScore = Math.round(releaseProjects.reduce((total, project) => total + project.readinessScore, 0) / Math.max(1, releaseProjects.length));
  return {
    registeredProjects: projects.length,
    releaseProjects: releaseProjects.length,
    readyProjects,
    blockedProjects,
    needsReviewProjects,
    criticalRisks,
    averageReadinessScore,
    releaseReadinessTrend: blockedProjects > 0 ? 'Blocked until release blockers are cleared' : readyProjects > 0 ? 'Ready trend' : 'Needs scan',
    releaseHealth: criticalRisks > 0 || blockedProjects > 0 ? 'blocked' : needsReviewProjects > 0 ? 'needs_review' : 'ready',
    recommendedExecutiveAction: criticalRisks > 0 ? 'Review critical release blockers before approving any release.' : blockedProjects > 0 ? 'Assign Engineering owners to release blockers.' : 'Release readiness is clear for Executive review.',
  };
}

function buildExecutiveReleaseSummary(projects, blockers, summary) {
  return {
    projectsReadyToRelease: projects.filter((project) => project.releaseBlockers.length === 0 && project.readinessScore >= 90).map(statusRow),
    blockedReleases: projects.filter((project) => project.releaseBlockers.length > 0).map(statusRow),
    criticalReleaseRisks: blockers.filter((blocker) => blocker.severity === 'critical'),
    releaseReadinessTrend: summary.releaseReadinessTrend,
    recommendedExecutiveAction: summary.recommendedExecutiveAction,
  };
}

function writeReleaseReports(readiness) {
  return [
    writeReport(releaseReportRoot, 'release-readiness', readiness),
    writeReport(releaseReportRoot, 'release-blockers', {
      title: 'Release Blockers',
      generatedAt: readiness.generatedAt,
      summary: { totalBlockers: readiness.blockers.length, blockedProjects: readiness.summary.blockedProjects, criticalRisks: readiness.summary.criticalRisks },
      blockers: readiness.blockers,
      safety: readiness.safety,
    }),
    writeReport(releaseReportRoot, 'executive-release-summary', {
      title: 'Executive Release Summary',
      generatedAt: readiness.generatedAt,
      summary: readiness.summary,
      executiveSummary: readiness.executiveSummary,
      safety: readiness.safety,
    }),
  ].flat();
}

function statusRow(project) {
  return {
    projectId: project.projectId,
    projectName: project.projectName,
    branch: project.branch,
    latestCommit: project.latestCommit,
    readinessScore: project.readinessScore,
    riskLevel: project.riskLevel,
    blockers: project.releaseBlockers.length,
    recommendedAction: project.recommendedAction,
  };
}

function scoreReadiness(checks, blockers, project, repo) {
  if (project.status === 'planned') return 70;
  const penalties = [
    project.status !== 'indexed' ? 35 : 0,
    project.dirty ? 15 : 0,
    checks.buildStatus === 'missing' ? 15 : 0,
    checks.lintStatus === 'missing' ? 10 : 0,
    checks.testStatus === 'missing' ? 10 : 0,
    checks.docsStatus === 'needs_docs' ? 10 : 0,
    checks.secretsStatus !== 'pass' ? 30 : 0,
    repo?.health?.riskLevel === 'high' ? 20 : repo?.health?.riskLevel === 'medium' ? 10 : 0,
    blockers.filter((blocker) => blocker.severity === 'critical').length * 20,
    blockers.filter((blocker) => blocker.severity === 'high').length * 10,
  ];
  return Math.max(0, 100 - penalties.reduce((total, value) => total + value, 0));
}

function scriptStatus(scripts, scriptName, missingValidationCommands) {
  if (scripts[scriptName]) return 'configured_not_run';
  if (missingValidationCommands.some((command) => command.includes(`npm run ${scriptName}`))) return 'missing';
  return 'not_required';
}

function trackedSecretFiles(localPath) {
  if (!localPath || !existsSync(localPath)) return [];
  try {
    return execFileSync('git', ['ls-files'], { cwd: localPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n')
      .filter((file) => {
        const base = path.basename(file).toLowerCase();
        if (base.includes('example') || base.includes('template') || base.endsWith('.sample')) return false;
        return base === '.env' || /^\.env\./.test(base) || base.endsWith('.pem') || base.endsWith('.key');
      })
      .slice(0, 5);
  } catch {
    return [];
  }
}

function relatedSharedTasks(sharedTasks, project) {
  const tasks = [...(sharedTasks.activeWorkQueue ?? []), ...(sharedTasks.blockedWork ?? []), ...(sharedTasks.newestAssignments ?? [])];
  return tasks.filter((task) => JSON.stringify(task).toLowerCase().includes(project.repoName.toLowerCase()) || JSON.stringify(task).toLowerCase().includes(project.projectName.toLowerCase()));
}

function relatedGitHubPlans(githubPlanning, project) {
  return (githubPlanning.plans ?? []).filter((plan) => JSON.stringify(plan).toLowerCase().includes(project.repoName.toLowerCase()) || JSON.stringify(plan).toLowerCase().includes(project.projectName.toLowerCase()));
}

function checkItem(label, status) {
  return {
    label,
    status,
    ready: ['pass', 'ready', 'configured_not_run', 'not_required', 'planned'].includes(status),
  };
}

function blocker(id, severity, reason, recommendedAction) {
  return { id, severity, reason, recommendedAction };
}

function recommendedActionForProject(readinessScore, blockers, project) {
  const critical = blockers.find((item) => item.severity === 'critical');
  if (critical) return critical.recommendedAction;
  if (blockers.length) return `Clear ${blockers.length} release blocker(s) before approving ${project.projectName}.`;
  if (readinessScore < 90) return `Review ${project.projectName} checklist before release approval.`;
  return `${project.projectName} is ready for Executive release review.`;
}

function ensureReleaseDirectories() {
  mkdirSync(releaseReportRoot, { recursive: true });
}

function writeReport(directory, slug, payload) {
  mkdirSync(directory, { recursive: true });
  const stamp = payload.generatedAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const jsonPath = path.join(directory, `${stamp}-${slug}.json`);
  const mdPath = path.join(directory, `${stamp}-${slug}.md`);
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(mdPath, toMarkdown(payload));
  return [jsonPath, mdPath];
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title ?? 'Release Readiness Report'}`, ''];
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

function latestReleaseReportLabel(generatedAt) {
  return `${generatedAt.slice(0, 10)} local release readiness snapshot`;
}

function safeJson(filePath) {
  try {
    return existsSync(filePath) ? JSON.parse(readFileSync(filePath, 'utf8')) : null;
  } catch {
    return null;
  }
}

function safe(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function labelize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function safetySummary() {
  return {
    localAnalysisOnly: true,
    deploysEnabled: false,
    tagsReleases: false,
    createsGitHubReleases: false,
    pushesCommits: false,
    modifiesProjectFiles: false,
    productionWrites: false,
    secretsCommitted: false,
  };
}
