import type { SalesOpportunityPipelineSummary } from '../agents/sales/salesTypes';
import type { CustomerSuccessDashboardSummary } from './customerSuccess';
import type { EngineeringProductOperationsSummary } from './engineeringProductOperations';
import type { ExecutivePlanningSummary } from './executivePlanning';
import type { FinanceDashboardSummary } from './financeIntelligence';
import type { MarketingDashboardSummary } from './marketingIntelligence';
import type { SharedTaskDashboardSummary } from './sharedTaskQueue';

export interface AnalyticsMetricRecord {
  analyticsId: string;
  category: string;
  metric: string;
  value: number;
  previousValue: number;
  trend: 'up' | 'down' | 'flat';
  confidence: number;
  sourceRecords: string[];
  dateRange: string;
  generatedDate: string;
  explanation: string;
  risks: string[];
  recommendations: string[];
}

export interface AnalyticsInsight {
  insightId: string;
  title: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  explanation: string;
  linkedEntities: string[];
  linkedTasks: string[];
  linkedWorkflows: string[];
  recommendedNextAction: string;
  ownerAgent: string;
  status: 'new' | 'acknowledged' | 'assigned' | 'in_review' | 'resolved' | 'archived';
}

export interface DepartmentScorecard {
  department: string;
  healthScore: number;
  trend: 'up' | 'down' | 'flat';
  keyMetrics: Array<{ label: string; value: string }>;
  risks: string[];
  blockers: string[];
  opportunities: string[];
  recommendations: string[];
}

export interface CompanyHealthScore {
  score: number;
  label: string;
  confidence: number;
  explanation: string;
  risks: string[];
  recommendations: string[];
  nextActions: string[];
}

export interface AnalyticsInsightsSummary {
  metrics: AnalyticsMetricRecord[];
  insights: AnalyticsInsight[];
  scorecards: DepartmentScorecard[];
  risks: AnalyticsInsight[];
  bottlenecks: AnalyticsInsight[];
  trends: Array<{ label: string; value: string; trend: string; explanation: string }>;
  companyHealth: CompanyHealthScore;
  crossAgentMetrics: Array<{ metric: string; value: string; trend: string; source: string }>;
  recommendations: string[];
  safety: {
    localOnly: boolean;
    externalAnalyticsSync: boolean;
    trackingScripts: boolean;
    customerDataCollection: boolean;
    autonomousExternalActions: boolean;
    advisoryOnly: boolean;
  };
}

export function buildDashboardAnalyticsInsights(input: {
  customerSuccess: CustomerSuccessDashboardSummary;
  engineeringProductOperations: EngineeringProductOperationsSummary;
  executivePlanning: ExecutivePlanningSummary;
  finance: FinanceDashboardSummary;
  marketing: MarketingDashboardSummary;
  salesOpportunitySummary: SalesOpportunityPipelineSummary;
  sharedTasks: SharedTaskDashboardSummary;
}): AnalyticsInsightsSummary {
  const generatedDate = new Date().toISOString();
  const metrics = buildMetrics(input, generatedDate);
  const scorecards = buildScorecards(input);
  const insights = buildInsights(input);
  const risks = insights.filter((insight) => ['critical', 'high'].includes(insight.severity));
  const bottlenecks = insights.filter((insight) => /bottleneck|blocked|aging|backlog/i.test(`${insight.title} ${insight.explanation}`));
  const companyHealth = buildCompanyHealth(scorecards, risks, input);
  return {
    metrics,
    insights,
    scorecards,
    risks,
    bottlenecks,
    trends: buildTrends(input),
    companyHealth,
    crossAgentMetrics: buildCrossAgentMetrics(input),
    recommendations: unique([...companyHealth.recommendations, ...insights.map((insight) => insight.recommendedNextAction)]).slice(0, 10),
    safety: {
      localOnly: true,
      externalAnalyticsSync: false,
      trackingScripts: false,
      customerDataCollection: false,
      autonomousExternalActions: false,
      advisoryOnly: true,
    },
  };
}

function buildMetrics(input: Parameters<typeof buildDashboardAnalyticsInsights>[0], generatedDate: string): AnalyticsMetricRecord[] {
  const range = 'local-current-state';
  return [
    metric('company-health', 'Company Health', 'company health score', average([
      input.finance.summary.forecastRevenue ? 74 : 55,
      input.salesOpportunitySummary.activeOpportunities ? 72 : 50,
      input.customerSuccess.summary.averageHealth,
      input.marketing.executiveOverview.brandHealth,
      input.engineeringProductOperations.health.productHealth.score,
      100 - input.sharedTasks.blockedTasks * 10,
    ]), 68, generatedDate, range, ['finance', 'sales', 'customer-success', 'marketing', 'engineering', 'tasks'], 'Composite local health score across operating agents.'),
    metric('sales-pipeline', 'Sales Performance', 'active opportunities', input.salesOpportunitySummary.activeOpportunities, Math.max(0, input.salesOpportunitySummary.activeOpportunities - 1), generatedDate, range, ['sales-opportunities'], 'Active local sales opportunities.'),
    metric('marketing-readiness', 'Marketing Readiness', 'launch readiness', input.marketing.readiness.launchReadiness.score, 56, generatedDate, range, ['marketing-readiness'], 'Local launch readiness from brand, campaign, and content records.'),
    metric('customer-adoption', 'Customer Success Adoption', 'average adoption', input.customerSuccess.summary.averageAdoption, 50, generatedDate, range, ['customer-success-health'], 'Average adoption across local customer success health records.'),
    metric('revenue-forecast', 'Finance Trends', 'forecast confidence', average(input.finance.forecasts.map((forecast) => forecast.confidence)), 68, generatedDate, range, ['finance-forecasts'], 'Average confidence across local finance forecasts.'),
    metric('engineering-readiness', 'Engineering Velocity', 'release readiness', input.engineeringProductOperations.health.releaseReadiness.score, 58, generatedDate, range, ['engineering-releases'], 'Release readiness from local Engineering Product Operations records.'),
    metric('task-throughput', 'Task Throughput', 'completion rate', percent(input.sharedTasks.completedToday.length, input.sharedTasks.openTasks + input.sharedTasks.completedToday.length), 10, generatedDate, range, ['shared-tasks'], 'Completed-today tasks as a share of active and completed local work.'),
    metric('goal-progress', 'Goal Progress', 'average goal progress', average(input.executivePlanning.goals.map((goal) => goal.progressScore)), 52, generatedDate, range, ['executive-planning'], 'Average progress across local Executive goals.'),
  ];
}

function buildInsights(input: Parameters<typeof buildDashboardAnalyticsInsights>[0]): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [
    insight('insight-growth-risk', 'Growth risk from pipeline and goal slippage', 'growth risks', input.executivePlanning.summary.atRiskGoals ? 'high' : 'medium', 78, `${input.executivePlanning.summary.atRiskGoals} goal(s) are at risk while pipeline work still needs review.`, input.executivePlanning.goals.map((goal) => goal.goalId), input.sharedTasks.executiveQueue.map((task) => task.id), ['executive-planning'], 'Review at-risk goals and sales pipeline blockers.', 'Executive'),
    insight('insight-sales-stalled', 'Stalled opportunity signals', 'stalled sales opportunities', input.salesOpportunitySummary.awaitingFollowUp ? 'high' : 'medium', 74, `${input.salesOpportunitySummary.awaitingFollowUp} local opportunity signal(s) appear stalled or waiting.`, ['sales-opportunities'], input.sharedTasks.salesQueue.map((task) => task.id), ['sales-workflows'], 'Prioritize stalled opportunities with high confidence and clear next actions.', 'Sales'),
    insight('insight-campaign-readiness', 'Campaign readiness gaps', 'campaign readiness gaps', input.marketing.readiness.launchReadiness.score < 70 ? 'high' : 'medium', 82, `Marketing launch readiness is ${input.marketing.readiness.launchReadiness.score}%.`, input.marketing.campaigns.map((campaign) => campaign.campaignId), [], ['marketing-campaigns'], 'Close launch readiness risks before external messaging.', 'Marketing'),
    insight('insight-churn-exposure', 'Customer churn exposure', 'customer churn exposure', input.customerSuccess.summary.churnRisks ? 'high' : 'low', 76, `${input.customerSuccess.summary.churnRisks} customer(s) have churn-risk signals.`, input.customerSuccess.health.filter((item) => item.riskScore >= 45).map((item) => item.customerId), [], ['customer-health'], 'Review adoption and onboarding risk accounts.', 'Customer Success'),
    insight('insight-revenue-risk', 'Revenue forecast risk', 'revenue forecast risk', input.finance.summary.revenueRisks ? 'high' : 'medium', 75, `${input.finance.summary.revenueRisks} revenue risk signal(s) are present in local finance health.`, input.finance.health.filter((item) => item.retentionRisk >= 45).map((item) => item.organization), [], ['finance-forecast'], 'Review renewal and expansion risk before forecast decisions.', 'Finance'),
    insight('insight-engineering-bottleneck', 'Engineering bottlenecks in release readiness', 'engineering bottlenecks', input.engineeringProductOperations.summary.blockedReleases ? 'high' : 'medium', 80, `${input.engineeringProductOperations.summary.blockedReleases} release(s) are blocked or below readiness threshold.`, input.engineeringProductOperations.releases.map((release) => release.releaseId), input.engineeringProductOperations.issues.flatMap((issue) => issue.linkedTasks), ['engineering-releases'], 'Clear release blockers before planning launch work.', 'Engineering'),
    insight('insight-blocked-task-cluster', 'Blocked task clusters', 'blocked task clusters', input.sharedTasks.blockedTasks ? 'high' : 'low', 86, `${input.sharedTasks.blockedTasks} shared task(s) are blocked and ${input.sharedTasks.overdueTasks} are overdue.`, ['shared-task-queue'], input.sharedTasks.blockedWork.map((task) => task.id), ['universal-task-engine'], 'Review blocked and overdue queues with Operator.', 'Operator'),
    insight('insight-missing-data', 'Weak confidence and missing data areas', 'missing data', 'medium', 70, 'Several local insights depend on deterministic seed records and should be reviewed before strategic decisions.', ['shared-memory', 'asset-library'], [], ['analytics-review'], 'Review low-confidence insights and missing source links.', 'Operator'),
  ];
  return insights;
}

function buildScorecards(input: Parameters<typeof buildDashboardAnalyticsInsights>[0]): DepartmentScorecard[] {
  return [
    scorecard('Executive', average(input.executivePlanning.goals.map((goal) => goal.progressScore)), input.executivePlanning.summary.atRiskGoals ? 'down' : 'flat', [['Goals', input.executivePlanning.summary.totalGoals], ['Attention Needed', input.executivePlanning.summary.executiveAttentionNeeded]], input.executivePlanning.strategicRisks.map((risk) => risk.risk), input.executivePlanning.blockers.map((blocker) => blocker.title), ['Better cross-agent priority clarity.'], ['Review Executive Insights and KPI Trend Insights.']),
    scorecard('Sales', input.salesOpportunitySummary.averageLeadScore, 'up', [['Active Opportunities', input.salesOpportunitySummary.activeOpportunities], ['Proposal Ready', input.salesOpportunitySummary.proposalReady]], input.salesOpportunitySummary.awaitingFollowUp ? ['Awaiting follow-up opportunities need review.'] : [], [], ['Prioritize warm/high-confidence pipeline.'], ['Review stalled opportunity insights.']),
    scorecard('Marketing', input.marketing.readiness.launchReadiness.score, input.marketing.readiness.launchReadiness.score >= 60 ? 'up' : 'flat', [['Campaigns', input.marketing.campaigns.length], ['Drafts', input.marketing.contentStudio.summary.drafts]], input.marketing.readiness.launchReadiness.risks, [], ['Use product release signals for launch planning.'], ['Close campaign readiness gaps.']),
    scorecard('Customer Success', input.customerSuccess.summary.averageHealth, input.customerSuccess.summary.churnRisks ? 'down' : 'flat', [['Customers', input.customerSuccess.summary.totalCustomers], ['Adoption', `${input.customerSuccess.summary.averageAdoption}%`]], input.customerSuccess.health.flatMap((item) => item.risks), [], ['Expansion opportunities from healthy accounts.'], ['Review churn risk trends.']),
    scorecard('Finance', average(input.finance.forecasts.map((forecast) => forecast.confidence)), input.finance.summary.forecastRevenue >= input.finance.summary.totalEstimatedArr ? 'up' : 'flat', [['ARR', `$${input.finance.summary.totalEstimatedArr}`], ['Forecast', `$${input.finance.summary.forecastRevenue}`]], input.finance.health.flatMap((item) => item.risks), [], ['Expansion revenue signals.'], ['Review forecast confidence and renewal risks.']),
    scorecard('Engineering', input.engineeringProductOperations.health.productHealth.score, input.engineeringProductOperations.summary.blockedReleases ? 'down' : 'flat', [['Features', input.engineeringProductOperations.summary.featureCount], ['Blocked Releases', input.engineeringProductOperations.summary.blockedReleases]], input.engineeringProductOperations.health.productHealth.risks, input.engineeringProductOperations.issues.filter((issue) => issue.severity === 'Critical').map((issue) => issue.issueId), ['Release readiness improves launch confidence.'], ['Clear bug/issue risk signals.']),
    scorecard('Operator', Math.max(35, 100 - input.sharedTasks.blockedTasks * 12 - input.sharedTasks.overdueTasks * 8), input.sharedTasks.blockedTasks ? 'down' : 'flat', [['Open Tasks', input.sharedTasks.openTasks], ['Approval Backlog', input.sharedTasks.tasksRequiringExecutiveReview]], input.sharedTasks.blockedWork.map((task) => task.title), input.sharedTasks.overdueWork.map((task) => task.title), ['Blocked work clearance creates leverage.'], ['Review workload analytics and blocked clusters.']),
  ];
}

function buildCompanyHealth(scorecards: DepartmentScorecard[], risks: AnalyticsInsight[], input: Parameters<typeof buildDashboardAnalyticsInsights>[0]): CompanyHealthScore {
  const base = average(scorecards.map((card) => card.healthScore));
  const score = Math.max(0, Math.min(100, base - risks.filter((risk) => risk.severity === 'critical').length * 8 - risks.filter((risk) => risk.severity === 'high').length * 3));
  return {
    score,
    label: score >= 80 ? 'Healthy' : score >= 65 ? 'Watch' : score >= 50 ? 'Attention' : 'Critical',
    confidence: average([78, ...scorecards.map((card) => Math.min(90, card.healthScore + 10))]),
    explanation: `Composite from ${scorecards.length} department scorecards, ${risks.length} high-risk insights, ${input.sharedTasks.openTasks} open tasks, and local revenue/customer/product records.`,
    risks: risks.map((risk) => risk.title),
    recommendations: ['Review high-severity insights before approving new external work.', 'Use department scorecards for weekly operating review.'],
    nextActions: ['Clear blocked work clusters.', 'Review release readiness and churn exposure.', 'Update weak-confidence source records.'],
  };
}

function buildCrossAgentMetrics(input: Parameters<typeof buildDashboardAnalyticsInsights>[0]) {
  return [
    { metric: 'task completion rate', value: `${percent(input.sharedTasks.completedToday.length, input.sharedTasks.openTasks + input.sharedTasks.completedToday.length)}%`, trend: 'flat', source: 'Universal Task Engine' },
    { metric: 'overdue task count', value: String(input.sharedTasks.overdueTasks), trend: input.sharedTasks.overdueTasks ? 'up' : 'flat', source: 'Universal Task Engine' },
    { metric: 'blocked task count', value: String(input.sharedTasks.blockedTasks), trend: input.sharedTasks.blockedTasks ? 'up' : 'flat', source: 'Universal Task Engine' },
    { metric: 'workflow aging', value: `${input.sharedTasks.dependencySummary.blockedByDependencies} dependency blocker(s)`, trend: 'flat', source: 'Shared task dependencies' },
    { metric: 'approval backlog', value: String(input.sharedTasks.tasksRequiringExecutiveReview), trend: input.sharedTasks.tasksRequiringExecutiveReview ? 'up' : 'flat', source: 'Executive Queue' },
    { metric: 'customer onboarding completion', value: `${average(input.customerSuccess.onboarding.map((item) => item.progress))}%`, trend: 'up', source: 'Customer Success' },
    { metric: 'sales pipeline health', value: `${input.salesOpportunitySummary.averageLeadScore}/100`, trend: 'up', source: 'Sales' },
    { metric: 'campaign readiness', value: `${input.marketing.readiness.campaignReadiness.score}%`, trend: 'flat', source: 'Marketing' },
    { metric: 'content approval backlog', value: String(input.marketing.contentStudio.summary.needsReview), trend: input.marketing.contentStudio.summary.needsReview ? 'up' : 'flat', source: 'Marketing Content Studio' },
    { metric: 'revenue forecast confidence', value: `${average(input.finance.forecasts.map((forecast) => forecast.confidence))}%`, trend: 'flat', source: 'Finance' },
    { metric: 'engineering release readiness', value: `${input.engineeringProductOperations.health.releaseReadiness.score}%`, trend: 'up', source: 'Engineering' },
    { metric: 'goal progress', value: `${average(input.executivePlanning.goals.map((goal) => goal.progressScore))}%`, trend: 'flat', source: 'Executive Planning' },
  ];
}

function buildTrends(input: Parameters<typeof buildDashboardAnalyticsInsights>[0]) {
  return [
    { label: 'Revenue Trend Insights', value: `$${input.finance.summary.forecastRevenue}`, trend: 'watch', explanation: 'Forecast remains advisory and depends on renewal risk.' },
    { label: 'Pipeline Trends', value: String(input.salesOpportunitySummary.activeOpportunities), trend: 'up', explanation: 'Active pipeline exists but stalled opportunities need review.' },
    { label: 'Campaign Readiness Trends', value: `${input.marketing.readiness.campaignReadiness.score}%`, trend: 'flat', explanation: 'Campaign readiness depends on approvals and product launch timing.' },
    { label: 'Churn Risk Trends', value: String(input.customerSuccess.summary.churnRisks), trend: input.customerSuccess.summary.churnRisks ? 'watch' : 'flat', explanation: 'Customer health signals indicate retention exposure.' },
    { label: 'Release Readiness Trends', value: `${input.engineeringProductOperations.health.releaseReadiness.score}%`, trend: 'watch', explanation: 'Release readiness is constrained by local bug and QA risk.' },
    { label: 'Overdue Queue Trends', value: String(input.sharedTasks.overdueTasks), trend: input.sharedTasks.overdueTasks ? 'up' : 'flat', explanation: 'Operator should review overdue work before new approvals.' },
  ];
}

function metric(analyticsId: string, category: string, metricName: string, value: number, previousValue: number, generatedDate: string, dateRange: string, sourceRecords: string[], explanation: string): AnalyticsMetricRecord {
  return {
    analyticsId,
    category,
    metric: metricName,
    value,
    previousValue,
    trend: value > previousValue ? 'up' : value < previousValue ? 'down' : 'flat',
    confidence: 78,
    sourceRecords,
    dateRange,
    generatedDate,
    explanation,
    risks: value < previousValue ? ['Metric moved down versus previous local snapshot.'] : [],
    recommendations: ['Review source records before taking action.'],
  };
}

function insight(insightId: string, title: string, category: string, severity: AnalyticsInsight['severity'], confidence: number, explanation: string, linkedEntities: string[], linkedTasks: string[], linkedWorkflows: string[], recommendedNextAction: string, ownerAgent: string): AnalyticsInsight {
  return { insightId, title, category, severity, confidence, explanation, linkedEntities, linkedTasks, linkedWorkflows, recommendedNextAction, ownerAgent, status: 'new' };
}

function scorecard(department: string, healthScore: number, trend: DepartmentScorecard['trend'], metrics: Array<[string, string | number]>, risks: string[], blockers: string[], opportunities: string[], recommendations: string[]): DepartmentScorecard {
  return { department, healthScore, trend, keyMetrics: metrics.map(([label, value]) => ({ label, value: String(value) })), risks, blockers, opportunities, recommendations };
}

function average(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1));
}

function percent(numerator: number, denominator: number) {
  return Math.round((numerator / Math.max(denominator, 1)) * 100);
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
