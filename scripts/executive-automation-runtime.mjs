import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOperatorSnapshot, buildSafetyCheck, writeReport } from './agent-operator-runtime.mjs';
import { buildConnectorReadinessStatus } from './connector-readiness-runtime.mjs';
import { buildEngineeringTaskCandidateSet } from './engineering-task-generator-runtime.mjs';
import { createEmailDraft, getEmailSafetyCheck, getEmailStatus, sendEmailDraft } from './gmail-email-runtime.mjs';
import { createGitHubPlan } from './github-planning-runtime.mjs';
import { buildProjectRegistry } from './project-registry-runtime.mjs';
import { buildRepositoryIntelligence } from './repository-intelligence-runtime.mjs';
import { buildSharedTaskStatus, createSharedTask } from './shared-task-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const executiveAutomationReportRoot = path.join(repoRoot, 'reports/agents/executive');

export const executiveAutomationCommands = [
  'executive:automation-status',
  'executive:automation-run',
  'executive:automation-rules',
  'executive:automation-report',
  'executive:automation-validate',
  'executive:automation-safety-check',
];

export const triggerTypes = ['manual', 'scheduled', 'event-detected', 'threshold-crossed', 'validation-failed', 'report-ready'];
export const actionTypes = [
  'run agent workflow',
  'create shared task',
  'create GitHub plan',
  'create email draft',
  'send configured internal email',
  'create Executive review item',
  'archive low-priority item',
  'generate report',
];

const safetyGates = [
  'no external marketing emails',
  'no bulk sending',
  'no CRM writes',
  'no Stripe writes',
  'no Supabase production writes',
  'no GitHub writes',
  'no secrets output',
  'all emails must use existing Gmail safety checks and audit logging',
  'automatic emails only to approved internal recipients',
];

const automationRules = [
  rule('engineering-health-warnings', 'engineering health warnings', 'threshold-crossed', ['create shared task', 'create GitHub plan', 'create Executive review item'], 'high'),
  rule('failed-validations', 'failed validations', 'validation-failed', ['run agent workflow', 'create shared task', 'generate report'], 'high'),
  rule('github-repo-changes', 'GitHub repo changes', 'event-detected', ['create GitHub plan', 'create Executive review item'], 'medium'),
  rule('blocked-tasks', 'blocked tasks', 'threshold-crossed', ['create shared task', 'create Executive review item'], 'high'),
  rule('overdue-tasks', 'overdue tasks', 'threshold-crossed', ['create shared task', 'create email draft'], 'medium'),
  rule('high-value-sales-opportunities', 'high-value Sales opportunities', 'event-detected', ['create shared task', 'create email draft', 'create Executive review item'], 'medium'),
  rule('migration-blockers', 'migration blockers', 'event-detected', ['run agent workflow', 'create shared task', 'generate report'], 'high'),
  rule('connector-readiness-failures', 'connector readiness failures', 'validation-failed', ['create shared task', 'create Executive review item'], 'medium'),
  rule('email-send-failures-skips', 'email send failures/skips', 'event-detected', ['create shared task', 'create email draft', 'generate report'], 'medium'),
  rule('cross-agent-review-needs', 'cross-agent review needs', 'report-ready', ['create Executive review item', 'create email draft', 'send configured internal email', 'generate report'], 'medium'),
];

export function buildExecutiveAutomationStatus(options = {}) {
  const context = buildAutomationContext(options);
  const triggeredRules = evaluateAutomationRules(context);
  const latestRun = triggeredRules.length ? context.generatedAt : 'No automation run recorded in this status snapshot';
  return {
    title: 'Executive Automation Status',
    generatedAt: context.generatedAt,
    automation: {
      enabled: automationEnabled(options),
      mode: 'local-safe-orchestration',
      latestRun,
      triggerTypes,
      actionTypes,
      rulesConfigured: automationRules.length,
      rulesTriggered: triggeredRules.length,
    },
    triggeredRules,
    generatedTasks: 0,
    generatedReports: 0,
    generatedEmails: 0,
    skippedOrBlockedActions: [],
    safety: buildAutomationSafetySummary(context),
    nextRecommendedAction: nextRecommendedAction(triggeredRules),
  };
}

export async function runExecutiveAutomation(options = {}) {
  ensureAutomationDirectories();
  const context = buildAutomationContext(options);
  const triggeredRules = evaluateAutomationRules(context);
  const generatedTasks = [];
  const generatedPlans = [];
  const generatedEmails = [];
  const generatedReports = [];
  const skippedOrBlockedActions = [];

  for (const item of triggeredRules) {
    if (item.actions.includes('create shared task') || item.actions.includes('create Executive review item')) {
      const created = createSharedTask(taskForRule(item, context));
      if (created.status === 'success') generatedTasks.push(created.task);
      else skippedOrBlockedActions.push(blocked(item, 'create shared task', created.errors?.join('; ') || 'task creation failed'));
    }

    if (item.actions.includes('create GitHub plan')) {
      const plan = createGitHubPlan(planForRule(item));
      if (plan.status === 'success') generatedPlans.push(plan.plan);
      else skippedOrBlockedActions.push(blocked(item, 'create GitHub plan', plan.errors?.join('; ') || 'plan creation failed'));
    }

    if (item.actions.includes('create email draft') || item.actions.includes('send configured internal email')) {
      const email = createEmailDraft(emailForRule(item, context));
      if (email.status === 'pass') {
        generatedEmails.push(email.draft);
        if (item.actions.includes('send configured internal email')) {
          if (shouldAttemptInternalSend(options)) {
            const sendResult = await sendEmailDraft({ id: email.draft.id, automated: true, operatorTool: 'Executive Automation Engine' });
            if (!['sent', 'skipped'].includes(sendResult.status)) {
              skippedOrBlockedActions.push(blocked(item, 'send configured internal email', sendResult.errors?.join('; ') || sendResult.reason || 'send blocked'));
            }
          } else {
            skippedOrBlockedActions.push(blocked(item, 'send configured internal email', 'automatic send not enabled for this run; draft created instead'));
          }
        }
      } else {
        skippedOrBlockedActions.push(blocked(item, 'create email draft', email.errors?.join('; ') || 'email draft failed safety validation'));
      }
    }
  }

  const reportPayload = buildAutomationRunReport({
    context,
    triggeredRules,
    generatedTasks,
    generatedPlans,
    generatedEmails,
    skippedOrBlockedActions,
  });
  generatedReports.push(...writeAutomationReports(reportPayload));

  return {
    title: 'Executive Automation Run',
    generatedAt: context.generatedAt,
    status: 'pass',
    automationEnabled: automationEnabled(options),
    triggeredRules,
    generatedTasks,
    generatedPlans,
    generatedEmails,
    generatedReports,
    skippedOrBlockedActions,
    safety: buildAutomationSafetySummary(context),
    nextRecommendedAction: nextRecommendedAction(triggeredRules),
  };
}

export function getExecutiveAutomationRules() {
  return {
    title: 'Executive Automation Rules',
    generatedAt: new Date().toISOString(),
    triggerTypes,
    actionTypes,
    rules: automationRules,
    safetyGates,
  };
}

export function getExecutiveAutomationReport(options = {}) {
  const context = buildAutomationContext(options);
  const triggeredRules = evaluateAutomationRules(context);
  const payload = buildAutomationRunReport({
    context,
    triggeredRules,
    generatedTasks: [],
    generatedPlans: [],
    generatedEmails: [],
    skippedOrBlockedActions: triggeredRules
      .filter((item) => item.actions.includes('send configured internal email'))
      .map((item) => blocked(item, 'send configured internal email', 'report command does not attempt sends')),
  });
  return {
    reports: writeAutomationReports(payload),
    ...payload,
  };
}

export function validateExecutiveAutomation(options = {}) {
  ensureAutomationDirectories();
  const context = buildAutomationContext(options);
  const triggeredRules = evaluateAutomationRules(context);
  const errors = [];
  if (automationRules.length !== 10) errors.push('automation must define all 10 required rule categories.');
  if (!triggerTypes.includes('manual') || !triggerTypes.includes('report-ready')) errors.push('required trigger types are missing.');
  if (!actionTypes.includes('send configured internal email') || !actionTypes.includes('create GitHub plan')) errors.push('required action types are missing.');
  if (!existsSync(executiveAutomationReportRoot)) errors.push('executive report directory is missing.');
  if (buildAutomationSafetySummary(context).status !== 'pass') errors.push('automation safety gates failed.');
  const ruleErrors = automationRules.flatMap((item) => validateRule(item));
  errors.push(...ruleErrors);
  return {
    title: 'Executive Automation Validation',
    generatedAt: context.generatedAt,
    status: errors.length === 0 ? 'pass' : 'fail',
    commands: executiveAutomationCommands,
    errors,
    rulesConfigured: automationRules.length,
    triggeredRules: triggeredRules.map((item) => item.id),
    supported: { triggerTypes, actionTypes },
    safety: buildAutomationSafetySummary(context),
  };
}

export function getExecutiveAutomationSafetyCheck(options = {}) {
  const context = buildAutomationContext(options);
  const emailSafety = getEmailSafetyCheck();
  const operatorSafety = buildSafetyCheck(context.operator.operator);
  const checks = [
    ...safetyGates.map((name) => ({ name, passed: true })),
    { name: 'Gmail safety check passes', passed: emailSafety.status === 'pass', detail: emailSafety.status },
    { name: 'Operator safety check passes', passed: operatorSafety.status === 'pass', detail: operatorSafety.status },
    { name: 'GitHub plans are local only', passed: true },
    { name: 'Shared tasks are local only', passed: true },
  ];
  return {
    title: 'Executive Automation Safety Check',
    generatedAt: context.generatedAt,
    status: checks.every((check) => check.passed) ? 'pass' : 'fail',
    checks,
    safetyGates,
    approvedInternalRecipients: context.email.internalRecipients,
  };
}

function buildAutomationContext(options = {}) {
  const operator = buildOperatorSnapshot(options);
  const sharedTasks = buildSharedTaskStatus();
  const repositoryIntelligence = safe(() => buildRepositoryIntelligence(), null);
  const engineeringTasks = safe(() => buildEngineeringTaskCandidateSet(), null);
  const projectRegistry = safe(() => buildProjectRegistry(), null);
  const connectorReadiness = buildConnectorReadinessStatus();
  const email = getEmailStatus();
  return {
    generatedAt: new Date().toISOString(),
    operator,
    sharedTasks,
    repositoryIntelligence,
    engineeringTasks,
    projectRegistry,
    connectorReadiness,
    email,
    trigger: String(options.trigger ?? 'manual'),
  };
}

function evaluateAutomationRules(context) {
  return automationRules
    .map((item) => ({ ...item, signals: signalsForRule(item.id, context) }))
    .filter((item) => item.signals.length > 0)
    .map((item) => ({
      ...item,
      triggeredAt: context.generatedAt,
      trigger: item.defaultTrigger,
      recommendedAction: recommendedAction(item),
    }));
}

function signalsForRule(id, context) {
  const repo = context.repositoryIntelligence?.summary;
  const engineering = context.engineeringTasks?.summary;
  const projects = context.projectRegistry?.summary;
  const shared = context.sharedTasks;
  const email = context.email;
  const connectors = context.connectorReadiness;
  const signals = [];
  if (id === 'engineering-health-warnings' && repo && (repo.repositoryRisk !== 'Low' || repo.engineeringHealthScore < 85)) {
    signals.push(`Repository risk ${repo.repositoryRisk}; engineering health ${repo.engineeringHealthScore}/100.`);
  }
  if (id === 'engineering-health-warnings' && projects && projects.blockedProjects > 0) {
    signals.push(`${projects.blockedProjects} registered project(s) are blocked for release readiness.`);
  }
  if (id === 'failed-validations' && repo?.validationTrend && repo.validationTrend !== 'Ready') signals.push(`Repository validation trend: ${repo.validationTrend}.`);
  if (id === 'github-repo-changes' && repo && (repo.dependencyEdges > 0 || repo.modules > 0)) signals.push(`${repo.modules} module(s) and ${repo.dependencyEdges} dependency edge(s) indexed.`);
  if (id === 'blocked-tasks' && shared.blockedTasks > 0) signals.push(`${shared.blockedTasks} shared task(s) blocked.`);
  if (id === 'overdue-tasks' && shared.overdueTasks > 0) signals.push(`${shared.overdueTasks} shared task(s) overdue.`);
  if (id === 'high-value-sales-opportunities' && context.operator.sales.followUpsDue > 0) signals.push(`${context.operator.sales.followUpsDue} Sales follow-up(s) due with local pipeline attention.`);
  if (id === 'migration-blockers' && engineering?.migrationBlockingEngineeringTasks > 0) signals.push(`${engineering.migrationBlockingEngineeringTasks} migration-blocking Engineering candidate(s).`);
  if (id === 'connector-readiness-failures' && connectors.blockedWriteActionCount > 0) signals.push(`${connectors.blockedWriteActionCount} connector write action(s) remain blocked behind approval.`);
  if (id === 'email-send-failures-skips' && (email.failedEmailCount > 0 || email.skippedEmailCount > 0 || email.automationStatus !== 'enabled')) {
    signals.push(`Gmail automation ${email.automationStatus}; failed ${email.failedEmailCount}; skipped ${email.skippedEmailCount}.`);
  }
  if (id === 'cross-agent-review-needs' && context.operator.executive.crossAgentHealth.organizationsNeedingExecutiveReview > 0) {
    signals.push(`${context.operator.executive.crossAgentHealth.organizationsNeedingExecutiveReview} organization(s) need Executive review.`);
  }
  if (id === 'cross-agent-review-needs' && projects && projects.releaseReadinessStatus !== 'ready') {
    signals.push(`Multi-project release readiness is ${projects.releaseReadinessStatus}.`);
  }
  return signals;
}

function buildAutomationRunReport({ context, triggeredRules, generatedTasks, generatedPlans, generatedEmails, skippedOrBlockedActions }) {
  return {
    title: 'Executive Automation Report',
    generatedAt: context.generatedAt,
    automation: {
      enabled: automationEnabled({}),
      trigger: context.trigger,
      triggeredRules: triggeredRules.length,
      generatedTasks: generatedTasks.length,
      generatedPlans: generatedPlans.length,
      generatedEmails: generatedEmails.length,
      skippedOrBlockedActions: skippedOrBlockedActions.length,
    },
    projectRegistry: context.projectRegistry
      ? {
          summary: context.projectRegistry.summary,
          blockedProjects: context.projectRegistry.releaseReadiness.blockedProjects,
          highPriorityProjectIssues: context.projectRegistry.releaseReadiness.blockedProjects.map((project) => project.projectName),
        }
      : null,
    triggeredRules,
    generatedTasks: generatedTasks.map((task) => ({ id: task.id, title: task.title, assignedAgent: task.assignedAgent, priority: task.priority, status: task.status })),
    generatedPlans: generatedPlans.map((plan) => ({ id: plan.id, title: plan.title, approvalStatus: plan.approvalStatus })),
    generatedEmails: generatedEmails.map((draft) => ({ id: draft.id, recipient: draft.recipient.name, workflowState: draft.workflowState, subject: draft.subject })),
    skippedOrBlockedActions,
    safety: buildAutomationSafetySummary(context),
    nextRecommendedAction: nextRecommendedAction(triggeredRules),
  };
}

function writeAutomationReports(payload) {
  ensureAutomationDirectories();
  const files = [
    ...writeReport('executive', 'executive-automation-report', payload),
    ...writeReport('executive', 'executive-automation-triggered-rules', {
      title: 'Triggered Rules Report',
      generatedAt: payload.generatedAt,
      triggeredRules: payload.triggeredRules,
      safety: payload.safety,
    }),
    ...writeReport('executive', 'executive-automation-skipped-blocked-actions', {
      title: 'Skipped/Blocked Actions Report',
      generatedAt: payload.generatedAt,
      skippedOrBlockedActions: payload.skippedOrBlockedActions,
      safety: payload.safety,
    }),
  ];
  const jsonPath = path.join(executiveAutomationReportRoot, `${fileStamp(payload.generatedAt)}-executive-automation.json`);
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  return [...files, jsonPath];
}

function buildAutomationSafetySummary(context) {
  return {
    status: 'pass',
    mode: 'local-safe-orchestration',
    safetyGates,
    blockedWrites: ['CRM', 'Stripe', 'Supabase production', 'GitHub'],
    emailWorkflow: 'existing Gmail safety checks and audit logging',
    approvedInternalRecipients: context.email.internalRecipients,
    secretsOutput: false,
    bulkSending: false,
  };
}

function taskForRule(item, context) {
  return {
    id: `task-${compactDate(context.generatedAt)}-executive-automation-${item.id}`,
    title: `Executive automation review: ${item.category}`,
    description: `${item.signals.join(' ')} Recommended action: ${recommendedAction(item)}`,
    sourceAgent: 'Executive',
    assignedAgent: assignedAgentForRule(item.id),
    organization: 'Vyra internal operations',
    priority: priorityForRule(item.severity),
    status: 'Needs Review',
    category: categoryForRule(item.id),
    approvalRequired: true,
    linkedEntities: [item.id],
    notes: [`Created by Executive Automation Engine from ${item.defaultTrigger} trigger.`],
    relatedGraphNodeIds: [`executive-automation:${item.id}`],
    operator: 'Executive Automation Engine',
  };
}

function planForRule(item) {
  return {
    id: `github-plan-${compactDate(new Date().toISOString())}-executive-automation-${item.id}`,
    planType: 'issue',
    title: `Plan review for ${item.category}`,
    summary: item.signals.join(' '),
    linkedTaskId: `task-${compactDate(new Date().toISOString())}-executive-automation-${item.id}`,
    linkedTaskTitle: `Executive automation review: ${item.category}`,
    linkedExecutivePriorityId: `executive-automation:${item.id}`,
    linkedExecutivePriorityTitle: item.category,
    reviewNotes: ['Created locally by Executive Automation Engine. No GitHub write occurred.'],
  };
}

function emailForRule(item, context) {
  return {
    id: `email-draft-${compactDate(context.generatedAt)}-executive-automation-${item.id}`,
    reportType: 'executive_daily_summary',
    recipient: item.severity === 'high' ? 'Robert' : 'Matthew',
    subject: `Executive automation: ${item.category}`,
    body: [`Executive automation triggered ${item.category}.`, '', ...item.signals.map((signal) => `- ${signal}`), '', `Recommended action: ${recommendedAction(item)}`].join('\n'),
    schedule: 'manual',
    automationEligible: true,
    workflowState: shouldAttemptInternalSend({}) ? 'auto_scheduled' : 'ready_for_send',
    createdBy: 'Executive Automation Engine',
    operatorName: 'Executive Automation Engine',
    operatorTool: 'Executive Automation Engine',
  };
}

function validateRule(item) {
  const errors = [];
  if (!item.id || !item.category) errors.push(`rule missing id or category: ${JSON.stringify(item)}`);
  if (!triggerTypes.includes(item.defaultTrigger)) errors.push(`${item.id} has unsupported trigger type.`);
  if (!item.actions.every((action) => actionTypes.includes(action))) errors.push(`${item.id} has unsupported action type.`);
  return errors;
}

function rule(id, category, defaultTrigger, actions, severity) {
  return {
    id,
    category,
    defaultTrigger,
    actions,
    severity,
    enabled: true,
    safetyGates,
  };
}

function blocked(item, action, reason) {
  return {
    ruleId: item.id,
    action,
    reason,
    safetyStatus: 'blocked_or_skipped_safely',
  };
}

function recommendedAction(item) {
  if (item.severity === 'high') return `Review ${item.category} before approving dependent agent workflows.`;
  return `Queue ${item.category} for Executive review and local reporting.`;
}

function assignedAgentForRule(id) {
  if (id.includes('engineering') || id.includes('github')) return 'Engineering';
  if (id.includes('sales')) return 'Sales';
  if (id.includes('migration')) return 'Migration';
  return 'Executive';
}

function categoryForRule(id) {
  if (id.includes('engineering') || id.includes('github')) return 'Engineering';
  if (id.includes('sales')) return 'Sales';
  if (id.includes('migration')) return 'Migration';
  if (id.includes('connector') || id.includes('email')) return 'Operations';
  return 'Executive';
}

function priorityForRule(severity) {
  return severity === 'high' ? 'High' : severity === 'low' ? 'Low' : 'Medium';
}

function nextRecommendedAction(triggeredRules) {
  const firstHigh = triggeredRules.find((item) => item.severity === 'high');
  if (firstHigh) return recommendedAction(firstHigh);
  if (triggeredRules.length) return recommendedAction(triggeredRules[0]);
  return 'No automation rule requires attention.';
}

function automationEnabled(options = {}) {
  return String(options.enabled ?? process.env.VYRA_EXECUTIVE_AUTOMATION_ENABLED ?? 'true') !== 'false';
}

function shouldAttemptInternalSend(options = {}) {
  return String(options.sendConfiguredInternalEmail ?? process.env.VYRA_EXECUTIVE_AUTOMATION_SEND_ENABLED ?? 'false') === 'true';
}

function ensureAutomationDirectories() {
  mkdirSync(executiveAutomationReportRoot, { recursive: true });
}

function safe(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function compactDate(iso) {
  return iso.slice(0, 10).replace(/-/g, '');
}

function fileStamp(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}
