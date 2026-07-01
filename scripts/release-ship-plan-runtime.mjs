import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGitHubPlanningStatus } from './github-planning-runtime.mjs';
import { buildReleaseReadiness, releaseReportRoot } from './release-readiness-runtime.mjs';
import { buildSharedTaskStatus } from './shared-task-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const shipPlanRoot = path.join(repoRoot, 'codex-agent-threads/shared/release-ship-plans');

export const shipPlanStatuses = ['draft', 'needs_review', 'approved_to_prepare', 'blocked', 'rejected', 'archived'];
export const shipPlanCommands = [
  'release:ship-plans',
  'release:create-ship-plan',
  'release:review-ship-plan',
  'release:approve-ship-plan',
  'release:reject-ship-plan',
  'release:ship-plan-report',
  'release:ship-plan-validate',
];

export function buildShipPlanQueue(options = {}) {
  ensureShipPlanDirectories();
  const generatedAt = new Date().toISOString();
  const readiness = buildReleaseReadiness();
  const sharedTasks = buildSharedTaskStatus();
  const githubPlanning = buildGitHubPlanningStatus();
  const storedPlans = readStoredShipPlans();
  const generatedPlans = readiness.projects
    .filter((project) => project.projectType !== 'future_project')
    .map((project) => {
      const stored = storedPlans.find((plan) => plan.projectId === project.projectId);
      return buildShipPlan(project, {
        generatedAt,
        githubPlanning,
        sharedTasks,
        stored,
        targetReleaseType: options.targetReleaseType,
      });
    });
  const externalStoredPlans = storedPlans.filter((plan) => !generatedPlans.some((generated) => generated.shipPlanId === plan.shipPlanId));
  const shipPlans = [...generatedPlans, ...externalStoredPlans].sort(sortShipPlans);
  const summary = summarizeShipPlans(shipPlans, generatedAt);
  return {
    title: 'Release Ship Plan Queue',
    generatedAt,
    schemaVersion: 1,
    summary,
    shipPlans,
    approvals: {
      localApprovalOnly: true,
      statuses: shipPlanStatuses,
      requiredApprovals: unique(shipPlans.flatMap((plan) => plan.requiredApprovals)),
    },
    integrations: {
      releaseReadiness: 'scripts/release-readiness-runtime.mjs',
      sharedTaskQueue: sharedTasks.taskRoot,
      githubPlanning: githubPlanning.planRoot,
      emailReports: 'Gmail email connector may draft internal reports only through existing safety gates',
    },
    safety: shipPlanSafetySummary(),
  };
}

export function listShipPlans(options = {}) {
  const queue = buildShipPlanQueue(options);
  return {
    title: 'Release Ship Plans',
    generatedAt: queue.generatedAt,
    summary: queue.summary,
    shipPlans: queue.shipPlans,
    commands: shipPlanCommands,
    safety: queue.safety,
  };
}

export function createShipPlan(options = {}) {
  const queue = buildShipPlanQueue(options);
  const selected = selectShipPlan(queue.shipPlans, options);
  if (!selected) {
    return {
      status: 'fail',
      generatedAt: queue.generatedAt,
      errors: ['No release project matched the requested ship plan options.'],
      safety: shipPlanSafetySummary(),
    };
  }
  const plan = {
    ...selected,
    targetReleaseType: String(options.targetReleaseType ?? selected.targetReleaseType),
    status: selected.blockers.length ? 'blocked' : 'needs_review',
    createdTimestamp: queue.generatedAt,
    updatedTimestamp: queue.generatedAt,
    approvalHistory: [
      {
        action: 'created',
        timestamp: queue.generatedAt,
        operator: String(options.operator ?? 'Release Ship Plan Workflow'),
        note: 'Local ship plan created from release readiness data. No deploy, tag, push, or GitHub release occurred.',
      },
    ],
  };
  writeShipPlan(plan);
  return {
    title: 'Create Release Ship Plan',
    status: 'success',
    generatedAt: queue.generatedAt,
    shipPlan: plan,
    safety: shipPlanSafetySummary(),
  };
}

export function reviewShipPlan(options = {}) {
  return transitionShipPlan(options, 'needs_review', 'review_requested', 'Ship plan moved to local Executive/Engineering review.');
}

export function approveShipPlan(options = {}) {
  const queue = buildShipPlanQueue(options);
  const selected = selectShipPlan(queue.shipPlans, options);
  if (!selected) return missingPlan(queue.generatedAt);
  if (selected.blockers.some((blocker) => ['critical', 'high'].includes(blocker.severity))) {
    const blockedPlan = transitionPlan(selected, 'blocked', 'approval_blocked', 'Approval to prepare is blocked until high or critical release blockers are cleared.', options, queue.generatedAt);
    writeShipPlan(blockedPlan);
    return {
      title: 'Approve Release Ship Plan',
      status: 'blocked',
      generatedAt: queue.generatedAt,
      errors: ['High or critical blockers prevent approved_to_prepare status.'],
      shipPlan: blockedPlan,
      safety: shipPlanSafetySummary(),
    };
  }
  return transitionShipPlan(options, 'approved_to_prepare', 'approved_to_prepare', 'Local approval allows preparation work only. It does not deploy, tag, push, or create a GitHub release.');
}

export function rejectShipPlan(options = {}) {
  return transitionShipPlan(options, 'rejected', 'rejected', String(options.note ?? 'Local ship plan rejected before release preparation.'));
}

export function getShipPlanReport(options = {}) {
  const queue = buildShipPlanQueue(options);
  return {
    reports: writeShipPlanReports(queue),
    ...queue,
  };
}

export function validateShipPlans() {
  ensureShipPlanDirectories();
  const errors = [];
  let queue = null;
  try {
    queue = buildShipPlanQueue();
  } catch (error) {
    errors.push(error.message);
  }
  if (queue && queue.shipPlans.length < 1) errors.push('ship plans must be generated from release readiness projects.');
  if (queue && queue.shipPlans.some((plan) => !shipPlanStatuses.includes(plan.status))) errors.push('ship plan has an unsupported status.');
  if (queue && queue.shipPlans.some((plan) => !plan.shipPlanId || !plan.projectId || !plan.recommendedShipDecision)) errors.push('ship plan model is missing required identity or decision fields.');
  if (queue && queue.shipPlans.some((plan) => !Array.isArray(plan.releaseChecklist) || !Array.isArray(plan.requiredApprovals))) errors.push('ship plan checklist and approvals must be arrays.');
  if (queue && queue.safety.deploysEnabled !== false || queue?.safety?.localApprovalOnly !== true) errors.push('ship plan safety must remain local-only and non-deploying.');
  return {
    title: 'Release Ship Plan Validation',
    generatedAt: new Date().toISOString(),
    status: errors.length === 0 ? 'pass' : 'fail',
    commands: shipPlanCommands,
    statuses: shipPlanStatuses,
    errors,
    summary: queue?.summary ?? null,
    safety: shipPlanSafetySummary(),
  };
}

function buildShipPlan(project, context) {
  const stored = context.stored ?? {};
  const blockers = project.releaseBlockers ?? [];
  const status = stored.status ?? derivedStatus(project);
  const createdTimestamp = stored.createdTimestamp ?? context.generatedAt;
  const linkedTasks = unique([...(project.linkedSharedTasks ?? []), ...linkedTaskIds(context.sharedTasks, project)]);
  const linkedGitHubPlans = unique([...(project.linkedGitHubPlans ?? []), ...linkedPlanIds(context.githubPlanning, project)]);
  return {
    shipPlanId: stored.shipPlanId ?? `ship-plan-${slugify(project.projectId)}-${slugify(project.branch)}`,
    projectId: project.projectId,
    projectName: project.projectName,
    branch: project.branch,
    targetReleaseType: stored.targetReleaseType ?? context.targetReleaseType ?? inferReleaseType(project),
    readinessScore: project.readinessScore,
    blockers,
    requiredApprovals: stored.requiredApprovals ?? requiredApprovals(project),
    releaseChecklist: stored.releaseChecklist ?? buildReleaseChecklist(project),
    rollbackNotes: stored.rollbackNotes ?? rollbackNotes(project),
    qaNotes: stored.qaNotes ?? qaNotes(project),
    riskLevel: project.riskLevel,
    recommendedShipDecision: recommendedShipDecision(project, blockers),
    linkedTasks,
    linkedGitHubPlans,
    createdTimestamp,
    updatedTimestamp: stored.updatedTimestamp ?? context.generatedAt,
    status,
    approvalHistory: stored.approvalHistory ?? [],
    recommendedAction: project.recommendedAction,
    localOnly: true,
  };
}

function buildReleaseChecklist(project) {
  const base = project.checklist ?? [];
  return [
    ...base.map((item) => ({
      label: item.label,
      status: item.status,
      required: true,
      complete: item.ready === true,
    })),
    {
      label: 'Executive approval',
      status: project.releaseBlockers.length ? 'blocked' : 'needs_review',
      required: true,
      complete: false,
    },
    {
      label: 'Rollback notes reviewed',
      status: 'needs_review',
      required: true,
      complete: false,
    },
    {
      label: 'QA notes reviewed',
      status: 'needs_review',
      required: true,
      complete: false,
    },
  ];
}

function rollbackNotes(project) {
  return [
    `Rollback is a preparation note for ${project.projectName}; this workflow never deploys, tags, pushes, or creates a release.`,
    `Before real release execution, record the currently deployed version, previous Git ref, data migration reversibility, and owner for ${project.branch}.`,
    project.releaseBlockers.length ? 'Do not prepare release execution until blockers are cleared or explicitly rejected from scope.' : 'No local blockers were detected by readiness; still verify rollback path manually.',
  ];
}

function qaNotes(project) {
  return [
    `Run configured validation commands for ${project.projectName} before any external release process.`,
    `Verify build=${project.buildStatus}, lint=${project.lintStatus}, tests=${project.testStatus}, docs=${project.docsStatus}, secrets=${project.secretsStatus}.`,
    'Record manual QA evidence locally; this workflow does not write into project repositories or production systems.',
  ];
}

function requiredApprovals(project) {
  const approvals = ['Executive approval', 'Engineering approval'];
  if (!['agent_runtime', 'internal_tool'].includes(project.projectType)) approvals.push('QA approval');
  if (project.riskLevel === 'Critical' || project.releaseBlockers.some((blocker) => blocker.severity === 'critical')) approvals.push('Security/safety approval');
  return approvals;
}

function recommendedShipDecision(project, blockers) {
  if (blockers.some((blocker) => ['critical', 'high'].includes(blocker.severity)) || project.readinessScore < 75) return 'no_ship';
  if (blockers.length || project.readinessScore < 90) return 'prepare_only_needs_review';
  return 'approved_to_prepare_candidate';
}

function derivedStatus(project) {
  if (project.releaseBlockers.some((blocker) => ['critical', 'high'].includes(blocker.severity)) || project.readinessScore < 75) return 'blocked';
  if (project.releaseBlockers.length || project.readinessScore < 90) return 'needs_review';
  return 'needs_review';
}

function inferReleaseType(project) {
  const type = String(project.projectType ?? '');
  if (type.includes('website')) return 'patch';
  if (type.includes('mobile') || type.includes('desktop') || type.includes('backend')) return 'minor';
  if (type.includes('agent')) return 'internal';
  return 'patch';
}

function summarizeShipPlans(shipPlans, generatedAt) {
  const needingReview = shipPlans.filter((plan) => plan.status === 'needs_review');
  const approved = shipPlans.filter((plan) => plan.status === 'approved_to_prepare');
  const blocked = shipPlans.filter((plan) => plan.status === 'blocked');
  const rejected = shipPlans.filter((plan) => plan.status === 'rejected');
  const archived = shipPlans.filter((plan) => plan.status === 'archived');
  const highestRiskPlannedReleases = [...shipPlans]
    .sort((a, b) => riskRank(b.riskLevel) - riskRank(a.riskLevel) || a.readinessScore - b.readinessScore)
    .slice(0, 5)
    .map((plan) => ({
      shipPlanId: plan.shipPlanId,
      projectName: plan.projectName,
      riskLevel: plan.riskLevel,
      readinessScore: plan.readinessScore,
      status: plan.status,
      recommendedShipDecision: plan.recommendedShipDecision,
    }));
  return {
    totalShipPlans: shipPlans.length,
    shipPlansNeedingReview: needingReview.length,
    approvedPreparationPlans: approved.length,
    blockedShipPlans: blocked.length,
    rejectedShipPlans: rejected.length,
    archivedShipPlans: archived.length,
    tasksLinked: unique(shipPlans.flatMap((plan) => plan.linkedTasks)).length,
    githubPlansLinked: unique(shipPlans.flatMap((plan) => plan.linkedGitHubPlans)).length,
    highestRiskPlannedReleases,
    recommendedExecutiveDecision: blocked.length
      ? 'No-ship for blocked plans; assign Engineering owners to clear blockers.'
      : needingReview.length
        ? 'Review ship plans before approving preparation.'
        : approved.length
          ? 'Approved preparation may proceed locally; release execution remains outside Vyra Agents.'
          : 'No ship plan needs Executive action.',
    latestShipPlanReport: `${generatedAt.slice(0, 10)} local ship plan snapshot`,
    localApprovalStatus: approved.length ? 'approved_to_prepare_local_only' : blocked.length ? 'blocked_local_only' : needingReview.length ? 'needs_review_local_only' : 'draft_local_only',
    releaseSafetyStatus: 'Local approval only; no deploys, tags, GitHub releases, pushes, project writes, production writes, or secrets output',
  };
}

function transitionShipPlan(options, nextStatus, action, note) {
  const queue = buildShipPlanQueue(options);
  const selected = selectShipPlan(queue.shipPlans, options);
  if (!selected) return missingPlan(queue.generatedAt);
  const plan = transitionPlan(selected, nextStatus, action, note, options, queue.generatedAt);
  writeShipPlan(plan);
  return {
    title: 'Release Ship Plan Status Update',
    status: 'success',
    generatedAt: queue.generatedAt,
    shipPlan: plan,
    safety: shipPlanSafetySummary(),
  };
}

function transitionPlan(plan, nextStatus, action, note, options, timestamp) {
  return {
    ...plan,
    status: nextStatus,
    updatedTimestamp: timestamp,
    approvalHistory: [
      ...(plan.approvalHistory ?? []),
      {
        action,
        timestamp,
        operator: String(options.operator ?? 'Release Ship Plan Workflow'),
        note,
      },
    ],
  };
}

function selectShipPlan(shipPlans, options = {}) {
  if (options.shipPlanId) return shipPlans.find((plan) => plan.shipPlanId === options.shipPlanId);
  if (options.projectId) return shipPlans.find((plan) => plan.projectId === options.projectId);
  if (options.projectName) return shipPlans.find((plan) => plan.projectName.toLowerCase() === String(options.projectName).toLowerCase());
  return shipPlans[0] ?? null;
}

function missingPlan(generatedAt) {
  return {
    title: 'Release Ship Plan Status Update',
    status: 'fail',
    generatedAt,
    errors: ['No ship plan matched the requested identifier.'],
    safety: shipPlanSafetySummary(),
  };
}

function linkedTaskIds(sharedTasks, project) {
  const textNeedles = [project.projectId, project.projectName, project.repoName].filter(Boolean).map((value) => String(value).toLowerCase());
  return [...(sharedTasks.activeWorkQueue ?? []), ...(sharedTasks.blockedWork ?? []), ...(sharedTasks.newestAssignments ?? [])]
    .filter((task) => textNeedles.some((needle) => JSON.stringify(task).toLowerCase().includes(needle)))
    .map((task) => task.id);
}

function linkedPlanIds(githubPlanning, project) {
  const textNeedles = [project.projectId, project.projectName, project.repoName].filter(Boolean).map((value) => String(value).toLowerCase());
  return (githubPlanning.plans ?? [])
    .filter((plan) => textNeedles.some((needle) => JSON.stringify(plan).toLowerCase().includes(needle)))
    .map((plan) => plan.id);
}

function readStoredShipPlans() {
  ensureShipPlanDirectories();
  return readdirSync(shipPlanRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && !entry.name.includes('.example.'))
    .flatMap((entry) => {
      try {
        return [JSON.parse(readFileSync(path.join(shipPlanRoot, entry.name), 'utf8'))];
      } catch {
        return [];
      }
    })
    .filter((plan) => plan && plan.shipPlanId);
}

function writeShipPlan(plan) {
  ensureShipPlanDirectories();
  const filePath = path.join(shipPlanRoot, `${slugify(plan.shipPlanId)}.json`);
  writeFileSync(filePath, `${JSON.stringify(plan, null, 2)}\n`);
  return filePath;
}

function writeShipPlanReports(queue) {
  return [
    writeReport(releaseReportRoot, 'ship-plan', queue),
    writeReport(releaseReportRoot, 'executive-ship-decision-summary', {
      title: 'Executive Ship Decision Summary',
      generatedAt: queue.generatedAt,
      summary: queue.summary,
      shipPlansNeedingReview: queue.shipPlans.filter((plan) => plan.status === 'needs_review'),
      approvedPreparationPlans: queue.shipPlans.filter((plan) => plan.status === 'approved_to_prepare'),
      highestRiskPlannedReleases: queue.summary.highestRiskPlannedReleases,
      recommendedExecutiveDecision: queue.summary.recommendedExecutiveDecision,
      safety: queue.safety,
    }),
    writeReport(releaseReportRoot, 'blocked-ship-plan-report', {
      title: 'Blocked Ship Plan Report',
      generatedAt: queue.generatedAt,
      summary: {
        blockedShipPlans: queue.summary.blockedShipPlans,
        highOrCriticalBlockers: queue.shipPlans.reduce((total, plan) => total + plan.blockers.filter((blocker) => ['critical', 'high'].includes(blocker.severity)).length, 0),
      },
      blockedShipPlans: queue.shipPlans.filter((plan) => plan.status === 'blocked'),
      safety: queue.safety,
    }),
  ].flat();
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
  const lines = [`# ${payload.title ?? 'Release Ship Plan Report'}`, ''];
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

function shipPlanSafetySummary() {
  return {
    localApprovalOnly: true,
    deploysEnabled: false,
    tagsReleases: false,
    createsGitHubReleases: false,
    pushesCommits: false,
    modifiesProjectFiles: false,
    productionWrites: false,
    secretsCommitted: false,
    githubWrites: false,
    crmWrites: false,
    stripeWrites: false,
    supabaseProductionWrites: false,
  };
}

function ensureShipPlanDirectories() {
  mkdirSync(shipPlanRoot, { recursive: true });
  mkdirSync(releaseReportRoot, { recursive: true });
  const keep = path.join(shipPlanRoot, '.gitkeep');
  if (!existsSync(keep)) writeFileSync(keep, '');
}

function sortShipPlans(a, b) {
  return statusRank(a.status) - statusRank(b.status) || riskRank(b.riskLevel) - riskRank(a.riskLevel) || a.projectName.localeCompare(b.projectName);
}

function statusRank(status) {
  return { blocked: 0, needs_review: 1, approved_to_prepare: 2, draft: 3, rejected: 4, archived: 5 }[status] ?? 9;
}

function riskRank(risk) {
  return { Critical: 4, High: 3, Medium: 2, Low: 1, Planned: 0 }[risk] ?? 0;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function labelize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function slugify(value) {
  return (
    String(value || 'item')
      .toLowerCase()
      .replace(/[^a-z0-9:_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  );
}
