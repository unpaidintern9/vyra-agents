import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listSharedTasks } from './shared-task-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const githubPlanRoot = path.join(repoRoot, 'codex-agent-threads/shared/github-plans');
export const githubPlanArchiveRoot = path.join(githubPlanRoot, 'archive');
export const githubPlanReportRoot = path.join(repoRoot, 'reports/agents/runtime');

export const planTypes = ['issue', 'pr'];
export const approvalStatuses = ['draft', 'needs_review', 'approved_local', 'rejected_local', 'archived'];
export const githubPlanningCommands = [
  'github:plans',
  'github:create-plan',
  'github:review-plan',
  'github:archive-plan',
  'github:plan-report',
  'github:planning-validate',
];

const safety = {
  localOnly: true,
  githubWritesEnabled: false,
  createsIssue: false,
  createsPullRequest: false,
  pushesCommits: false,
  createsBranches: false,
  callsWriteEndpoints: false,
  productionWrites: false,
};

export function ensureGitHubPlanDirectories() {
  mkdirSync(githubPlanRoot, { recursive: true });
  mkdirSync(githubPlanArchiveRoot, { recursive: true });
  mkdirSync(githubPlanReportRoot, { recursive: true });
}

export function listGitHubPlans({ includeArchived = false } = {}) {
  ensureGitHubPlanDirectories();
  const roots = includeArchived ? [githubPlanRoot, githubPlanArchiveRoot] : [githubPlanRoot];
  return roots
    .flatMap((root) =>
      readdirSync(root)
        .filter((fileName) => fileName.endsWith('.json'))
        .sort()
        .map((fileName) => readPlanFile(path.join(root, fileName))),
    )
    .filter((item) => item.parsed);
}

export function buildGitHubPlanningStatus() {
  const plans = listGitHubPlans({ includeArchived: true }).map((item) => item.parsed);
  const activePlans = plans.filter((plan) => plan.approvalStatus !== 'archived');
  const reviewPlans = activePlans.filter((plan) => plan.approvalStatus === 'needs_review');
  const issuePlans = activePlans.filter((plan) => plan.planType === 'issue');
  const prPlans = activePlans.filter((plan) => plan.planType === 'pr');
  return {
    safetyMode: 'local/read-only/planning',
    planRoot: path.relative(repoRoot, githubPlanRoot),
    totalPlans: activePlans.length,
    archivedPlans: plans.length - activePlans.length,
    issuePlans: issuePlans.length,
    prPlans: prPlans.length,
    plansNeedingReview: reviewPlans.length,
    approvedLocalPlans: activePlans.filter((plan) => plan.approvalStatus === 'approved_local').length,
    rejectedLocalPlans: activePlans.filter((plan) => plan.approvalStatus === 'rejected_local').length,
    linkedTaskCount: activePlans.filter((plan) => plan.linkedTask?.id).length,
    linkedExecutivePriorityCount: activePlans.filter((plan) => plan.linkedExecutivePriority?.id).length,
    queueHealth: reviewPlans.length > 0 ? 'Needs Review' : activePlans.length > 0 ? 'Ready' : 'Clear',
    latestPlan: activePlans.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0] ?? null,
    reviewQueue: reviewPlans.slice(0, 8),
    plans: activePlans.slice(0, 12),
    safety,
  };
}

export function createGitHubPlan(options = {}) {
  ensureGitHubPlanDirectories();
  const now = new Date().toISOString();
  const task = resolveTask(options.taskId);
  const planType = normalizePlanType(options.planType);
  const title = options.title || buildTitle(planType, task);
  const summary = options.summary || buildSummary(planType, task);
  const plan = normalizePlan({
    id: options.id || `github-plan-${compactStamp(now)}-${slugify(title)}`,
    planType,
    title,
    summary,
    bodyMarkdown: options.bodyMarkdown || buildBodyMarkdown({ planType, title, summary, task, options }),
    branchNameSuggestion: options.branchNameSuggestion || buildBranchName(planType, title),
    commitMessageSuggestion: options.commitMessageSuggestion || buildCommitMessage(planType, title),
    releaseNoteSuggestion: options.releaseNoteSuggestion || buildReleaseNote(planType, title),
    linkedTask: task ? summarizeTask(task) : linkObject(options.linkedTaskId, options.linkedTaskTitle || 'Unlinked local task'),
    linkedEngineeringBlocker: linkObject(
      options.linkedEngineeringBlockerId || task?.relatedGraphNodeIds?.find((id) => String(id).includes('engineering')) || 'engineering-review',
      options.linkedEngineeringBlockerTitle || 'Engineering review before GitHub write approval',
    ),
    linkedExecutivePriority: linkObject(
      options.linkedExecutivePriorityId || (task?.approvalRequired ? `executive-review:${task.id}` : 'executive-github-planning-review'),
      options.linkedExecutivePriorityTitle || (task?.approvalRequired ? `Review ${task.title}` : 'Review local GitHub plan before any future write approval'),
    ),
    approvalStatus: options.approvalStatus || 'needs_review',
    reviewNotes: parseList(options.reviewNotes),
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    localOnly: true,
    safety,
  });
  const validation = validateGitHubPlan(plan);
  if (!validation.valid) return { status: 'fail', errors: validation.errors, plan };
  writePlan(plan);
  return { status: 'success', action: 'create_github_plan', plan, safety };
}

export function reviewGitHubPlan({ id, approvalStatus = 'needs_review', note = 'Reviewed locally. No GitHub write occurred.', operator = 'local operator' } = {}) {
  const existing = findPlan(id);
  if (!existing) return { status: 'fail', errors: [`GitHub plan not found: ${id}`] };
  const plan = normalizePlan({
    ...existing.parsed,
    approvalStatus: normalizeApprovalStatus(approvalStatus),
    updatedAt: new Date().toISOString(),
    reviewNotes: [
      ...(Array.isArray(existing.parsed.reviewNotes) ? existing.parsed.reviewNotes : []),
      { operator, note, timestamp: new Date().toISOString() },
    ],
  });
  const validation = validateGitHubPlan(plan);
  if (!validation.valid) return { status: 'fail', errors: validation.errors, plan };
  writePlan(plan);
  return { status: 'success', action: 'review_github_plan', plan, safety };
}

export function archiveGitHubPlan({ id, note = 'Archived locally. No GitHub write occurred.', operator = 'local operator' } = {}) {
  const existing = findPlan(id);
  if (!existing) return { status: 'fail', errors: [`GitHub plan not found: ${id}`] };
  const now = new Date().toISOString();
  const plan = normalizePlan({
    ...existing.parsed,
    approvalStatus: 'archived',
    archivedAt: now,
    updatedAt: now,
    reviewNotes: [
      ...(Array.isArray(existing.parsed.reviewNotes) ? existing.parsed.reviewNotes : []),
      { operator, note, timestamp: now },
    ],
  });
  const validation = validateGitHubPlan(plan);
  if (!validation.valid) return { status: 'fail', errors: validation.errors, plan };
  writeFileSync(path.join(githubPlanArchiveRoot, `${safeFileName(plan.id)}.json`), `${JSON.stringify(plan, null, 2)}\n`);
  if (existing.path.startsWith(githubPlanRoot) && !existing.path.startsWith(githubPlanArchiveRoot)) {
    try {
      renameSync(existing.path, path.join(githubPlanArchiveRoot, `${safeFileName(plan.id)}.json`));
      writeFileSync(path.join(githubPlanArchiveRoot, `${safeFileName(plan.id)}.json`), `${JSON.stringify(plan, null, 2)}\n`);
    } catch {
      writeFileSync(path.join(githubPlanArchiveRoot, `${safeFileName(plan.id)}.json`), `${JSON.stringify(plan, null, 2)}\n`);
    }
  }
  return { status: 'success', action: 'archive_github_plan', plan, safety };
}

export function getGitHubPlanningReport() {
  const status = buildGitHubPlanningStatus();
  const payload = {
    title: 'GitHub Planning Queue',
    generatedAt: new Date().toISOString(),
    status,
    plans: listGitHubPlans().map((item) => item.parsed),
    safety,
  };
  writePlanningReport('github-planning-queue', payload);
  writePlanningReport('github-plan-review', buildPlanReviewReport(status));
  return payload;
}

export function validateGitHubPlanningLayer() {
  ensureGitHubPlanDirectories();
  const examplePath = path.join(repoRoot, 'codex-agent-threads/shared/examples/github-plan.example.json');
  const exampleValidation = existsSync(examplePath)
    ? validateGitHubPlan(JSON.parse(readFileSync(examplePath, 'utf8')))
    : { valid: false, errors: ['missing GitHub plan example'] };
  const validations = listGitHubPlans({ includeArchived: true }).map((item) => ({
    file: path.relative(repoRoot, item.path),
    ...validateGitHubPlan(item.parsed),
  }));
  const safetyChecks = [
    { name: 'No GitHub issue creation', passed: true },
    { name: 'No GitHub PR creation', passed: true },
    { name: 'No commits pushed', passed: true },
    { name: 'No branches created', passed: true },
    { name: 'No GitHub write endpoints', passed: true },
    { name: 'Planning local only', passed: true },
  ];
  return {
    status: exampleValidation.valid && validations.every((item) => item.valid) && safetyChecks.every((check) => check.passed) ? 'pass' : 'fail',
    commands: githubPlanningCommands,
    directoriesReady: { plans: existsSync(githubPlanRoot), archive: existsSync(githubPlanArchiveRoot), reports: existsSync(githubPlanReportRoot) },
    supported: { planTypes, approvalStatuses },
    exampleValidation,
    validations,
    planningSummary: buildGitHubPlanningStatus(),
    safetyChecks,
    safety,
  };
}

export function validateGitHubPlan(plan) {
  const errors = [];
  if (!nonEmpty(plan?.id)) errors.push('id is required.');
  if (!planTypes.includes(plan?.planType)) errors.push(`planType must be one of: ${planTypes.join(', ')}.`);
  if (!nonEmpty(plan?.title)) errors.push('title is required.');
  if (!nonEmpty(plan?.summary)) errors.push('summary is required.');
  if (!nonEmpty(plan?.bodyMarkdown)) errors.push('bodyMarkdown is required.');
  if (!nonEmpty(plan?.branchNameSuggestion)) errors.push('branchNameSuggestion is required.');
  if (!nonEmpty(plan?.commitMessageSuggestion)) errors.push('commitMessageSuggestion is required.');
  if (!nonEmpty(plan?.releaseNoteSuggestion)) errors.push('releaseNoteSuggestion is required.');
  if (!plan?.linkedTask || !nonEmpty(plan.linkedTask.id)) errors.push('linkedTask.id is required.');
  if (!plan?.linkedEngineeringBlocker || !nonEmpty(plan.linkedEngineeringBlocker.id)) errors.push('linkedEngineeringBlocker.id is required.');
  if (!plan?.linkedExecutivePriority || !nonEmpty(plan.linkedExecutivePriority.id)) errors.push('linkedExecutivePriority.id is required.');
  if (!approvalStatuses.includes(plan?.approvalStatus)) errors.push(`approvalStatus must be one of: ${approvalStatuses.join(', ')}.`);
  if (!Array.isArray(plan?.reviewNotes)) errors.push('reviewNotes must be an array.');
  if (!nonEmpty(plan?.createdAt) || Number.isNaN(new Date(plan.createdAt).valueOf())) errors.push('createdAt must be an ISO date.');
  if (!nonEmpty(plan?.updatedAt) || Number.isNaN(new Date(plan.updatedAt).valueOf())) errors.push('updatedAt must be an ISO date.');
  if (plan?.archivedAt && Number.isNaN(new Date(plan.archivedAt).valueOf())) errors.push('archivedAt must be an ISO date or null.');
  if (plan?.localOnly !== true) errors.push('localOnly must be true.');
  if (plan?.safety?.githubWritesEnabled !== false) errors.push('githubWritesEnabled must be false.');
  if (plan?.safety?.createsIssue !== false) errors.push('createsIssue must be false.');
  if (plan?.safety?.createsPullRequest !== false) errors.push('createsPullRequest must be false.');
  if (plan?.safety?.pushesCommits !== false) errors.push('pushesCommits must be false.');
  if (plan?.safety?.createsBranches !== false) errors.push('createsBranches must be false.');
  return { valid: errors.length === 0, errors };
}

function findPlan(id) {
  if (!id) return null;
  return listGitHubPlans({ includeArchived: true }).find((item) => item.parsed.id === id) ?? null;
}

function resolveTask(taskId) {
  const tasks = listSharedTasks().map((item) => item.parsed);
  if (taskId) return tasks.find((task) => task.id === taskId) ?? null;
  return tasks.find((task) => task.status === 'Needs Review' || task.approvalRequired) ?? tasks[0] ?? null;
}

function normalizePlan(plan) {
  return {
    ...plan,
    planType: normalizePlanType(plan.planType),
    approvalStatus: normalizeApprovalStatus(plan.approvalStatus),
    linkedTask: plan.linkedTask || linkObject('unlinked-task', 'Unlinked local task'),
    linkedEngineeringBlocker: plan.linkedEngineeringBlocker || linkObject('engineering-review', 'Engineering review'),
    linkedExecutivePriority: plan.linkedExecutivePriority || linkObject('executive-review', 'Executive review'),
    reviewNotes: Array.isArray(plan.reviewNotes) ? plan.reviewNotes : parseList(plan.reviewNotes),
    localOnly: true,
    safety,
  };
}

function writePlan(plan) {
  writeFileSync(path.join(githubPlanRoot, `${safeFileName(plan.id)}.json`), `${JSON.stringify(plan, null, 2)}\n`);
}

function readPlanFile(filePath) {
  try {
    return {
      fileName: path.basename(filePath),
      path: filePath,
      parsed: JSON.parse(readFileSync(filePath, 'utf8')),
    };
  } catch (error) {
    return { fileName: path.basename(filePath), path: filePath, parsed: null, error: error.message };
  }
}

function buildPlanReviewReport(status) {
  return {
    title: 'GitHub Plan Review',
    generatedAt: new Date().toISOString(),
    plansNeedingReview: status.plansNeedingReview,
    reviewQueue: status.reviewQueue,
    safety,
  };
}

function writePlanningReport(slug, payload) {
  mkdirSync(githubPlanReportRoot, { recursive: true });
  const stamp = compactStamp(payload.generatedAt || new Date().toISOString());
  const base = `${stamp}-${slug}`;
  writeFileSync(path.join(githubPlanReportRoot, `${base}.json`), `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(path.join(githubPlanReportRoot, `${base}.md`), toMarkdown(payload));
}

function buildTitle(planType, task) {
  const prefix = planType === 'pr' ? 'PR plan' : 'Issue plan';
  return task?.title ? `${prefix}: ${task.title}` : `${prefix}: Review local engineering work`;
}

function buildSummary(planType, task) {
  const target = planType === 'pr' ? 'pull request' : 'issue';
  return task
    ? `Prepare a local ${target} plan for shared task ${task.id}.`
    : `Prepare a local ${target} plan for Engineering review.`;
}

function buildBodyMarkdown({ planType, title, summary, task, options }) {
  return [
    '## Summary',
    summary,
    '',
    '## Linked Work',
    `- Task: ${task?.id ?? options.linkedTaskId ?? 'unlinked-task'}`,
    `- Engineering blocker: ${options.linkedEngineeringBlockerId || task?.relatedGraphNodeIds?.find((id) => String(id).includes('engineering')) || 'engineering-review'}`,
    `- Executive priority: ${options.linkedExecutivePriorityId || (task?.approvalRequired ? `executive-review:${task.id}` : 'executive-github-planning-review')}`,
    '',
    '## Suggested GitHub Work',
    planType === 'pr' ? `Prepare PR notes for ${title}.` : `Prepare an issue draft for ${title}.`,
    '',
    '## Safety',
    'Local plan only. No GitHub issue, pull request, branch, commit, workflow dispatch, or repository write is performed.',
  ].join('\n');
}

function buildBranchName(planType, title) {
  const prefix = planType === 'pr' ? 'feature' : 'plan';
  return `${prefix}/${slugify(title).replace(/:/g, '-')}`.slice(0, 80);
}

function buildCommitMessage(planType, title) {
  const verb = planType === 'pr' ? 'Prepare' : 'Plan';
  return `${verb} ${title.replace(/^PR plan:\s*|^Issue plan:\s*/i, '')}`.slice(0, 120);
}

function buildReleaseNote(planType, title) {
  const noun = planType === 'pr' ? 'implementation' : 'tracking';
  return `Adds local GitHub ${noun} plan for ${title.replace(/^PR plan:\s*|^Issue plan:\s*/i, '')}.`.slice(0, 180);
}

function summarizeTask(task) {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    assignedAgent: task.assignedAgent,
  };
}

function linkObject(id, title) {
  return { id: String(id || 'unlinked'), title: String(title || id || 'Unlinked') };
}

function normalizePlanType(value) {
  const match = planTypes.find((item) => item.toLowerCase() === String(value || '').toLowerCase());
  return match || 'issue';
}

function normalizeApprovalStatus(value) {
  const normalized = String(value || '').toLowerCase().replace(/[\s-]+/g, '_');
  const match = approvalStatuses.find((item) => item === normalized);
  return match || 'needs_review';
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      return [value];
    }
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title || 'GitHub Planning Report'}`, ''];
  Object.entries(payload)
    .filter(([key]) => key !== 'title')
    .forEach(([key, value]) => {
      lines.push(`## ${labelize(key)}`, '');
      if (Array.isArray(value)) {
        value.forEach((item) => lines.push(`- ${formatValue(item)}`));
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([childKey, child]) => lines.push(`- ${labelize(childKey)}: ${formatValue(child)}`));
      } else {
        lines.push(String(value ?? ''));
      }
      lines.push('');
    });
  return `${lines.join('\n').trim()}\n`;
}

function safeFileName(value) {
  return slugify(value).slice(0, 140);
}

function slugify(value) {
  return String(value || 'item')
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
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

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
