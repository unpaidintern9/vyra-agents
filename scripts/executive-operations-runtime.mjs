import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOperatorSnapshot } from './agent-operator-runtime.mjs';
import { buildConnectorReadinessStatus } from './connector-readiness-runtime.mjs';
import { buildEngineeringTaskCandidateSet } from './engineering-task-generator-runtime.mjs';
import { buildExecutiveAutomationStatus } from './executive-automation-runtime.mjs';
import { getEmailStatus } from './gmail-email-runtime.mjs';
import { buildGitHubPlanningStatus } from './github-planning-runtime.mjs';
import { buildProjectRegistry } from './project-registry-runtime.mjs';
import { buildReleaseReadiness } from './release-readiness-runtime.mjs';
import { buildShipPlanQueue } from './release-ship-plan-runtime.mjs';
import { buildRepositoryIntelligence } from './repository-intelligence-runtime.mjs';
import { buildSharedTaskStatus } from './shared-task-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const executiveOperationsReportRoot = path.join(repoRoot, 'reports/agents/executive');

export const executiveOperationsCommands = [
  'executive:briefing',
  'executive:kpis',
  'executive:operations',
  'executive:health',
  'executive:report',
  'executive:validate',
];

export function buildExecutiveOperationsCenter(options = {}) {
  ensureExecutiveOperationsDirectories();
  const generatedAt = new Date().toISOString();
  const operator = buildOperatorSnapshot(options);
  const sharedTasks = buildSharedTaskStatus();
  const projectRegistry = safe(() => buildProjectRegistry(), null);
  const repositoryIntelligence = safe(() => buildRepositoryIntelligence(), null);
  const engineeringTasks = safe(() => buildEngineeringTaskCandidateSet(), null);
  const releaseReadiness = safe(() => buildReleaseReadiness(), null);
  const shipPlans = safe(() => buildShipPlanQueue(), null);
  const githubPlanning = buildGitHubPlanningStatus();
  const connectorReadiness = buildConnectorReadinessStatus();
  const email = getEmailStatus();
  const automation = buildExecutiveAutomationStatus(options);
  const kpis = buildKpis({ automation, connectorReadiness, email, engineeringTasks, operator, projectRegistry, releaseReadiness, sharedTasks });
  const health = buildHealth({ automation, connectorReadiness, email, engineeringTasks, operator, projectRegistry, releaseReadiness, repositoryIntelligence, sharedTasks });
  const briefing = buildDailyBriefing({
    automation,
    connectorReadiness,
    email,
    engineeringTasks,
    generatedAt,
    githubPlanning,
    health,
    kpis,
    operator,
    projectRegistry,
    releaseReadiness,
    repositoryIntelligence,
    sharedTasks,
    shipPlans,
  });
  return {
    title: 'Executive Operations Center',
    generatedAt,
    schemaVersion: 1,
    dailyOperatingStatus: health.dailyOperatingStatus,
    organizationHealth: health.organizationHealth,
    engineeringHealth: health.engineeringHealth,
    salesHealth: health.salesHealth,
    projectHealth: health.projectHealth,
    releaseHealth: health.releaseHealth,
    communicationHealth: health.communicationHealth,
    taskHealth: health.taskHealth,
    automationHealth: health.automationHealth,
    connectorReadiness: health.connectorReadiness,
    overallExecutiveScore: health.overallExecutiveScore,
    kpis,
    briefing,
    operations: {
      priorities: briefing.todaysPriorities,
      risks: buildRisks({ automation, connectorReadiness, email, engineeringTasks, projectRegistry, releaseReadiness, repositoryIntelligence, sharedTasks, shipPlans }),
      releases: {
        readinessSummary: releaseReadiness?.summary ?? null,
        shipPlanSummary: shipPlans?.summary ?? null,
        blockedReleases: releaseReadiness?.executiveSummary?.blockedReleases ?? [],
      },
      projects: projectRegistry?.summary ?? null,
      engineering: engineeringTasks?.summary ?? null,
      sales: operator.sales,
      communications: {
        emailStatus: email.automationStatus,
        scheduledCommunications: scheduledEmailCount(email),
        sent: email.sentEmailCount,
        skipped: email.skippedEmailCount,
        failed: email.failedEmailCount,
      },
      automation: automation.automation,
      connectors: connectorReadiness.riskSummary,
      recommendedActions: briefing.recommendedNextActions,
    },
    integrations: {
      projectRegistry: projectRegistry?.configRoot ?? 'unavailable',
      repositoryIntelligence: repositoryIntelligence?.sourceGraph ?? 'unavailable',
      engineeringTaskGenerator: 'scripts/engineering-task-generator-runtime.mjs',
      sharedTaskQueue: sharedTasks.taskRoot,
      releaseReadiness: 'scripts/release-readiness-runtime.mjs',
      shipPlans: shipPlans?.shipPlans?.map((plan) => plan.shipPlanId) ?? [],
      githubPlanning: githubPlanning.planRoot,
      connectorReadiness: 'scripts/connector-readiness-runtime.mjs',
      gmailReporting: 'scripts/gmail-email-runtime.mjs',
      executiveAutomation: 'scripts/executive-automation-runtime.mjs',
      crossAgentGraph: 'operator snapshot cross-agent graph',
    },
    reports: ['Executive Daily Briefing Markdown', 'Executive KPI Report Markdown', 'Executive Operations Report Markdown', 'Executive Operations JSON'],
    safety: executiveOperationsSafety(),
  };
}

export function getExecutiveBriefing(options = {}) {
  const center = buildExecutiveOperationsCenter(options);
  const payload = {
    title: 'Executive Daily Briefing',
    generatedAt: center.generatedAt,
    briefing: center.briefing,
    kpis: center.kpis,
    health: healthSnapshot(center),
    safety: center.safety,
  };
  writeReport(executiveOperationsReportRoot, 'executive-daily-briefing', payload);
  return payload;
}

export function getExecutiveKpis(options = {}) {
  const center = buildExecutiveOperationsCenter(options);
  const payload = {
    title: 'Executive KPI Report',
    generatedAt: center.generatedAt,
    kpis: center.kpis,
    health: healthSnapshot(center),
    safety: center.safety,
  };
  writeReport(executiveOperationsReportRoot, 'executive-kpi-report', payload);
  return payload;
}

export function getExecutiveOperations(options = {}) {
  const center = buildExecutiveOperationsCenter(options);
  return center;
}

export function getExecutiveHealth(options = {}) {
  const center = buildExecutiveOperationsCenter(options);
  return {
    title: 'Executive Operations Health',
    generatedAt: center.generatedAt,
    health: healthSnapshot(center),
    overallExecutiveScore: center.overallExecutiveScore,
    alerts: center.briefing.blockedWork,
    recommendedNextActions: center.briefing.recommendedNextActions,
    safety: center.safety,
  };
}

export function getExecutiveOperationsReport(options = {}) {
  const center = buildExecutiveOperationsCenter(options);
  return {
    reports: writeExecutiveOperationsReports(center),
    ...center,
  };
}

export function validateExecutiveOperations(options = {}) {
  ensureExecutiveOperationsDirectories();
  const errors = [];
  let center = null;
  try {
    center = buildExecutiveOperationsCenter(options);
  } catch (error) {
    errors.push(error.message);
  }
  if (center && typeof center.overallExecutiveScore !== 'number') errors.push('overall executive score must be numeric.');
  if (center && !center.briefing?.todaysPriorities?.length) errors.push('daily briefing must include priorities.');
  if (center && !center.kpis?.openTasks && center.kpis.openTasks !== 0) errors.push('KPI model must include open tasks.');
  if (center && center.safety.deploymentsEnabled !== false) errors.push('Executive Operations must not enable deployments.');
  if (!existsSync(executiveOperationsReportRoot)) errors.push('executive operations report directory is missing.');
  return {
    title: 'Executive Operations Validation',
    generatedAt: new Date().toISOString(),
    status: errors.length === 0 ? 'pass' : 'fail',
    commands: executiveOperationsCommands,
    errors,
    summary: center ? healthSnapshot(center) : null,
    safety: executiveOperationsSafety(),
  };
}

function buildDailyBriefing(context) {
  const criticalEngineeringIssues = (context.engineeringTasks?.candidates ?? [])
    .filter((candidate) => candidate.recommendedPriority === 'Critical')
    .slice(0, 5)
    .map((candidate) => `${candidate.title}: ${candidate.reason}`);
  const criticalSalesOpportunities = [
    ...context.operator.sales.pipelineHighlights,
    `${context.operator.sales.organizationsRequiringReview} organization(s) need Executive sales review.`,
  ].slice(0, 5);
  const blockedWork = [
    context.sharedTasks.blockedTasks > 0 ? `${context.sharedTasks.blockedTasks} shared task(s) blocked.` : null,
    context.releaseReadiness?.summary?.blockedProjects > 0 ? `${context.releaseReadiness.summary.blockedProjects} release project(s) blocked.` : null,
    context.shipPlans?.summary?.blockedShipPlans > 0 ? `${context.shipPlans.summary.blockedShipPlans} ship plan(s) blocked.` : null,
    context.email.skippedEmailCount > 0 ? `${context.email.skippedEmailCount} email send(s) skipped safely.` : null,
  ].filter(Boolean);
  const overnightChanges = [
    `Repository Intelligence indexed ${context.repositoryIntelligence?.summary?.modules ?? 0} module(s) and ${context.repositoryIntelligence?.summary?.dependencyEdges ?? 0} dependency edge(s).`,
    `Executive automation has ${context.automation.automation.rulesTriggered} triggered rule(s).`,
    `Shared task queue has ${context.sharedTasks.openTasks} open task(s), ${context.sharedTasks.blockedTasks} blocked.`,
    `Release readiness is ${context.releaseReadiness?.summary?.releaseHealth ?? 'unknown'}.`,
  ];
  return {
    date: context.generatedAt.slice(0, 10),
    todaysPriorities: unique([
      ...context.operator.executive.priorities.slice(0, 8),
      context.health.overallExecutiveScore < 70 ? 'Review Executive Operations score before approving new work.' : null,
      context.shipPlans?.summary?.recommendedExecutiveDecision,
    ]),
    overnightChanges,
    blockedWork,
    criticalEngineeringIssues,
    criticalSalesOpportunities,
    releaseReadinessSummary: {
      releaseHealth: context.releaseReadiness?.summary?.releaseHealth ?? 'unknown',
      readyProjects: context.releaseReadiness?.summary?.readyProjects ?? 0,
      blockedProjects: context.releaseReadiness?.summary?.blockedProjects ?? 0,
      averageReadinessScore: context.releaseReadiness?.summary?.averageReadinessScore ?? 0,
      shipPlanDecision: context.shipPlans?.summary?.recommendedExecutiveDecision ?? 'No ship-plan summary available.',
    },
    pendingApprovals: {
      runtimeApprovals: context.operator.threadBridge.pendingApprovals ?? 0,
      taskReviewItems: context.sharedTasks.tasksRequiringExecutiveReview,
      githubPlansNeedingReview: context.githubPlanning.plansNeedingReview ?? 0,
      shipPlansNeedingReview: context.shipPlans?.summary?.shipPlansNeedingReview ?? 0,
    },
    scheduledCommunications: {
      scheduledEmailReports: scheduledEmailCount(context.email),
      draftsAwaitingSend: context.email.draftsAwaitingSend,
      deliveryStatus: emailDeliveryStatus(context.email),
    },
    recommendedNextActions: unique([
      context.automation.nextRecommendedAction,
      context.releaseReadiness?.summary?.recommendedExecutiveAction,
      context.shipPlans?.summary?.recommendedExecutiveDecision,
      context.sharedTasks.blockedTasks ? 'Open Operator and clear blocked shared tasks.' : null,
      context.connectorReadiness.blockedWriteActionCount ? 'Keep connector write actions blocked until explicit approvals exist.' : null,
    ]).slice(0, 8),
  };
}

function buildKpis({ automation, connectorReadiness, email, engineeringTasks, operator, projectRegistry, releaseReadiness, sharedTasks }) {
  const releaseProjects = Math.max(1, releaseReadiness?.summary?.releaseProjects ?? 1);
  const totalProjects = Math.max(1, projectRegistry?.summary?.registeredProjects ?? 1);
  return {
    openTasks: sharedTasks.openTasks,
    completedTasks: sharedTasks.totalTasks - sharedTasks.openTasks - sharedTasks.archivedTasks,
    blockedTasks: sharedTasks.blockedTasks,
    projectsOnTrack: projectRegistry?.summary ? Math.max(0, projectRegistry.summary.registeredProjects - projectRegistry.summary.blockedProjects) : 0,
    releaseReadinessPercent: Math.round(((releaseReadiness?.summary?.readyProjects ?? 0) / releaseProjects) * 100),
    engineeringHealthPercent: operator.engineering.repositoryHealthScore,
    salesPipelineHealth: salesPipelineHealth(operator.sales),
    automationSuccess: automation.automation.rulesTriggered === 0 ? 100 : Math.max(0, 100 - automation.triggeredRules.length * 8),
    emailDeliveryStatus: emailDeliveryStatus(email),
    connectorReadiness: Math.round(((connectorReadiness.readyTemplates ?? 0) / Math.max(1, connectorReadiness.connectorCount ?? 1)) * 100),
    projectsOnTrackPercent: Math.round((((projectRegistry?.summary?.registeredProjects ?? 0) - (projectRegistry?.summary?.blockedProjects ?? 0)) / totalProjects) * 100),
    scheduledCommunications: scheduledEmailCount(email),
    criticalEngineeringTasks: engineeringTasks?.summary?.criticalEngineeringTasks ?? 0,
  };
}

function buildHealth({ automation, connectorReadiness, email, engineeringTasks, operator, projectRegistry, releaseReadiness, repositoryIntelligence, sharedTasks }) {
  const engineeringScore = clamp(repositoryIntelligence?.summary?.engineeringHealthScore ?? operator.engineering.repositoryHealthScore);
  const salesScore = salesPipelineHealth(operator.sales);
  const projectScore = projectRegistry?.summary ? clamp(100 - projectRegistry.summary.blockedProjects * 12 - projectRegistry.summary.missingProjects * 20) : 50;
  const releaseScore = releaseReadiness?.summary?.averageReadinessScore ?? 0;
  const communicationScore = clamp(100 - email.failedEmailCount * 25 - email.skippedEmailCount * 10 - (email.automationStatus === 'enabled' ? 0 : 15));
  const taskScore = clamp(100 - sharedTasks.blockedTasks * 15 - sharedTasks.overdueTasks * 10 - sharedTasks.tasksRequiringExecutiveReview * 4);
  const automationScore = clamp(100 - automation.triggeredRules.length * 8 - automation.skippedOrBlockedActions.length * 10);
  const connectorScore = clamp(connectorReadiness.riskSummary.executiveRiskLevel === 'Watch' ? 75 : 90);
  const organizationScore = clamp(Math.round((salesScore + projectScore + taskScore + communicationScore) / 4));
  const overallExecutiveScore = clamp(Math.round((organizationScore + engineeringScore + salesScore + projectScore + releaseScore + communicationScore + taskScore + automationScore + connectorScore) / 9));
  return {
    dailyOperatingStatus: overallExecutiveScore < 60 ? 'attention' : overallExecutiveScore < 80 ? 'watch' : 'ready',
    organizationHealth: healthLabel(organizationScore),
    engineeringHealth: healthLabel(engineeringScore),
    salesHealth: healthLabel(salesScore),
    projectHealth: healthLabel(projectScore),
    releaseHealth: healthLabel(releaseScore),
    communicationHealth: healthLabel(communicationScore),
    taskHealth: healthLabel(taskScore),
    automationHealth: healthLabel(automationScore),
    connectorReadiness: healthLabel(connectorScore),
    overallExecutiveScore,
    scores: {
      organizationScore,
      engineeringScore,
      salesScore,
      projectScore,
      releaseScore,
      communicationScore,
      taskScore,
      automationScore,
      connectorScore,
    },
  };
}

function buildRisks({ automation, connectorReadiness, email, engineeringTasks, projectRegistry, releaseReadiness, repositoryIntelligence, sharedTasks, shipPlans }) {
  return [
    repositoryIntelligence?.summary?.repositoryRisk === 'High' ? 'Repository Intelligence reports high Engineering risk.' : null,
    (engineeringTasks?.summary?.criticalEngineeringTasks ?? 0) > 0 ? `${engineeringTasks.summary.criticalEngineeringTasks} critical Engineering task candidate(s).` : null,
    (projectRegistry?.summary?.blockedProjects ?? 0) > 0 ? `${projectRegistry.summary.blockedProjects} blocked registered project(s).` : null,
    (releaseReadiness?.summary?.blockedProjects ?? 0) > 0 ? `${releaseReadiness.summary.blockedProjects} blocked release project(s).` : null,
    (shipPlans?.summary?.blockedShipPlans ?? 0) > 0 ? `${shipPlans.summary.blockedShipPlans} blocked ship plan(s).` : null,
    sharedTasks.blockedTasks > 0 ? `${sharedTasks.blockedTasks} blocked shared task(s).` : null,
    email.failedEmailCount || email.skippedEmailCount ? `Email delivery needs review: ${email.failedEmailCount} failed, ${email.skippedEmailCount} skipped.` : null,
    automation.triggeredRules.length ? `${automation.triggeredRules.length} Executive automation rule(s) triggered.` : null,
    connectorReadiness.blockedWriteActionCount ? `${connectorReadiness.blockedWriteActionCount} connector write action(s) remain blocked.` : null,
  ].filter(Boolean);
}

function writeExecutiveOperationsReports(center) {
  const briefing = {
    title: 'Executive Daily Briefing',
    generatedAt: center.generatedAt,
    briefing: center.briefing,
    safety: center.safety,
  };
  const kpis = {
    title: 'Executive KPI Report',
    generatedAt: center.generatedAt,
    kpis: center.kpis,
    health: healthSnapshot(center),
    safety: center.safety,
  };
  const operations = {
    title: 'Executive Operations Report',
    generatedAt: center.generatedAt,
    dailyOperatingStatus: center.dailyOperatingStatus,
    overallExecutiveScore: center.overallExecutiveScore,
    operations: center.operations,
    safety: center.safety,
  };
  const files = [
    writeReport(executiveOperationsReportRoot, 'executive-daily-briefing', briefing, { json: false }),
    writeReport(executiveOperationsReportRoot, 'executive-kpi-report', kpis, { json: false }),
    writeReport(executiveOperationsReportRoot, 'executive-operations-report', operations, { json: false }),
  ].flat();
  const jsonPath = path.join(executiveOperationsReportRoot, `${stamp(center.generatedAt)}-executive-operations.json`);
  writeFileSync(jsonPath, `${JSON.stringify(center, null, 2)}\n`);
  return [...files, jsonPath];
}

function writeReport(directory, slug, payload, options = {}) {
  mkdirSync(directory, { recursive: true });
  const base = `${stamp(payload.generatedAt)}-${slug}`;
  const files = [];
  if (options.json !== false) {
    const jsonPath = path.join(directory, `${base}.json`);
    writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
    files.push(jsonPath);
  }
  const mdPath = path.join(directory, `${base}.md`);
  writeFileSync(mdPath, toMarkdown(payload));
  files.push(mdPath);
  return files;
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title ?? 'Executive Operations Report'}`, ''];
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

function healthSnapshot(center) {
  return {
    dailyOperatingStatus: center.dailyOperatingStatus,
    organizationHealth: center.organizationHealth,
    engineeringHealth: center.engineeringHealth,
    salesHealth: center.salesHealth,
    projectHealth: center.projectHealth,
    releaseHealth: center.releaseHealth,
    communicationHealth: center.communicationHealth,
    taskHealth: center.taskHealth,
    automationHealth: center.automationHealth,
    connectorReadiness: center.connectorReadiness,
    overallExecutiveScore: center.overallExecutiveScore,
  };
}

function salesPipelineHealth(sales) {
  const blockedPenalty = (sales.sharedTaskSignals?.blockedTasks ?? 0) * 10;
  const reviewPenalty = Math.min(25, (sales.organizationsRequiringReview ?? 0) * 3);
  return clamp(85 - blockedPenalty - reviewPenalty + Math.min(10, sales.followUpsDue ?? 0));
}

function emailDeliveryStatus(email) {
  if (email.failedEmailCount > 0) return 'failed_attempts_need_review';
  if (email.skippedEmailCount > 0) return 'skipped_safely';
  if (email.automationStatus !== 'enabled') return 'disabled_until_configured';
  return 'ready';
}

function scheduledEmailCount(email) {
  return email.scheduledReports ?? email.scheduledAutomatedEmails ?? 0;
}

function healthLabel(score) {
  return score < 60 ? 'attention' : score < 80 ? 'watch' : 'ready';
}

function executiveOperationsSafety() {
  return {
    localAnalysisOnly: true,
    deploymentsEnabled: false,
    githubWrites: false,
    crmWrites: false,
    stripeWrites: false,
    productionWrites: false,
    secretsCommitted: false,
  };
}

function ensureExecutiveOperationsDirectories() {
  mkdirSync(executiveOperationsReportRoot, { recursive: true });
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function safe(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function stamp(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function labelize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
