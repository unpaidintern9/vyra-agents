import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSharedMemoryStore } from './shared-memory-runtime.mjs';
import { buildSharedTaskStatus } from './shared-task-runtime.mjs';
import { getSalesStatus, listSalesWorkflows } from './sales-agent-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const executivePlanningRoot = path.join(repoRoot, 'codex-agent-threads/shared/executive-planning');
export const executivePlanningReportRoot = path.join(repoRoot, 'reports/agents/executive-planning');

export const goalCategories = ['revenue', 'sales', 'product', 'engineering', 'marketing', 'operations', 'finance', 'compliance', 'contracting', 'customer success', 'executive', 'general'];
export const goalStatuses = ['draft', 'active', 'at_risk', 'blocked', 'review', 'completed', 'paused', 'archived'];
export const goalPriorities = ['critical', 'high', 'medium', 'low'];
export const kpiStatuses = ['ahead', 'on_track', 'behind', 'at_risk', 'blocked', 'unknown'];
export const decisionTypes = ['approval', 'rejection', 'prioritization', 'strategic direction', 'resource allocation', 'risk acceptance', 'pause', 'resume', 'archive', 'general'];
export const planningCommands = [
  'executive:goals',
  'executive:create-goal',
  'executive:update-goal',
  'executive:kpis',
  'executive:create-kpi',
  'executive:update-kpi',
  'executive:initiatives',
  'executive:create-initiative',
  'executive:decision-log',
  'executive:add-decision',
  'executive:blockers',
  'executive:goal-report',
  'executive:kpi-report',
  'executive:planning-report',
  'executive:validate',
];

const subdirs = ['goals', 'kpis', 'initiatives', 'decisions', 'blockers', 'audit-history', 'reports'];

export function ensureExecutivePlanningStore() {
  mkdirSync(executivePlanningRoot, { recursive: true });
  mkdirSync(executivePlanningReportRoot, { recursive: true });
  subdirs.forEach((dir) => mkdirSync(path.join(executivePlanningRoot, dir), { recursive: true }));
  seedIfEmpty();
}

export function getExecutivePlanningSummary() {
  ensureExecutivePlanningStore();
  const generatedAt = new Date().toISOString();
  const context = buildPlanningContext();
  const goals = listRecords('goals').map((goal) => scoreGoal(normalizeGoal(goal), context));
  const kpis = listRecords('kpis').map((kpi) => evaluateKpi(normalizeKpi(kpi), goals));
  const initiatives = listRecords('initiatives').map((initiative) => scoreInitiative(normalizeInitiative(initiative), goals, context));
  const decisions = listRecords('decisions').map(normalizeDecision);
  const blockers = detectBlockers({ context, goals, initiatives });
  const agentContribution = buildAgentContribution({ goals, initiatives, tasks: context.tasks });
  const strategicRisks = buildStrategicRisks({ goals, blockers, context });

  return {
    title: 'Executive Planning Summary',
    generatedAt,
    schemaVersion: 1,
    goals,
    kpis,
    initiatives,
    decisions,
    blockers,
    agentContribution,
    strategicRisks,
    summary: {
      totalGoals: goals.length,
      activeGoals: goals.filter((goal) => goal.status === 'active').length,
      atRiskGoals: goals.filter((goal) => goal.status === 'at_risk' || goal.attention.label !== 'Normal').length,
      blockedGoals: goals.filter((goal) => goal.status === 'blocked' || goal.blockers.length).length,
      kpisOnTrack: kpis.filter((kpi) => ['ahead', 'on_track'].includes(kpi.status)).length,
      initiativesActive: initiatives.filter((initiative) => initiative.status === 'active').length,
      decisionsLogged: decisions.length,
      executiveAttentionNeeded: goals.filter((goal) => goal.attention.score >= 60).length,
    },
    safety: planningSafety(),
  };
}

export function listGoals() {
  return { title: 'Executive Goals', ...pickPlanning(['generatedAt', 'summary', 'goals', 'blockers', 'safety']) };
}

export function createGoal(options = {}) {
  ensureExecutivePlanningStore();
  const now = new Date().toISOString();
  const goal = normalizeGoal({
    goalId: options.goalId || `goal-${compactStamp(now)}-${slugify(options.title || 'executive-goal')}`,
    title: options.title || 'Untitled executive goal',
    description: options.description || 'Local executive planning goal.',
    category: options.category || 'executive',
    ownerAgent: options.ownerAgent || 'Executive',
    ownerUser: options.ownerUser || 'Robert',
    priority: options.priority || 'medium',
    status: options.status || 'draft',
    timeframe: options.timeframe || 'quarter',
    startDate: options.startDate || now.slice(0, 10),
    targetDate: options.targetDate || null,
    createdDate: now,
    updatedDate: now,
    linkedTasks: parseList(options.linkedTasks),
    linkedWorkflows: parseList(options.linkedWorkflows),
    linkedEntities: parseList(options.linkedEntities),
    linkedOpportunities: parseList(options.linkedOpportunities),
    linkedOrganizations: parseList(options.linkedOrganizations),
    linkedReports: parseList(options.linkedReports),
    linkedKpis: parseList(options.linkedKpis),
    blockers: parseList(options.blockers),
    risks: parseList(options.risks),
    decisions: parseList(options.decisions),
    progressScore: Number(options.progressScore ?? 0),
    confidenceScore: Number(options.confidenceScore ?? 60),
    auditHistory: [audit('create_goal', null, options.status || 'draft', options.operator || 'local operator', 'Created local executive goal.', [], [])],
    localOnly: true,
  });
  const validation = validateGoal(goal);
  if (!validation.valid) return { status: 'fail', errors: validation.errors, goal };
  writeRecord('goals', goal.goalId, goal);
  return { status: 'success', action: 'create_goal', goal, safety: planningSafety() };
}

export function updateGoal(options = {}) {
  ensureExecutivePlanningStore();
  const goal = findRecord('goals', options.goalId || options.id);
  if (!goal) return { status: 'fail', errors: [`Goal not found: ${options.goalId || options.id}`] };
  const previous = normalizeGoal(goal);
  const updated = normalizeGoal({ ...previous, ...filterUpdates(options), updatedDate: new Date().toISOString() });
  const previousStatus = previous.status;
  if (options.status && options.status !== previousStatus) {
    if (!validGoalTransition(previousStatus, updated.status)) return { status: 'fail', errors: [`Invalid goal transition: ${previousStatus} -> ${updated.status}`], goal: previous };
    updated.auditHistory.push(audit('update_goal_status', previousStatus, updated.status, options.operator || 'local operator', options.reason || 'Updated local goal status.', updated.linkedTasks, updated.linkedWorkflows));
  } else {
    updated.auditHistory.push(audit('update_goal', previousStatus, updated.status, options.operator || 'local operator', options.reason || 'Updated local goal fields.', updated.linkedTasks, updated.linkedWorkflows));
  }
  const validation = validateGoal(updated);
  if (!validation.valid) return { status: 'fail', errors: validation.errors, goal: updated };
  writeRecord('goals', updated.goalId, updated);
  return { status: 'success', action: 'update_goal', goal: updated, safety: planningSafety() };
}

export function listKpis() {
  return { title: 'Executive KPI Scorecard', ...pickPlanning(['generatedAt', 'summary', 'kpis', 'safety']) };
}

export function createKpi(options = {}) {
  ensureExecutivePlanningStore();
  const now = new Date().toISOString();
  const kpi = normalizeKpi({
    kpiId: options.kpiId || `kpi-${compactStamp(now)}-${slugify(options.name || 'executive-kpi')}`,
    name: options.name || 'Untitled KPI',
    description: options.description || 'Local executive KPI.',
    category: options.category || 'executive',
    currentValue: Number(options.currentValue ?? 0),
    targetValue: Number(options.targetValue ?? 100),
    unit: options.unit || 'count',
    trend: options.trend || 'stable',
    status: options.status || 'unknown',
    linkedGoal: options.linkedGoal || null,
    linkedTasks: parseList(options.linkedTasks),
    linkedReports: parseList(options.linkedReports),
    confidence: Number(options.confidence ?? 60),
    lastUpdated: now,
    auditHistory: [audit('create_kpi', null, options.status || 'unknown', options.operator || 'local operator', 'Created local KPI.', parseList(options.linkedTasks), [])],
    localOnly: true,
  });
  writeRecord('kpis', kpi.kpiId, kpi);
  return { status: 'success', action: 'create_kpi', kpi, safety: planningSafety() };
}

export function updateKpi(options = {}) {
  ensureExecutivePlanningStore();
  const kpi = findRecord('kpis', options.kpiId || options.id);
  if (!kpi) return { status: 'fail', errors: [`KPI not found: ${options.kpiId || options.id}`] };
  const updated = normalizeKpi({ ...kpi, ...filterUpdates(options), lastUpdated: new Date().toISOString() });
  updated.auditHistory.push(audit('update_kpi', kpi.status, updated.status, options.operator || 'local operator', options.reason || 'Updated local KPI.', updated.linkedTasks, []));
  writeRecord('kpis', updated.kpiId, updated);
  return { status: 'success', action: 'update_kpi', kpi: updated, safety: planningSafety() };
}

export function listInitiatives() {
  return { title: 'Executive Initiative Tracker', ...pickPlanning(['generatedAt', 'summary', 'initiatives', 'safety']) };
}

export function createInitiative(options = {}) {
  ensureExecutivePlanningStore();
  const now = new Date().toISOString();
  const initiative = normalizeInitiative({
    initiativeId: options.initiativeId || `initiative-${compactStamp(now)}-${slugify(options.title || 'executive-initiative')}`,
    title: options.title || 'Untitled initiative',
    description: options.description || 'Local executive initiative.',
    owner: options.owner || 'Executive',
    linkedGoal: options.linkedGoal || null,
    linkedKpis: parseList(options.linkedKpis),
    linkedTasks: parseList(options.linkedTasks),
    linkedWorkflows: parseList(options.linkedWorkflows),
    priority: options.priority || 'medium',
    status: options.status || 'active',
    startDate: options.startDate || now.slice(0, 10),
    targetDate: options.targetDate || null,
    blockers: parseList(options.blockers),
    risks: parseList(options.risks),
    progress: Number(options.progress ?? 0),
    auditHistory: [audit('create_initiative', null, options.status || 'active', options.operator || 'local operator', 'Created local initiative.', parseList(options.linkedTasks), parseList(options.linkedWorkflows))],
    localOnly: true,
  });
  writeRecord('initiatives', initiative.initiativeId, initiative);
  return { status: 'success', action: 'create_initiative', initiative, safety: planningSafety() };
}

export function listDecisions() {
  return { title: 'Executive Decision Log', ...pickPlanning(['generatedAt', 'summary', 'decisions', 'safety']) };
}

export function addDecision(options = {}) {
  ensureExecutivePlanningStore();
  const now = new Date().toISOString();
  const decision = normalizeDecision({
    decisionId: options.decisionId || `decision-${compactStamp(now)}-${slugify(options.title || 'executive-decision')}`,
    title: options.title || 'Untitled decision',
    description: options.description || 'Local executive decision.',
    decisionType: normalizeChoice(options.decisionType, decisionTypes, 'general'),
    relatedGoal: options.relatedGoal || null,
    relatedTask: options.relatedTask || null,
    relatedWorkflow: options.relatedWorkflow || null,
    relatedOpportunity: options.relatedOpportunity || null,
    relatedEntity: options.relatedEntity || null,
    decisionMaker: options.decisionMaker || 'Robert',
    decision: options.decision || 'recorded for review',
    rationale: options.rationale || 'Local decision log entry.',
    status: options.status || 'recorded',
    date: options.date || now,
    consequences: parseList(options.consequences),
    followUpTasks: parseList(options.followUpTasks),
    auditHistory: [audit('add_decision', null, options.status || 'recorded', options.operator || 'local operator', 'Added local decision log entry.', parseList(options.followUpTasks), parseList(options.relatedWorkflow))],
    localOnly: true,
  });
  writeRecord('decisions', decision.decisionId, decision);
  return { status: 'success', action: 'add_decision', decision, safety: planningSafety() };
}

export function listBlockers() {
  return { title: 'Executive Planning Blockers', ...pickPlanning(['generatedAt', 'summary', 'blockers', 'strategicRisks', 'safety']) };
}

export function getGoalReport() {
  const planning = getExecutivePlanningSummary();
  return writeAndReturn('goal-progress-report', { title: 'Goal Progress Report', generatedAt: planning.generatedAt, goals: planning.goals, blockers: planning.blockers, safety: planning.safety });
}

export function getKpiReport() {
  const planning = getExecutivePlanningSummary();
  return writeAndReturn('kpi-scorecard-report', { title: 'KPI Scorecard Report', generatedAt: planning.generatedAt, kpis: planning.kpis, safety: planning.safety });
}

export function getPlanningReport() {
  const planning = getExecutivePlanningSummary();
  const reports = [
    ['executive-planning-summary', planning],
    ['goal-progress-report', { title: 'Goal Progress Report', generatedAt: planning.generatedAt, goals: planning.goals, blockers: planning.blockers, safety: planning.safety }],
    ['kpi-scorecard-report', { title: 'KPI Scorecard Report', generatedAt: planning.generatedAt, kpis: planning.kpis, safety: planning.safety }],
    ['initiative-tracker-report', { title: 'Initiative Tracker Report', generatedAt: planning.generatedAt, initiatives: planning.initiatives, safety: planning.safety }],
    ['blocked-goal-report', { title: 'Blocked Goal Report', generatedAt: planning.generatedAt, blockers: planning.blockers, blockedGoals: planning.goals.filter((goal) => goal.blockers.length || goal.status === 'blocked'), safety: planning.safety }],
    ['decision-log-report', { title: 'Decision Log Report', generatedAt: planning.generatedAt, decisions: planning.decisions, safety: planning.safety }],
    ['agent-contribution-report', { title: 'Agent Contribution Report', generatedAt: planning.generatedAt, agentContribution: planning.agentContribution, safety: planning.safety }],
    ['strategic-risk-report', { title: 'Strategic Risk Report', generatedAt: planning.generatedAt, strategicRisks: planning.strategicRisks, safety: planning.safety }],
  ];
  reports.forEach(([slug, report]) => writeReport(slug, report));
  return { reports: reports.map(([slug]) => slug), ...planning };
}

export function validateExecutivePlanning() {
  ensureExecutivePlanningStore();
  const planning = getExecutivePlanningSummary();
  const errors = [];
  planning.goals.forEach((goal) => errors.push(...validateGoal(goal).errors.map((error) => `${goal.goalId}: ${error}`)));
  planning.kpis.forEach((kpi) => {
    if (!kpi.kpiId) errors.push('KPI missing kpiId.');
    if (!kpiStatuses.includes(kpi.status)) errors.push(`${kpi.kpiId}: invalid KPI status.`);
  });
  planning.initiatives.forEach((initiative) => {
    if (!initiative.initiativeId) errors.push('Initiative missing initiativeId.');
    if (initiative.localOnly !== true) errors.push(`${initiative.initiativeId}: localOnly must be true.`);
  });
  planning.decisions.forEach((decision) => {
    if (!decision.decisionId) errors.push('Decision missing decisionId.');
    if (decision.localOnly !== true) errors.push(`${decision.decisionId}: localOnly must be true.`);
  });
  return {
    title: 'Executive Planning Validation',
    generatedAt: new Date().toISOString(),
    status: errors.length ? 'fail' : 'pass',
    commands: planningCommands,
    storage: path.relative(repoRoot, executivePlanningRoot),
    reports: ['Executive Planning Summary', 'Goal Progress Report', 'KPI Scorecard Report', 'Initiative Tracker Report', 'Blocked Goal Report', 'Decision Log Report', 'Agent Contribution Report', 'Strategic Risk Report'],
    errors,
    summary: planning.summary,
    safety: planningSafety(),
  };
}

function buildPlanningContext() {
  const taskSummary = safe(() => buildSharedTaskStatus(), { activeWorkQueue: [], blockedWork: [], overdueWork: [], executiveQueue: [], tasksByAgent: {}, universalQueues: {} });
  const memoryStore = safe(() => buildSharedMemoryStore(), { summary: { conflictCount: 0, riskyFacts: 0, averageFactConfidence: 0 } });
  const memorySummary = memoryStore.summary || { conflictCount: 0, riskyFacts: 0, averageFactConfidence: 0 };
  const salesWorkflowStatus = safe(() => listSalesWorkflows(), { summary: {} });
  const salesStatus = safe(() => getSalesStatus(), { prospectResearch: [], pipelineAnalytics: null });
  return {
    tasks: [...(taskSummary.activeWorkQueue || []), ...(taskSummary.blockedWork || []), ...(taskSummary.overdueWork || [])],
    taskSummary,
    memorySummary,
    salesWorkflowStatus,
    salesStatus,
  };
}

function scoreGoal(goal, context) {
  const linkedTasks = context.tasks.filter((task) => goal.linkedTasks.includes(task.id) || goal.linkedOrganizations.includes(task.organization));
  const blockedTasks = linkedTasks.filter((task) => task.statusCanonical === 'blocked' || task.status === 'Blocked');
  const overdueTasks = linkedTasks.filter((task) => task.overdue);
  const detectedBlockers = [
    ...goal.blockers,
    ...blockedTasks.map((task) => `Blocked linked task: ${task.title}`),
    ...overdueTasks.map((task) => `Overdue linked task: ${task.title}`),
    context.memorySummary.conflictCount > 0 && goal.category !== 'general' ? `${context.memorySummary.conflictCount} unresolved shared memory conflict(s).` : null,
  ].filter(Boolean);
  const riskScore = Math.min(100, detectedBlockers.length * 20 + goal.risks.length * 12 + (goal.confidenceScore < 60 ? 15 : 0));
  const progressScore = Math.max(0, Math.min(100, goal.progressScore || average(linkedTasks.map((task) => task.statusCanonical === 'completed' ? 100 : task.statusCanonical === 'review' ? 70 : task.statusCanonical === 'blocked' ? 25 : 45), goal.progressScore)));
  return {
    ...goal,
    progressScore,
    blockers: unique(detectedBlockers),
    risk: scorePackage(riskScore, riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low', detectedBlockers, goal.risks, riskScore >= 40 ? 'Resolve blockers before approving dependent work.' : 'Continue planned local execution.'),
    attention: scorePackage(Math.min(100, riskScore + (goal.priority === 'critical' ? 20 : goal.priority === 'high' ? 10 : 0)), riskScore >= 70 ? 'Executive Review' : riskScore >= 40 ? 'Watch' : 'Normal', detectedBlockers, goal.risks, detectedBlockers[0] || 'Review goal progress in the next planning cycle.'),
    recommendations: detectedBlockers.length ? detectedBlockers.map((blocker) => `Resolve: ${blocker}`) : ['Keep goal active and review KPI trend.'],
  };
}

function evaluateKpi(kpi, goals) {
  const ratio = kpi.targetValue === 0 ? 0 : kpi.currentValue / kpi.targetValue;
  const linkedGoal = goals.find((goal) => goal.goalId === kpi.linkedGoal);
  const blocked = linkedGoal?.blockers?.length || linkedGoal?.status === 'blocked';
  const status = blocked ? 'blocked' : ratio >= 1.05 ? 'ahead' : ratio >= 0.85 ? 'on_track' : ratio >= 0.65 ? 'behind' : ratio > 0 ? 'at_risk' : 'unknown';
  return { ...kpi, status, evaluation: scorePackage(Math.round(Math.min(100, ratio * 100)), status, [`Current ${kpi.currentValue}${kpi.unit ? ` ${kpi.unit}` : ''} vs target ${kpi.targetValue}.`], blocked ? ['Linked goal is blocked.'] : [], blocked ? 'Clear linked goal blockers.' : 'Track trend in next local review.') };
}

function scoreInitiative(initiative, goals, context) {
  const linkedGoal = goals.find((goal) => goal.goalId === initiative.linkedGoal);
  const linkedTasks = context.tasks.filter((task) => initiative.linkedTasks.includes(task.id));
  const blockers = unique([...initiative.blockers, ...(linkedGoal?.blockers || []), ...linkedTasks.filter((task) => task.statusCanonical === 'blocked').map((task) => `Blocked task: ${task.title}`)]);
  const progress = Math.max(initiative.progress, average(linkedTasks.map((task) => task.statusCanonical === 'completed' ? 100 : task.statusCanonical === 'review' ? 70 : task.statusCanonical === 'blocked' ? 20 : 45), initiative.progress));
  return { ...initiative, progress, blockers, score: scorePackage(progress, progress >= 75 ? 'On Track' : blockers.length ? 'At Risk' : 'Building', [`${Math.round(progress)}% deterministic progress.`], blockers, blockers[0] || 'Continue initiative execution.') };
}

function detectBlockers({ context, goals, initiatives }) {
  const blockers = [
    ...context.taskSummary.overdueWork?.map((task) => blocker('overdue_task', `Overdue linked task: ${task.title}`, task.assignedAgent, task.recommendedNextAction, task.id)) ?? [],
    ...context.taskSummary.blockedWork?.map((task) => blocker('blocked_task', `Blocked task: ${task.title}`, task.assignedAgent, task.recommendedNextAction, task.id)) ?? [],
    context.taskSummary.tasksRequiringExecutiveReview ? blocker('missing_approval', `${context.taskSummary.tasksRequiringExecutiveReview} task(s) require Executive review.`, 'Executive', 'Review approval queue manually.', 'executive-queue') : null,
    context.memorySummary.conflictCount ? blocker('memory_conflict', `${context.memorySummary.conflictCount} shared memory conflict(s) remain unresolved.`, 'Operator', 'Review conflict queue manually.', 'memory-conflicts') : null,
    context.memorySummary.riskyFacts ? blocker('low_confidence_facts', `${context.memorySummary.riskyFacts} risky fact(s) need verification before decisions.`, 'Operator', 'Verify risky facts before Executive use.', 'risky-facts') : null,
    ...goals.filter((goal) => goal.blockers.length).map((goal) => blocker('goal_blocker', `${goal.title}: ${goal.blockers[0]}`, goal.ownerAgent, goal.recommendations[0], goal.goalId)),
    ...initiatives.filter((initiative) => initiative.blockers.length).map((initiative) => blocker('initiative_blocker', `${initiative.title}: ${initiative.blockers[0]}`, initiative.owner, initiative.score.nextAction, initiative.initiativeId)),
  ].filter(Boolean);
  return blockers.map((item, index) => ({ ...item, blockerId: `blocker-${String(index + 1).padStart(3, '0')}` }));
}

function blocker(type, title, owner, nextAction, sourceId) {
  return { type, title, owner, severity: type.includes('blocked') || type.includes('approval') ? 'high' : 'medium', sourceId, nextAction, localOnly: true };
}

function buildAgentContribution({ goals, initiatives, tasks }) {
  const agents = unique([...goals.map((goal) => goal.ownerAgent), ...initiatives.map((initiative) => initiative.owner), ...tasks.map((task) => task.assignedAgent)]);
  return agents.map((agent) => ({
    agent,
    goalsOwned: goals.filter((goal) => goal.ownerAgent === agent).length,
    initiativesOwned: initiatives.filter((initiative) => initiative.owner === agent).length,
    linkedTasks: tasks.filter((task) => task.assignedAgent === agent).length,
    blockedItems: tasks.filter((task) => task.assignedAgent === agent && task.statusCanonical === 'blocked').length,
    contributionLabel: goals.some((goal) => goal.ownerAgent === agent && goal.attention.score >= 60) ? 'Needs Executive Attention' : 'Contributing',
  }));
}

function buildStrategicRisks({ goals, blockers, context }) {
  return [
    blockers.length ? { risk: 'Planning blockers are affecting goals.', level: blockers.some((item) => item.severity === 'high') ? 'high' : 'medium', recommendation: 'Review Blocked Goals and Executive Priority Queue.' } : null,
    context.memorySummary.conflictCount ? { risk: 'Shared memory conflicts may reduce planning confidence.', level: 'medium', recommendation: 'Route memory conflict review to Operator.' } : null,
    goals.some((goal) => goal.confidenceScore < 60) ? { risk: 'Low confidence goal inputs detected.', level: 'medium', recommendation: 'Verify linked reports and facts before decisions.' } : null,
  ].filter(Boolean);
}

function normalizeGoal(goal) {
  return {
    ...goal,
    goalId: goal.goalId || goal.id,
    title: goal.title || 'Untitled goal',
    description: goal.description || 'Local executive goal.',
    category: normalizeChoice(goal.category, goalCategories, 'general'),
    ownerAgent: goal.ownerAgent || 'Executive',
    ownerUser: goal.ownerUser || 'Robert',
    priority: normalizeChoice(goal.priority, goalPriorities, 'medium'),
    status: normalizeChoice(goal.status, goalStatuses, 'draft'),
    timeframe: goal.timeframe || 'quarter',
    startDate: goal.startDate || goal.createdDate || new Date().toISOString().slice(0, 10),
    targetDate: goal.targetDate || null,
    createdDate: goal.createdDate || new Date().toISOString(),
    updatedDate: goal.updatedDate || goal.createdDate || new Date().toISOString(),
    completedDate: goal.completedDate || null,
    linkedTasks: parseList(goal.linkedTasks),
    linkedWorkflows: parseList(goal.linkedWorkflows),
    linkedEntities: parseList(goal.linkedEntities),
    linkedOpportunities: parseList(goal.linkedOpportunities),
    linkedOrganizations: parseList(goal.linkedOrganizations),
    linkedReports: parseList(goal.linkedReports),
    linkedKpis: parseList(goal.linkedKpis),
    blockers: parseList(goal.blockers),
    risks: parseList(goal.risks),
    decisions: parseList(goal.decisions),
    progressScore: Number(goal.progressScore ?? 0),
    confidenceScore: Number(goal.confidenceScore ?? 60),
    auditHistory: Array.isArray(goal.auditHistory) ? goal.auditHistory : [],
    localOnly: true,
  };
}

function normalizeKpi(kpi) {
  return { ...kpi, kpiId: kpi.kpiId || kpi.id, category: normalizeChoice(kpi.category, goalCategories, 'general'), currentValue: Number(kpi.currentValue ?? 0), targetValue: Number(kpi.targetValue ?? 100), status: normalizeChoice(kpi.status, kpiStatuses, 'unknown'), linkedTasks: parseList(kpi.linkedTasks), linkedReports: parseList(kpi.linkedReports), confidence: Number(kpi.confidence ?? 60), auditHistory: Array.isArray(kpi.auditHistory) ? kpi.auditHistory : [], localOnly: true };
}

function normalizeInitiative(initiative) {
  return { ...initiative, initiativeId: initiative.initiativeId || initiative.id, owner: initiative.owner || 'Executive', linkedKpis: parseList(initiative.linkedKpis), linkedTasks: parseList(initiative.linkedTasks), linkedWorkflows: parseList(initiative.linkedWorkflows), priority: normalizeChoice(initiative.priority, goalPriorities, 'medium'), status: initiative.status || 'active', blockers: parseList(initiative.blockers), risks: parseList(initiative.risks), progress: Number(initiative.progress ?? 0), auditHistory: Array.isArray(initiative.auditHistory) ? initiative.auditHistory : [], localOnly: true };
}

function normalizeDecision(decision) {
  return { ...decision, decisionId: decision.decisionId || decision.id, decisionType: normalizeChoice(decision.decisionType, decisionTypes, 'general'), consequences: parseList(decision.consequences), followUpTasks: parseList(decision.followUpTasks), auditHistory: Array.isArray(decision.auditHistory) ? decision.auditHistory : [], localOnly: true };
}

function validateGoal(goal) {
  const errors = [];
  if (!goal.goalId) errors.push('goalId is required.');
  if (!goal.title) errors.push('title is required.');
  if (!goalCategories.includes(goal.category)) errors.push('invalid category.');
  if (!goalStatuses.includes(goal.status)) errors.push('invalid status.');
  if (!goalPriorities.includes(goal.priority)) errors.push('invalid priority.');
  if (!Array.isArray(goal.auditHistory)) errors.push('auditHistory must be an array.');
  if (goal.localOnly !== true) errors.push('localOnly must be true.');
  return { valid: errors.length === 0, errors };
}

function seedIfEmpty() {
  if (readdirSync(path.join(executivePlanningRoot, 'goals')).some((file) => file.endsWith('.json'))) return;
  const now = new Date().toISOString();
  const goals = [
    { goalId: 'goal-revenue-louisville-sales', title: 'Grow Louisville KY sales pipeline', description: 'Increase local Louisville and surrounding-area prospect conversion using safe local Sales workflows.', category: 'revenue', ownerAgent: 'Sales', ownerUser: 'Robert', priority: 'critical', status: 'active', timeframe: 'quarter', startDate: '2026-07-01', targetDate: '2026-09-30', linkedTasks: [], linkedWorkflows: ['sales-workflow-louisville'], linkedEntities: ['market:louisville-ky'], linkedOpportunities: ['louisville-combat-academy', 'area-502-mma'], linkedOrganizations: ['Louisville Combat Academy', 'Area 502 MMA'], linkedReports: ['pipeline-forecast-report'], linkedKpis: ['kpi-pipeline-value'], blockers: [], risks: ['Contact verification and Executive approvals are required before external action.'], decisions: [], progressScore: 55, confidenceScore: 72 },
    { goalId: 'goal-operating-control', title: 'Maintain local operating control', description: 'Keep multi-agent execution auditable, local-only, and approval gated.', category: 'operations', ownerAgent: 'Executive', ownerUser: 'Robert', priority: 'high', status: 'at_risk', timeframe: 'month', startDate: '2026-07-01', targetDate: '2026-07-31', linkedTasks: [], linkedWorkflows: ['universal-task-engine'], linkedEntities: ['shared-memory', 'universal-task-engine'], linkedOpportunities: [], linkedOrganizations: ['Vyra internal operations'], linkedReports: ['executive-planning-summary'], linkedKpis: ['kpi-blocked-work'], blockers: ['Manual review queues need daily attention.'], risks: ['Unresolved memory conflicts can reduce decision confidence.'], decisions: ['decision-keep-local-only'], progressScore: 64, confidenceScore: 78 },
    { goalId: 'goal-proposal-readiness', title: 'Improve proposal readiness gates', description: 'Ensure proposal prep work has verified sources, decision makers, and Executive approval before any external action.', category: 'sales', ownerAgent: 'Proposal Prep', ownerUser: 'Robert', priority: 'high', status: 'review', timeframe: 'month', startDate: '2026-07-01', targetDate: '2026-07-31', linkedTasks: [], linkedWorkflows: ['proposal-prep-queue'], linkedEntities: ['proposal-readiness'], linkedOpportunities: ['core-combat-sports'], linkedOrganizations: ['Core Combat Sports'], linkedReports: ['proposal-prep-queue-report'], linkedKpis: ['kpi-proposal-readiness'], blockers: ['Missing decision maker confirmation on warm prospects.'], risks: ['Proposal readiness gaps can trigger premature external action requests.'], decisions: [], progressScore: 48, confidenceScore: 68 },
  ];
  goals.forEach((goal) => writeRecord('goals', goal.goalId, normalizeGoal({ ...goal, createdDate: now, updatedDate: now, auditHistory: [audit('seed_goal', null, goal.status, 'Executive Planning Engine', 'Seeded deterministic local goal.', goal.linkedTasks, goal.linkedWorkflows)] })));
  [
    { kpiId: 'kpi-pipeline-value', name: 'Weighted Louisville pipeline', description: 'Weighted local sales pipeline progress toward revenue goal.', category: 'revenue', currentValue: 39708, targetValue: 75000, unit: 'USD', trend: 'rising', status: 'behind', linkedGoal: 'goal-revenue-louisville-sales', confidence: 72 },
    { kpiId: 'kpi-blocked-work', name: 'Blocked work clearance', description: 'Share of local work queues without blockers.', category: 'operations', currentValue: 80, targetValue: 95, unit: 'percent', trend: 'stable', status: 'behind', linkedGoal: 'goal-operating-control', confidence: 75 },
    { kpiId: 'kpi-proposal-readiness', name: 'Proposal readiness coverage', description: 'Share of proposal candidates with verified requirements and approval path.', category: 'sales', currentValue: 62, targetValue: 90, unit: 'percent', trend: 'rising', status: 'behind', linkedGoal: 'goal-proposal-readiness', confidence: 68 },
  ].forEach((kpi) => writeRecord('kpis', kpi.kpiId, normalizeKpi({ ...kpi, lastUpdated: now, auditHistory: [audit('seed_kpi', null, kpi.status, 'Executive Planning Engine', 'Seeded deterministic local KPI.', [], [])] })));
  [
    { initiativeId: 'initiative-sales-priority-queues', title: 'Use Sales priority queues for daily planning', description: 'Review hot prospects, proposal-ready work, and Executive review queues daily.', owner: 'Sales', linkedGoal: 'goal-revenue-louisville-sales', linkedKpis: ['kpi-pipeline-value'], linkedTasks: [], linkedWorkflows: ['sales-priority-queues'], priority: 'high', status: 'active', startDate: '2026-07-01', targetDate: '2026-07-15', blockers: [], risks: ['Manual follow-up discipline required.'], progress: 58 },
    { initiativeId: 'initiative-memory-review', title: 'Resolve planning-critical memory conflicts', description: 'Route shared memory conflicts that affect Executive decisions to Operator.', owner: 'Operator', linkedGoal: 'goal-operating-control', linkedKpis: ['kpi-blocked-work'], linkedTasks: [], linkedWorkflows: ['memory-maintenance'], priority: 'high', status: 'active', startDate: '2026-07-01', targetDate: '2026-07-12', blockers: ['Memory conflict review queue is non-empty.'], risks: ['Low-confidence facts can affect goal scoring.'], progress: 42 },
  ].forEach((initiative) => writeRecord('initiatives', initiative.initiativeId, normalizeInitiative({ ...initiative, auditHistory: [audit('seed_initiative', null, initiative.status, 'Executive Planning Engine', 'Seeded deterministic local initiative.', initiative.linkedTasks, initiative.linkedWorkflows)] })));
  writeRecord('decisions', 'decision-keep-local-only', normalizeDecision({ decisionId: 'decision-keep-local-only', title: 'Keep Executive planning local only', description: 'Executive planning recommendations are advisory and cannot execute external actions.', decisionType: 'strategic direction', relatedGoal: 'goal-operating-control', decisionMaker: 'Robert', decision: 'Maintain local-only execution with manual approval gates.', rationale: 'Preserves safety while agent orchestration matures.', status: 'recorded', date: now, consequences: ['No autonomous CRM sync', 'No autonomous emailing', 'No proposal submission'], followUpTasks: [], auditHistory: [audit('seed_decision', null, 'recorded', 'Executive Planning Engine', 'Seeded local decision.', [], [])] }));
}

function listRecords(type) {
  ensureExecutivePlanningStore();
  return readdirSync(path.join(executivePlanningRoot, type)).filter((file) => file.endsWith('.json')).sort().map((file) => JSON.parse(readFileSync(path.join(executivePlanningRoot, type, file), 'utf8')));
}

function findRecord(type, id) {
  if (!id) return null;
  const file = path.join(executivePlanningRoot, type, `${safeFileName(id)}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

function writeRecord(type, id, payload) {
  mkdirSync(path.join(executivePlanningRoot, type), { recursive: true });
  writeFileSync(path.join(executivePlanningRoot, type, `${safeFileName(id)}.json`), `${JSON.stringify(payload, null, 2)}\n`);
}

function writeReport(slug, payload) {
  mkdirSync(executivePlanningReportRoot, { recursive: true });
  mkdirSync(path.join(executivePlanningRoot, 'reports'), { recursive: true });
  const stamp = compactStamp(payload.generatedAt || new Date().toISOString());
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  const markdown = toMarkdown(payload);
  writeFileSync(path.join(executivePlanningReportRoot, `${stamp}-${slug}.json`), json);
  writeFileSync(path.join(executivePlanningReportRoot, `${stamp}-${slug}.md`), markdown);
  writeFileSync(path.join(executivePlanningRoot, 'reports', `${stamp}-${slug}.json`), json);
  writeFileSync(path.join(executivePlanningRoot, 'reports', `${stamp}-${slug}.md`), markdown);
}

function writeAndReturn(slug, payload) {
  writeReport(slug, payload);
  return payload;
}

function pickPlanning(keys) {
  const planning = getExecutivePlanningSummary();
  return keys.reduce((result, key) => ({ ...result, [key]: planning[key] }), {});
}

function validGoalTransition(previous, next) {
  if (previous === next) return true;
  const allowed = { draft: ['active', 'paused', 'archived'], active: ['at_risk', 'blocked', 'review', 'completed', 'paused', 'archived'], at_risk: ['active', 'blocked', 'review', 'paused', 'archived'], blocked: ['at_risk', 'review', 'paused', 'archived'], review: ['active', 'completed', 'blocked', 'paused', 'archived'], completed: ['archived'], paused: ['active', 'archived'], archived: [] };
  return (allowed[previous] || []).includes(next);
}

function audit(action, previousStatus, newStatus, actor, reason, affectedTasks = [], affectedWorkflows = []) {
  return { timestamp: new Date().toISOString(), action, previousStatus, newStatus, actor, reason, affectedTasks: parseList(affectedTasks), affectedWorkflows: parseList(affectedWorkflows), nextAction: 'Review locally before any external action.', localOnly: true };
}

function scorePackage(score, label, reasons = [], risks = [], nextAction = 'Review locally.') {
  return { score: Math.round(score), label, reasons, risks, recommendations: risks.length ? risks.map((risk) => `Mitigate: ${risk}`) : ['Continue local monitoring.'], nextAction };
}

function parseList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try { return JSON.parse(value); } catch { return [value]; }
  }
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

function filterUpdates(options) {
  const ignored = new Set(['id', 'goalId', 'kpiId', 'operator', 'reason']);
  return Object.fromEntries(Object.entries(options).filter(([key]) => !ignored.has(key)));
}

function normalizeChoice(value, allowed, fallback) {
  const match = allowed.find((item) => item.toLowerCase() === String(value || '').toLowerCase());
  return match || fallback;
}

function safe(fn, fallback) {
  try { return fn(); } catch { return fallback; }
}

function average(values, fallback = 0) {
  const usable = values.filter((value) => Number.isFinite(value));
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : fallback;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function planningSafety() {
  return { localOnly: true, externalSync: false, autonomousBrowsing: false, autonomousEmailing: false, crmSync: false, proposalSubmission: false, automaticApprovals: false, automaticSourceApproval: false, automaticMerge: false, automaticGoalCompletion: false, advisoryOnly: true };
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title || 'Executive Planning Report'}`, ''];
  Object.entries(payload).filter(([key]) => key !== 'title').forEach(([key, value]) => {
    lines.push(`## ${labelize(key)}`, '');
    if (Array.isArray(value)) value.forEach((item) => lines.push(`- ${formatValue(item)}`));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([childKey, child]) => lines.push(`- ${labelize(childKey)}: ${formatValue(child)}`));
    else lines.push(String(value ?? ''));
    lines.push('');
  });
  return `${lines.join('\n').trim()}\n`;
}

function safeFileName(value) { return slugify(value).slice(0, 140); }
function slugify(value) { return String(value || 'item').toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '') || 'item'; }
function compactStamp(iso) { return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'); }
function labelize(key) { return String(key).replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase()); }
function formatValue(value) { return value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''); }
