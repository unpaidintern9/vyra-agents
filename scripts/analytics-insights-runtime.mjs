import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAssetStore } from './asset-library-runtime.mjs';
import { readSuccessStore } from './customer-success-runtime.mjs';
import { readEngineeringOperationsStore } from './engineering-operations-runtime.mjs';
import { getExecutivePlanningSummary } from './executive-planning-runtime.mjs';
import { readFinanceStore } from './finance-runtime.mjs';
import { readMarketingStore } from './marketing-agent-runtime.mjs';
import { listSalesOpportunities } from './sales-agent-runtime.mjs';
import { buildSharedMemoryStore } from './shared-memory-runtime.mjs';
import { buildSharedTaskStatus } from './shared-task-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const analyticsRoot = path.join(repoRoot, 'codex-agent-threads/shared/analytics');
const reportsRoot = path.join(analyticsRoot, 'reports');
const files = {
  metrics: path.join(analyticsRoot, 'metrics.json'),
  insights: path.join(analyticsRoot, 'insights.json'),
  scorecards: path.join(analyticsRoot, 'scorecards.json'),
  risks: path.join(analyticsRoot, 'risks.json'),
  bottlenecks: path.join(analyticsRoot, 'bottlenecks.json'),
  trends: path.join(analyticsRoot, 'trends.json'),
  audit: path.join(analyticsRoot, 'audit-history.json'),
};

export const analyticsCommands = [
  'analytics:overview',
  'analytics:company-health',
  'analytics:scorecards',
  'analytics:insights',
  'analytics:risks',
  'analytics:bottlenecks',
  'analytics:trends',
  'analytics:report',
  'analytics:validate',
];

const safety = {
  localOnly: true,
  externalAnalyticsSync: false,
  trackingScripts: false,
  customerDataCollection: false,
  autonomousEmails: false,
  publishing: false,
  billingActions: false,
  deploymentActions: false,
  autonomousExternalActions: false,
  advisoryOnly: true,
};

export function getAnalyticsOverview() {
  const snapshot = buildAnalyticsSnapshot();
  writeAnalyticsStore(snapshot);
  return { title: 'Analytics Overview', generatedAt: snapshot.generatedAt, companyHealth: snapshot.companyHealth, summary: snapshot.summary, crossAgentMetrics: snapshot.crossAgentMetrics, safety };
}

export function getCompanyHealth() {
  const snapshot = buildAnalyticsSnapshot();
  writeAnalyticsStore(snapshot);
  return { title: 'Company Health Score', generatedAt: snapshot.generatedAt, companyHealth: snapshot.companyHealth, safety };
}

export function getScorecards() {
  const snapshot = buildAnalyticsSnapshot();
  writeAnalyticsStore(snapshot);
  return { title: 'Department Scorecards', generatedAt: snapshot.generatedAt, scorecards: snapshot.scorecards, safety };
}

export function getInsights() {
  const snapshot = buildAnalyticsSnapshot();
  writeAnalyticsStore(snapshot);
  return { title: 'Insight Feed', generatedAt: snapshot.generatedAt, insights: snapshot.insights, safety };
}

export function getRisks() {
  const snapshot = buildAnalyticsSnapshot();
  writeAnalyticsStore(snapshot);
  return { title: 'Risk Signals', generatedAt: snapshot.generatedAt, risks: snapshot.risks, safety };
}

export function getBottlenecks() {
  const snapshot = buildAnalyticsSnapshot();
  writeAnalyticsStore(snapshot);
  return { title: 'Bottlenecks', generatedAt: snapshot.generatedAt, bottlenecks: snapshot.bottlenecks, safety };
}

export function getTrends() {
  const snapshot = buildAnalyticsSnapshot();
  writeAnalyticsStore(snapshot);
  return { title: 'Trend Summary', generatedAt: snapshot.generatedAt, trends: snapshot.trends, metrics: snapshot.metrics, safety };
}

export function buildAnalyticsReports() {
  const snapshot = buildAnalyticsSnapshot();
  writeAnalyticsStore(snapshot);
  const reports = {
    'company-health-report': { title: 'Company Health Report', generatedAt: snapshot.generatedAt, companyHealth: snapshot.companyHealth, safety },
    'department-scorecard-report': { title: 'Department Scorecard Report', generatedAt: snapshot.generatedAt, scorecards: snapshot.scorecards, safety },
    'executive-insights-report': reportFor(snapshot, 'Executive', 'Executive Insights Report'),
    'sales-analytics-report': reportFor(snapshot, 'Sales', 'Sales Analytics Report'),
    'marketing-analytics-report': reportFor(snapshot, 'Marketing', 'Marketing Analytics Report'),
    'customer-success-analytics-report': reportFor(snapshot, 'Customer Success', 'Customer Success Analytics Report'),
    'finance-analytics-report': reportFor(snapshot, 'Finance', 'Finance Analytics Report'),
    'engineering-analytics-report': reportFor(snapshot, 'Engineering', 'Engineering Analytics Report'),
    'operator-workload-report': reportFor(snapshot, 'Operator', 'Operator Workload Report'),
    'risk-signals-report': { title: 'Risk Signals Report', generatedAt: snapshot.generatedAt, risks: snapshot.risks, safety },
    'bottleneck-report': { title: 'Bottleneck Report', generatedAt: snapshot.generatedAt, bottlenecks: snapshot.bottlenecks, safety },
    'cross-agent-metrics-report': { title: 'Cross-Agent Metrics Report', generatedAt: snapshot.generatedAt, crossAgentMetrics: snapshot.crossAgentMetrics, safety },
  };
  return { title: 'Analytics Reports Generated', generatedAt: snapshot.generatedAt, written: Object.entries(reports).map(([slug, payload]) => writeReport(slug, payload)), safety };
}

export function validateAnalytics() {
  ensureAnalyticsStorage();
  const snapshot = buildAnalyticsSnapshot();
  writeAnalyticsStore(snapshot);
  const errors = [];
  if (!snapshot.metrics.length) errors.push('analytics metrics missing');
  if (!snapshot.insights.length) errors.push('insights missing');
  if (snapshot.scorecards.length < 7) errors.push('department scorecards incomplete');
  if (!snapshot.companyHealth || typeof snapshot.companyHealth.score !== 'number') errors.push('company health score missing');
  if (snapshot.safety.externalAnalyticsSync || snapshot.safety.trackingScripts || snapshot.safety.autonomousExternalActions) errors.push('analytics safety boundary failed');
  const reports = buildAnalyticsReports();
  for (const item of reports.written) {
    if (!existsSync(path.join(repoRoot, item.jsonPath)) || !existsSync(path.join(repoRoot, item.markdownPath))) errors.push(`report missing: ${item.slug}`);
  }
  return {
    title: 'Analytics Validation',
    generatedAt: stamp(),
    status: errors.length ? 'fail' : 'pass',
    errors,
    commands: analyticsCommands,
    storageRoot: 'codex-agent-threads/shared/analytics',
    summary: snapshot.summary,
    reportCount: reports.written.length,
    integrations: ['Shared Memory', 'Universal Task Engine', 'Executive Planning', 'Sales', 'Marketing', 'Asset Library', 'Customer Success', 'Finance', 'Engineering', 'Operator queues'],
    safety,
  };
}

export function buildAnalyticsSnapshot() {
  ensureAnalyticsStorage();
  const generatedAt = stamp();
  const source = readSources();
  const metrics = buildMetrics(source, generatedAt);
  const scorecards = buildScorecards(source);
  const insights = buildInsights(source);
  const risks = insights.filter((insight) => ['critical', 'high'].includes(insight.severity));
  const bottlenecks = insights.filter((insight) => /blocked|bottleneck|aging|backlog/i.test(`${insight.title} ${insight.explanation}`));
  const trends = buildTrends(source);
  const crossAgentMetrics = buildCrossAgentMetrics(source);
  const companyHealth = buildCompanyHealth(scorecards, risks, source);
  const auditHistory = [
    {
      timestamp: generatedAt,
      actor: 'Analytics & Insights Agent',
      previousValue: null,
      newValue: 'phase62.analytics.snapshot.generated',
      reason: 'Generated deterministic local analytics snapshot. No external analytics sync, tracking, customer collection, or external action occurred.',
    },
  ];
  return {
    title: 'Analytics & Insights Snapshot',
    generatedAt,
    schemaVersion: 1,
    metrics,
    insights,
    scorecards,
    risks,
    bottlenecks,
    trends,
    crossAgentMetrics,
    companyHealth,
    recommendations: unique([...companyHealth.recommendations, ...insights.map((insight) => insight.recommendedNextAction)]).slice(0, 12),
    summary: {
      metricCount: metrics.length,
      insightCount: insights.length,
      highRiskInsights: risks.length,
      bottleneckCount: bottlenecks.length,
      scorecardCount: scorecards.length,
      companyHealthScore: companyHealth.score,
      companyHealthLabel: companyHealth.label,
    },
    sourceReferences: source.references,
    auditHistory,
    safety,
  };
}

function readSources() {
  const tasks = buildSharedTaskStatus();
  const sales = listSalesOpportunities();
  const marketing = readMarketingStore();
  const success = readSuccessStore();
  const finance = readFinanceStore();
  const engineering = readEngineeringOperationsStore();
  const executivePlanning = getExecutivePlanningSummary();
  const assets = readAssetStore();
  const memory = buildSharedMemoryStore();
  const marketingSummary = summarizeMarketing(marketing);
  const successSummary = summarizeSuccess(success);
  const financeSummary = summarizeFinance(finance);
  const engineeringSummary = summarizeEngineering(engineering);
  return {
    tasks,
    sales,
    marketing,
    marketingSummary,
    success,
    successSummary,
    finance,
    financeSummary,
    engineering,
    engineeringSummary,
    executivePlanning,
    assets,
    memory,
    references: {
      sharedMemory: 'codex-agent-threads/shared/memory',
      tasks: tasks.taskRoot,
      sales: 'codex-agent-threads/shared/sales-opportunities',
      marketing: 'codex-agent-threads/shared/marketing',
      customerSuccess: 'codex-agent-threads/shared/customer-success',
      finance: 'codex-agent-threads/shared/finance',
      engineering: 'codex-agent-threads/shared/engineering',
      assets: 'codex-agent-threads/shared/assets',
    },
  };
}

function buildMetrics(source, generatedAt) {
  return [
    metric('analytics-company-health', 'company health', 'company health score', compositeHealth(source), 66, generatedAt, ['finance', 'sales', 'success', 'marketing', 'engineering', 'tasks'], 'Composite local company health.'),
    metric('analytics-department-health', 'department health', 'average department score', average(buildScorecards(source).map((card) => card.healthScore)), 65, generatedAt, ['department-scorecards'], 'Average deterministic department score.'),
    metric('analytics-sales-performance', 'sales performance', 'active opportunities', source.sales.summary.activeOpportunities, Math.max(0, source.sales.summary.activeOpportunities - 1), generatedAt, ['sales-opportunities'], 'Active local sales opportunities.'),
    metric('analytics-marketing-readiness', 'marketing readiness', 'launch readiness', source.marketing.readiness.launchReadiness.score, 56, generatedAt, ['marketing-readiness'], 'Launch readiness from local marketing records.'),
    metric('analytics-customer-adoption', 'customer success adoption', 'average adoption', source.successSummary.averageAdoption, 50, generatedAt, ['customer-success-health'], 'Average customer adoption.'),
    metric('analytics-revenue-trends', 'finance/revenue trends', 'forecast confidence', average(source.finance.forecasts.map((item) => item.confidence)), 68, generatedAt, ['finance-forecasts'], 'Average forecast confidence.'),
    metric('analytics-engineering-velocity', 'engineering velocity', 'release readiness', buildEngineeringHealth(source.engineering).releaseReadiness.score, 58, generatedAt, ['engineering-releases'], 'Engineering release readiness.'),
    metric('analytics-task-throughput', 'task throughput', 'completion rate', percent(source.tasks.recentlyCompleted.length, source.tasks.openTasks + source.tasks.recentlyCompleted.length), 10, generatedAt, ['shared-tasks'], 'Task completion rate from local queues.'),
    metric('analytics-workflow-throughput', 'workflow throughput', 'blocked dependency count', source.tasks.dependencySummary.blockedByDependencies, 3, generatedAt, ['shared-task-dependencies'], 'Workflow dependency blockers.'),
    metric('analytics-goal-progress', 'goal progress', 'average goal progress', average(source.executivePlanning.goals.map((goal) => goal.progressScore)), 52, generatedAt, ['executive-planning'], 'Average Executive goal progress.'),
    metric('analytics-risk-signals', 'risk signals', 'high risk insight count', buildInsights(source).filter((item) => ['critical', 'high'].includes(item.severity)).length, 4, generatedAt, ['analytics-insights'], 'High-severity local insights.'),
    metric('analytics-opportunity-signals', 'opportunity signals', 'expansion opportunities', source.successSummary.expansionOpportunities + source.sales.summary.proposalReady, 4, generatedAt, ['sales', 'customer-success'], 'Sales proposal-ready plus Customer Success expansion opportunities.'),
  ];
}

function buildInsights(source) {
  return [
    insight('insight-growth-risk', 'Growth risk from goal slippage', 'growth risks', source.executivePlanning.summary.atRiskGoals ? 'high' : 'medium', 78, `${source.executivePlanning.summary.atRiskGoals} Executive goal(s) are at risk.`, source.executivePlanning.goals.map((goal) => goal.goalId), source.tasks.activeWorkQueue.filter((task) => task.assignedAgent === 'Executive').map((task) => task.id), ['executive-planning'], 'Review at-risk goals and supporting tasks.', 'Executive'),
    insight('insight-stalled-sales', 'Stalled sales opportunities', 'stalled sales opportunities', source.sales.summary.awaitingFollowUp ? 'high' : 'medium', 74, `${source.sales.summary.awaitingFollowUp} opportunity item(s) await follow-up.`, ['sales-opportunities'], source.tasks.activeWorkQueue.filter((task) => task.assignedAgent === 'Sales').map((task) => task.id), ['sales-workflows'], 'Prioritize awaiting follow-up opportunities.', 'Sales'),
    insight('insight-campaign-gaps', 'Campaign readiness gaps', 'campaign readiness gaps', source.marketing.readiness.campaignReadiness.score < 75 ? 'high' : 'medium', 82, `Campaign readiness is ${source.marketing.readiness.campaignReadiness.score}%.`, source.marketing.campaigns.map((campaign) => campaign.campaignId), [], ['marketing-campaigns'], 'Close campaign readiness risks before launch messaging.', 'Marketing'),
    insight('insight-churn-exposure', 'Customer churn exposure', 'customer churn exposure', source.successSummary.churnRisks ? 'high' : 'low', 76, `${source.successSummary.churnRisks} customer(s) have churn-risk signals.`, source.success.health.filter((item) => item.riskScore >= 45).map((item) => item.customerId), [], ['customer-health'], 'Review adoption and onboarding risks.', 'Customer Success'),
    insight('insight-revenue-forecast-risk', 'Revenue forecast risk', 'revenue forecast risk', source.financeSummary.revenueRisks ? 'high' : 'medium', 75, `${source.financeSummary.revenueRisks} finance risk signal(s) need review.`, source.finance.health.filter((item) => item.retentionRisk >= 45).map((item) => item.organization), [], ['finance-forecast'], 'Review renewal and expansion risk before forecast decisions.', 'Finance'),
    insight('insight-engineering-bottleneck', 'Engineering bottlenecks', 'engineering bottlenecks', source.engineeringSummary.blockedReleases ? 'high' : 'medium', 80, `${source.engineeringSummary.blockedReleases} release(s) are blocked or below readiness threshold.`, source.engineering.releases.map((release) => release.releaseId), source.engineering.issues.flatMap((issue) => issue.linkedTasks), ['engineering-releases'], 'Clear release blockers before launch work.', 'Engineering'),
    insight('insight-blocked-clusters', 'Blocked task clusters', 'blocked task clusters', source.tasks.blockedTasks ? 'high' : 'low', 86, `${source.tasks.blockedTasks} shared task(s) are blocked and ${source.tasks.overdueTasks} are overdue.`, ['shared-task-queue'], source.tasks.blockedWork.map((task) => task.id), ['universal-task-engine'], 'Review blocked and overdue queues with Operator.', 'Operator'),
    insight('insight-workflow-aging', 'Workflow aging', 'workflow aging', source.tasks.dependencySummary.blockedByDependencies ? 'medium' : 'low', 72, `${source.tasks.dependencySummary.blockedByDependencies} dependency chain(s) are blocked or waiting.`, ['workflow-dependencies'], source.tasks.dependencySummary.tasks.map((task) => task.id), ['workflow-engine'], 'Clear dependency blockers before new work intake.', 'Operator'),
    insight('insight-overdue-decisions', 'Overdue executive decisions', 'overdue executive decisions', source.executivePlanning.summary.executiveAttentionNeeded ? 'high' : 'medium', 78, `${source.executivePlanning.summary.executiveAttentionNeeded} Executive attention item(s) are open.`, source.executivePlanning.decisions.map((decision) => decision.decisionId), source.tasks.activeWorkQueue.filter((task) => task.approvalRequired).map((task) => task.id), ['executive-queue'], 'Review Executive queue decisions.', 'Executive'),
    insight('insight-missing-data', 'Missing data and weak confidence', 'missing data', 'medium', 70, `${source.memory.conflictCount ?? 0} memory conflict(s) and ${source.assets.summary?.underReview ?? 0} asset review item(s) can weaken analytics confidence.`, ['shared-memory', 'asset-library'], [], ['analytics-review'], 'Review conflicts and under-review assets before strategic decisions.', 'Operator'),
  ];
}

function buildScorecards(source) {
  const engineeringHealth = buildEngineeringHealth(source.engineering);
  return [
    scorecard('Executive', average(source.executivePlanning.goals.map((goal) => goal.progressScore)), source.executivePlanning.summary.atRiskGoals ? 'down' : 'flat', [['Goals', source.executivePlanning.summary.totalGoals], ['Attention Needed', source.executivePlanning.summary.executiveAttentionNeeded]], source.executivePlanning.strategicRisks.map((risk) => risk.risk), source.executivePlanning.blockers.map((blocker) => blocker.title), ['Clearer cross-agent priority review.'], ['Review Executive Insights.']),
    scorecard('Sales', source.sales.summary.averageLeadScore, 'up', [['Active Opportunities', source.sales.summary.activeOpportunities], ['Proposal Ready', source.sales.summary.proposalReady]], source.sales.summary.awaitingFollowUp ? ['Awaiting follow-up queue exists.'] : [], [], ['Prioritize high-confidence pipeline.'], ['Review Sales Analytics.']),
    scorecard('Marketing', source.marketing.readiness.launchReadiness.score, 'flat', [['Campaigns', source.marketing.campaigns.length], ['Drafts', source.marketing.drafts?.length ?? 0]], source.marketing.readiness.launchReadiness.risks, [], ['Use release readiness to time launch work.'], ['Close campaign readiness gaps.']),
    scorecard('Customer Success', source.successSummary.averageHealth, source.successSummary.churnRisks ? 'down' : 'flat', [['Customers', source.successSummary.totalCustomers], ['Adoption', `${source.successSummary.averageAdoption}%`]], source.success.health.flatMap((item) => item.risks), [], ['Expansion signals from healthy accounts.'], ['Review adoption analytics.']),
    scorecard('Finance', average(source.finance.forecasts.map((forecast) => forecast.confidence)), 'flat', [['ARR', `$${source.financeSummary.totalEstimatedArr}`], ['Forecast', `$${source.financeSummary.forecastRevenue}`]], source.finance.health.flatMap((item) => item.risks), [], ['Expansion revenue signals.'], ['Review forecast confidence.']),
    scorecard('Engineering', engineeringHealth.productHealth.score, source.engineeringSummary.blockedReleases ? 'down' : 'flat', [['Features', source.engineeringSummary.featureCount], ['Blocked Releases', source.engineeringSummary.blockedReleases]], engineeringHealth.productHealth.risks, source.engineering.issues.filter((issue) => issue.severity === 'Critical').map((issue) => issue.issueId), ['Release readiness can improve launch confidence.'], ['Clear bug and release risks.']),
    scorecard('Operator', Math.max(35, 100 - source.tasks.blockedTasks * 12 - source.tasks.overdueTasks * 8), source.tasks.blockedTasks ? 'down' : 'flat', [['Open Tasks', source.tasks.openTasks], ['Approval Backlog', source.tasks.tasksRequiringExecutiveReview]], source.tasks.blockedWork.map((task) => task.title), source.tasks.overdueWork.map((task) => task.title), ['Blocked work clearance creates leverage.'], ['Review workload analytics.']),
  ];
}

function buildCompanyHealth(scorecards, risks, source) {
  const base = average(scorecards.map((card) => card.healthScore));
  const score = Math.max(0, Math.min(100, base - risks.filter((risk) => risk.severity === 'critical').length * 8 - risks.filter((risk) => risk.severity === 'high').length * 3));
  return {
    score,
    label: score >= 80 ? 'Healthy' : score >= 65 ? 'Watch' : score >= 50 ? 'Attention' : 'Critical',
    confidence: 78,
    explanation: `Composite from ${scorecards.length} department scorecards, ${risks.length} high-risk insights, ${source.tasks.openTasks} open tasks, and local revenue/customer/product records.`,
    risks: risks.map((risk) => risk.title),
    recommendations: ['Review high-severity insights before approving new external work.', 'Use department scorecards for weekly operating review.'],
    nextActions: ['Clear blocked work clusters.', 'Review release readiness and churn exposure.', 'Update weak-confidence source records.'],
  };
}

function buildCrossAgentMetrics(source) {
  return [
    crossMetric('task completion rate', `${percent(source.tasks.recentlyCompleted.length, source.tasks.openTasks + source.tasks.recentlyCompleted.length)}%`, 'flat', 'Universal Task Engine'),
    crossMetric('overdue task count', source.tasks.overdueTasks, source.tasks.overdueTasks ? 'up' : 'flat', 'Universal Task Engine'),
    crossMetric('blocked task count', source.tasks.blockedTasks, source.tasks.blockedTasks ? 'up' : 'flat', 'Universal Task Engine'),
    crossMetric('workflow aging', `${source.tasks.dependencySummary.blockedByDependencies} dependency blocker(s)`, 'flat', 'Shared task dependencies'),
    crossMetric('approval backlog', source.tasks.tasksRequiringExecutiveReview, source.tasks.tasksRequiringExecutiveReview ? 'up' : 'flat', 'Executive Queue'),
    crossMetric('customer onboarding completion', `${average(source.success.onboarding.map((item) => item.progress))}%`, 'up', 'Customer Success'),
    crossMetric('sales pipeline health', `${source.sales.summary.averageLeadScore}/100`, 'up', 'Sales'),
    crossMetric('campaign readiness', `${source.marketing.readiness.campaignReadiness.score}%`, 'flat', 'Marketing'),
    crossMetric('content approval backlog', source.marketing.approvals.filter((item) => item.status !== 'approved').length, 'up', 'Marketing'),
    crossMetric('revenue forecast confidence', `${average(source.finance.forecasts.map((forecast) => forecast.confidence))}%`, 'flat', 'Finance'),
    crossMetric('engineering release readiness', `${buildEngineeringHealth(source.engineering).releaseReadiness.score}%`, 'up', 'Engineering'),
    crossMetric('goal progress', `${average(source.executivePlanning.goals.map((goal) => goal.progressScore))}%`, 'flat', 'Executive Planning'),
  ];
}

function buildTrends(source) {
  return [
    trend('Revenue Trend Insights', `$${source.financeSummary.forecastRevenue}`, 'watch', 'Forecast remains advisory and depends on renewal risk.'),
    trend('Pipeline Trends', source.sales.summary.activeOpportunities, 'up', 'Active pipeline exists but awaiting follow-up needs review.'),
    trend('Campaign Readiness Trends', `${source.marketing.readiness.campaignReadiness.score}%`, 'flat', 'Campaign readiness depends on approvals and product launch timing.'),
    trend('Churn Risk Trends', source.successSummary.churnRisks, source.successSummary.churnRisks ? 'watch' : 'flat', 'Customer health signals indicate retention exposure.'),
    trend('Release Readiness Trends', `${buildEngineeringHealth(source.engineering).releaseReadiness.score}%`, 'watch', 'Release readiness is constrained by local bug and QA risk.'),
    trend('Overdue Queue Trends', source.tasks.overdueTasks, source.tasks.overdueTasks ? 'up' : 'flat', 'Operator should review overdue work before new approvals.'),
  ];
}

function writeAnalyticsStore(snapshot) {
  ensureAnalyticsStorage();
  writeJson(files.metrics, snapshot.metrics);
  writeJson(files.insights, snapshot.insights);
  writeJson(files.scorecards, snapshot.scorecards);
  writeJson(files.risks, snapshot.risks);
  writeJson(files.bottlenecks, snapshot.bottlenecks);
  writeJson(files.trends, snapshot.trends);
  writeJson(files.audit, snapshot.auditHistory);
}

function reportFor(snapshot, department, title) {
  return {
    title,
    generatedAt: snapshot.generatedAt,
    scorecard: snapshot.scorecards.find((item) => item.department === department),
    insights: snapshot.insights.filter((item) => item.ownerAgent === department),
    metrics: snapshot.metrics.filter((item) => item.category.toLowerCase().includes(department.toLowerCase()) || item.sourceRecords.some((source) => source.toLowerCase().includes(department.toLowerCase().replace(/\s+/g, '-')))),
    safety,
  };
}

function ensureAnalyticsStorage() {
  mkdirSync(analyticsRoot, { recursive: true });
  mkdirSync(reportsRoot, { recursive: true });
}

function writeReport(slugName, payload) {
  mkdirSync(reportsRoot, { recursive: true });
  const jsonPath = path.join(reportsRoot, `${slugName}.json`);
  const markdownPath = path.join(reportsRoot, `${slugName}.md`);
  writeJson(jsonPath, payload);
  writeFileSync(markdownPath, `# ${payload.title}\n\nGenerated: ${payload.generatedAt}\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n\nLocal-only analytics safety: no external analytics sync, tracking scripts, customer data collection, autonomous emails, publishing, billing actions, deployment actions, or autonomous external actions.\n`);
  return { slug: slugName, jsonPath: path.relative(repoRoot, jsonPath), markdownPath: path.relative(repoRoot, markdownPath) };
}

function metric(analyticsId, category, metricName, value, previousValue, generatedDate, sourceRecords, explanation) {
  return {
    analyticsId,
    category,
    metric: metricName,
    value,
    previousValue,
    trend: value > previousValue ? 'up' : value < previousValue ? 'down' : 'flat',
    confidence: 78,
    sourceRecords,
    dateRange: 'local-current-state',
    generatedDate,
    explanation,
    risks: value < previousValue ? ['Metric moved down versus previous local snapshot.'] : [],
    recommendations: ['Review source records before taking action.'],
    auditHistory: [{ timestamp: generatedDate, event: 'analytics.metric.generated' }],
  };
}

function insight(insightId, title, category, severity, confidence, explanation, linkedEntities, linkedTasks, linkedWorkflows, recommendedNextAction, ownerAgent) {
  return { insightId, title, category, severity, confidence, explanation, linkedEntities, linkedTasks, linkedWorkflows, recommendedNextAction, ownerAgent, status: 'new' };
}

function scorecard(department, healthScore, trendValue, metrics, risks, blockers, opportunities, recommendations) {
  return { department, healthScore, trend: trendValue, keyMetrics: metrics.map(([label, value]) => ({ label, value: String(value) })), risks, blockers, opportunities, recommendations };
}

function crossMetric(metricName, value, trendValue, source) {
  return { metric: metricName, value: String(value), trend: trendValue, source };
}

function trend(label, value, trendValue, explanation) {
  return { label, value: String(value), trend: trendValue, explanation };
}

function buildEngineeringHealth(store) {
  const summary = summarizeEngineering(store);
  const blockerIssues = store.issues.filter((issue) => ['Critical', 'High'].includes(issue.severity) && !['done', 'closed'].includes(issue.status)).length;
  const averageReleaseReadiness = average(store.releases.map((release) => release.readinessScore));
  const releaseRisks = store.releases.flatMap((release) => release.risks);
  return {
    releaseReadiness: { score: averageReleaseReadiness, risks: releaseRisks },
    productHealth: { score: Math.round((summary.averageRoadmapProgress + averageReleaseReadiness + (100 - blockerIssues * 12)) / 3), risks: [...releaseRisks, ...store.roadmaps.flatMap((roadmap) => roadmap.risks)] },
  };
}

function summarizeMarketing(store) {
  return {
    campaigns: store.campaigns.length,
    approvalsPending: store.approvals.filter((item) => item.status === 'pending').length,
    averageReadiness: average(Object.values(store.readiness).map((item) => item.score)),
  };
}

function summarizeSuccess(store) {
  return {
    totalCustomers: store.customers.length,
    averageHealth: average(store.health.map((item) => item.healthScore)),
    averageAdoption: average(store.health.map((item) => item.adoptionScore)),
    churnRisks: store.health.filter((item) => item.riskScore >= 45).length,
    expansionOpportunities: store.expansion.filter((item) => item.score >= 60).length,
  };
}

function summarizeFinance(store) {
  return {
    totalEstimatedArr: store.revenue.reduce((sum, row) => sum + row.forecast.arrContribution, 0),
    forecastRevenue: store.forecasts.find((item) => item.period === 'annual')?.forecastRevenue ?? 0,
    revenueRisks: store.health.filter((item) => item.retentionRisk >= 45).length,
  };
}

function summarizeEngineering(store) {
  return {
    featureCount: store.features.length,
    averageRoadmapProgress: average(store.roadmaps.map((roadmap) => roadmap.progress)),
    blockedReleases: store.releases.filter((release) => release.qaStatus === 'blocked' || release.readinessScore < 65).length,
  };
}

function compositeHealth(source) {
  return average([
    source.financeSummary.forecastRevenue ? 74 : 55,
    source.sales.summary.activeOpportunities ? 72 : 50,
    source.successSummary.averageHealth,
    source.marketing.readiness.launchReadiness.score,
    buildEngineeringHealth(source.engineering).productHealth.score,
    Math.max(35, 100 - source.tasks.blockedTasks * 12 - source.tasks.overdueTasks * 8),
  ]);
}

function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function average(values) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1));
}

function percent(numerator, denominator) {
  return Math.round((numerator / Math.max(denominator, 1)) * 100);
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function stamp() {
  return new Date().toISOString();
}
