import { Workflow } from 'lucide-react';
import type { ReactNode } from 'react';
import { buildExecutiveHealthRows, buildExecutiveSummary } from './executiveSummary';
import { ExecutiveApprovals } from './ExecutiveApprovals';
import { ExecutiveHealth } from './ExecutiveHealth';
import { ExecutiveOverview } from './ExecutiveOverview';
import { ExecutivePriorities } from './ExecutivePriorities';
import { ExecutiveReports } from './ExecutiveReports';
import { ExecutiveRuntime } from './ExecutiveRuntime';
import { ExecutiveTimeline } from './ExecutiveTimeline';
import type { ExecutiveDashboardProps } from './executiveTypes';

export default function ExecutiveDashboard({
  connectorReadiness,
  crossAgentSummary,
  email,
  engineeringTasks,
  executiveAutomation,
  executiveEmailBriefing,
  executiveOperations,
  executivePlanning,
  finance,
  marketing,
  assetLibrary,
  customerSuccess,
  githubPlanning,
  githubReadOnly,
  integrationWarnings = [],
  onNavigate,
  projectRegistry,
  releaseReadiness,
  releaseShipPlans,
  repositoryIntelligence,
  runtime,
  salesAgentTeamSummary,
  salesIntelligenceSummary,
  salesPipelineAnalytics,
  salesOrganizationIntelligenceSummary,
  sharedMemory,
  salesIntegration,
  salesProposalSummary,
  salesProspectDossierSummary,
  salesResearchIntelligenceSummary,
  salesScoringSummary,
  salesWorkflowSummary,
  salesSummary,
  sharedTaskSummary,
  analytics,
}: ExecutiveDashboardProps) {
  const summary = buildExecutiveSummary(
    runtime,
    integrationWarnings,
    salesSummary,
    salesIntegration,
    salesScoringSummary,
    salesProposalSummary,
    salesAgentTeamSummary,
    salesProspectDossierSummary,
    salesIntelligenceSummary,
    crossAgentSummary,
    connectorReadiness,
    email,
    engineeringTasks,
    executiveAutomation,
    executiveEmailBriefing,
    executiveOperations,
    githubPlanning,
    githubReadOnly,
    projectRegistry,
    releaseReadiness,
    releaseShipPlans,
    repositoryIntelligence,
    sharedTaskSummary,
  );
  const healthRows = buildExecutiveHealthRows(runtime);

  return (
    <>
      <ExecutiveOverview summary={summary} />
      <section className="dashboard-grid executive-dashboard-grid">
        <ExecutivePriorities onNavigate={onNavigate} priorities={summary.priorities} />
        {sharedMemory ? <ExecutiveKnowledgeSummaryPanel sharedMemory={sharedMemory} /> : null}
        {salesPipelineAnalytics ? <ExecutiveSalesIntelligencePanel analytics={salesPipelineAnalytics} /> : null}
        {salesOrganizationIntelligenceSummary ? <ExecutiveRelationshipSummaryPanel summary={salesOrganizationIntelligenceSummary} /> : null}
        {salesResearchIntelligenceSummary ? <ExecutiveResearchIntelligencePanel summary={salesResearchIntelligenceSummary} /> : null}
        {salesWorkflowSummary ? <ExecutiveSalesWorkflowPanel summary={salesWorkflowSummary} /> : null}
        {executivePlanning ? <ExecutivePlanningPanel planning={executivePlanning} /> : null}
        {analytics ? <ExecutiveAnalyticsPanel analytics={analytics} /> : null}
        {assetLibrary ? <ExecutiveAssetLibraryPanel assetLibrary={assetLibrary} /> : null}
        {customerSuccess ? <ExecutiveCustomerSuccessPanel customerSuccess={customerSuccess} /> : null}
        {finance ? <ExecutiveFinancePanel finance={finance} /> : null}
        {marketing ? <ExecutiveMarketingOverviewPanel marketing={marketing} /> : null}
        {sharedTaskSummary ? <ExecutiveWorkQueuePanel sharedTaskSummary={sharedTaskSummary} /> : null}
        {summary.executiveOperations ? <ExecutiveOperationsCenterPanel operations={summary.executiveOperations} /> : null}
        {summary.executiveEmailBriefing ? <ExecutiveEmailBriefingPanel briefing={summary.executiveEmailBriefing} /> : null}
        <ExecutiveTimeline timeline={summary.timeline} />
        <ExecutiveRuntime runtime={summary.runtime} />
        {summary.executiveAutomation ? <ExecutiveAutomationPanel automation={summary.executiveAutomation} /> : null}
        {summary.projectRegistry ? <ExecutiveProjectRegistryPanel projectRegistry={summary.projectRegistry} /> : null}
        {summary.releaseReadiness ? <ExecutiveReleaseReadinessPanel releaseReadiness={summary.releaseReadiness} /> : null}
        {summary.releaseShipPlans ? <ExecutiveShipPlanPanel releaseShipPlans={summary.releaseShipPlans} /> : null}
        <ExecutiveHealth healthRows={healthRows} onNavigate={onNavigate} />
        <ExecutiveApprovals approvals={runtime.approvals} />
        <ExecutiveReports context={{ healthRows, runtime, summary }} />
      </section>
    </>
  );
}

function ExecutiveFinancePanel({ finance }: { finance: NonNullable<ExecutiveDashboardProps['finance']> }) {
  const risks = finance.health.filter((item) => item.retentionRisk >= 40);
  return (
    <section className="panel wide-panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Executive Revenue Summary</h2>
        </div>
        <span>local only</span>
      </div>
      <div className="batch-grid">
        <div className="fact"><span>MRR Summary</span><strong>${finance.summary.totalEstimatedMrr.toLocaleString()}</strong></div>
        <div className="fact"><span>ARR Summary</span><strong>${finance.summary.totalEstimatedArr.toLocaleString()}</strong></div>
        <div className="fact"><span>Revenue Forecast</span><strong>${finance.summary.forecastRevenue.toLocaleString()}</strong></div>
        <div className="fact"><span>Growth Trends</span><strong>${finance.summary.expansionRevenue.toLocaleString()}</strong></div>
        <div className="fact"><span>Expansion Pipeline</span><strong>{finance.health.filter((item) => item.expansionOpportunity > 0).length}</strong></div>
        <div className="fact"><span>Renewal Health</span><strong>{Math.round(finance.health.reduce((sum, row) => sum + row.renewalReadiness, 0) / Math.max(finance.health.length, 1))}%</strong></div>
        <div className="fact"><span>Revenue Risks</span><strong>{risks.length}</strong></div>
      </div>
      <DataTable
        columns={['Revenue Risks', 'Retention Risk', 'Renewal', 'Next Action']}
        rows={risks.map((item) => [item.organization, `${item.retentionRisk}%`, `${item.renewalReadiness}%`, item.nextActions[0]])}
        emptyMessage="No Executive revenue risks above review threshold."
      />
      <p className="subtle-note">Finance intelligence is advisory and local. It does not mutate Stripe, send invoices, collect payments, sync accounting, or approve billing changes.</p>
    </section>
  );
}

function ExecutiveAnalyticsPanel({ analytics }: { analytics: NonNullable<ExecutiveDashboardProps['analytics']> }) {
  const executiveInsights = analytics.insights.filter((insight) => insight.ownerAgent === 'Executive');
  return (
    <section className="panel wide-panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Executive Insights</h2>
        </div>
        <span>{analytics.companyHealth.label}</span>
      </div>
      <div className="batch-grid">
        <div className="fact"><span>Company Health Score</span><strong>{analytics.companyHealth.score}/100</strong></div>
        <div className="fact"><span>Department Health</span><strong>{analytics.scorecards.length}</strong></div>
        <div className="fact"><span>Strategic Risk Signals</span><strong>{analytics.risks.length}</strong></div>
        <div className="fact"><span>KPI Trend Insights</span><strong>{analytics.trends.length}</strong></div>
      </div>
      <div className="activity-list">
        {executiveInsights.map((insight) => (
          <p key={insight.insightId}>
            <strong>{insight.title}</strong>: {insight.recommendedNextAction}
          </p>
        ))}
      </div>
      <p className="subtle-note">{analytics.companyHealth.explanation}</p>
    </section>
  );
}

function ExecutiveMarketingOverviewPanel({ marketing }: { marketing: NonNullable<ExecutiveDashboardProps['marketing']> }) {
  return (
    <section className="panel wide-panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Marketing Overview</h2>
        </div>
        <span>{marketing.executiveOverview.approvalsPending} approvals pending</span>
      </div>
      <div className="batch-grid">
        <div className="fact"><span>Brand Health</span><strong>{marketing.executiveOverview.brandHealth}%</strong></div>
        <div className="fact"><span>Campaign Pipeline</span><strong>{marketing.executiveOverview.campaignPipeline}</strong></div>
        <div className="fact"><span>Content Progress</span><strong>{marketing.executiveOverview.contentProgress}</strong></div>
        <div className="fact"><span>Upcoming Launches</span><strong>{marketing.executiveOverview.upcomingLaunches}</strong></div>
      </div>
      <DataTable
        columns={['Campaign Pipeline', 'Audience', 'Status', 'Risk']}
        rows={marketing.campaigns.map((campaign) => [campaign.name, campaign.audience.join(', '), campaign.status, campaign.risks.join('; ') || 'No major risk'])}
      />
      <DataTable
        columns={['Upcoming Launches', 'Date', 'Publishing', 'Status']}
        rows={marketing.calendar.map((item) => [item.title, item.date.slice(0, 10), item.publishingEnabled ? 'Enabled' : 'Disabled', item.status])}
      />
      <div className="dashboard-subsection">
        <h3>Marketing Draft Pipeline</h3>
        <DataTable
          columns={['Draft', 'Type', 'Status', 'Brand Check']}
          rows={marketing.contentStudio.drafts.slice(0, 8).map((draft) => [draft.title, draft.type, draft.status, `${draft.brandConsistencyScore}%`])}
        />
      </div>
      <div className="dashboard-subsection">
        <h3>Brand Risk Queue</h3>
        <DataTable
          columns={['Draft', 'Score', 'Risk', 'Next Action']}
          rows={marketing.contentStudio.brandChecks
            .filter((check) => check.risks.length || check.violations.length)
            .map((check) => [
              marketing.contentStudio.drafts.find((draft) => draft.draftId === check.draftId)?.title ?? check.draftId,
              `${check.score}%`,
              check.risks.join('; ') || check.violations.join('; '),
              check.nextActions[0],
            ])}
          emptyMessage="No brand risks in the draft queue."
        />
      </div>
      <div className="dashboard-subsection">
        <h3>Campaign Readiness</h3>
        <DataTable
          columns={['Scope', 'Drafts', 'Needs Review', 'Avg Readiness']}
          rows={[['Content Studio', String(marketing.contentStudio.summary.drafts), String(marketing.contentStudio.summary.needsReview), `${marketing.contentStudio.summary.averageReadiness}%`]]}
        />
      </div>
      <div className="dashboard-subsection">
        <h3>Launch Content Status</h3>
        <DataTable
          columns={['Draft', 'Campaign', 'Status', 'Approval']}
          rows={marketing.contentStudio.drafts
            .filter((draft) => draft.type === 'launch announcement' || draft.type === 'release note')
            .map((draft) => [draft.title, draft.campaign, draft.status, draft.approvalStatus])}
        />
      </div>
      <p className="subtle-note">Executive Marketing Overview is read-only and local. It does not publish, post, email, buy ads, sync CRM data, or approve marketing automatically.</p>
    </section>
  );
}

function ExecutiveAssetLibraryPanel({ assetLibrary }: { assetLibrary: NonNullable<ExecutiveDashboardProps['assetLibrary']> }) {
  const executiveAssets = assetLibrary.assets.filter((asset) => asset.category === 'Executive' || asset.usageReferences.includes('Executive'));
  const policyRecords = assetLibrary.knowledge.filter((item) => item.title.includes('Policy') || item.category === 'Executive');
  return (
    <section className="panel wide-panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Executive Knowledge Base</h2>
        </div>
        <span>{assetLibrary.summary.approvedAssets} approved assets</span>
      </div>
      <DataTable
        columns={['Executive Knowledge Base', 'Type', 'Confidence', 'Linked Assets']}
        rows={assetLibrary.knowledge
          .filter((item) => item.usageReferences.includes('Executive') || item.category === 'Executive')
          .map((item) => [item.title, item.recordType, `${item.confidence}%`, String(item.linkedAssets.length)])}
      />
      <div className="dashboard-subsection">
        <h3>Strategic Documents</h3>
        <DataTable
          columns={['Document', 'Owner', 'Reference', 'Approval']}
          rows={executiveAssets.map((asset) => [asset.title, asset.owner, asset.localFileReference, asset.approvalStatus])}
        />
      </div>
      <div className="dashboard-subsection">
        <h3>Roadmaps</h3>
        <DataTable
          columns={['Roadmap', 'Products', 'Usage', 'Status']}
          rows={assetLibrary.assets
            .filter((asset) => asset.tags.includes('planning') || asset.tags.includes('architecture'))
            .map((asset) => [asset.title, asset.products.join(', '), asset.usageReferences.join(', '), asset.approvalStatus])}
        />
      </div>
      <DataTable
        columns={['Policy Library', 'Category', 'Version', 'Approval']}
        rows={policyRecords.map((item) => [item.title, item.category, item.version, item.approvalStatus])}
      />
      <p className="subtle-note">Executive asset visibility is read-only and local. It does not approve assets, publish documents, sync files, or distribute resources externally.</p>
    </section>
  );
}

function ExecutiveCustomerSuccessPanel({ customerSuccess }: { customerSuccess: NonNullable<ExecutiveDashboardProps['customerSuccess']> }) {
  return (
    <section className="panel wide-panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Customer Health Summary</h2>
        </div>
        <span>{customerSuccess.summary.churnRisks} churn risk(s)</span>
      </div>
      <div className="batch-grid">
        <div className="fact"><span>Average Health</span><strong>{customerSuccess.summary.averageHealth}%</strong></div>
        <div className="fact"><span>Adoption KPIs</span><strong>{customerSuccess.summary.averageAdoption}%</strong></div>
        <div className="fact"><span>Renewal Forecast</span><strong>{customerSuccess.summary.renewalQueue}</strong></div>
        <div className="fact"><span>Expansion Pipeline</span><strong>{customerSuccess.summary.expansionOpportunities}</strong></div>
      </div>
      <DataTable
        columns={['Customer Health Summary', 'Health', 'Risk', 'Next Action']}
        rows={customerSuccess.health.map((item) => [item.organization, `${item.healthScore}%`, `${item.riskScore}%`, item.nextActions[0]])}
      />
      <DataTable
        columns={['Renewal Forecast', 'Readiness', 'Status', 'Next Action']}
        rows={customerSuccess.renewals.map((item) => [item.organization, `${item.readiness}%`, item.status, item.nextAction])}
      />
      <DataTable
        columns={['Expansion Pipeline', 'Opportunity', 'Score', 'Action']}
        rows={customerSuccess.expansion.map((item) => [item.organization, item.opportunity, `${item.score}%`, item.recommendedAction])}
      />
      <div className="dashboard-subsection">
        <h3>Churn Risks</h3>
        <DataTable
          columns={['Customer', 'Risk', 'Recommendations']}
          rows={customerSuccess.health.filter((item) => item.riskScore >= 45).map((item) => [item.organization, `${item.riskScore}%`, item.recommendations[0]])}
          emptyMessage="No churn risks above threshold."
        />
      </div>
      <div className="dashboard-subsection">
        <h3>Onboarding Progress</h3>
        <DataTable
          columns={['Customer', 'Progress', 'Training', 'Documentation']}
          rows={customerSuccess.onboarding.map((item) => [item.organization, `${item.progress}%`, `${item.trainingCompletion}%`, `${item.documentationUsage}%`])}
        />
      </div>
      <p className="subtle-note">Executive Customer Success visibility is advisory and local. It does not message customers, change accounts, sync CRM records, or renew subscriptions.</p>
    </section>
  );
}

function ExecutivePlanningPanel({ planning }: { planning: NonNullable<ExecutiveDashboardProps['executivePlanning']> }) {
  return (
    <section className="panel wide-panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Strategic Goals</h2>
        </div>
        <span>{planning.summary.executiveAttentionNeeded} need attention</span>
      </div>
      <div className="batch-grid">
        <div className="fact"><span>KPI Scorecard</span><strong>{planning.summary.kpisOnTrack}/{planning.kpis.length}</strong></div>
        <div className="fact"><span>Initiative Tracker</span><strong>{planning.summary.initiativesActive}</strong></div>
        <div className="fact"><span>Executive Decision Log</span><strong>{planning.summary.decisionsLogged}</strong></div>
        <div className="fact"><span>Blocked Goals</span><strong>{planning.summary.blockedGoals}</strong></div>
        <div className="fact"><span>At-Risk Priorities</span><strong>{planning.summary.atRiskGoals}</strong></div>
        <div className="fact"><span>Agent Contribution Summary</span><strong>{planning.agentContribution.length}</strong></div>
      </div>
      <DataTable
        columns={['Strategic Goals', 'Owner', 'Progress', 'Next Action']}
        rows={planning.goals.map((goal) => [goal.title, goal.ownerAgent, `${goal.progressScore}% · ${goal.status.replace(/_/g, ' ')}`, goal.recommendations[0] ?? goal.attentionLabel])}
      />
      <DataTable
        columns={['KPI Scorecard', 'Current', 'Target', 'Status']}
        rows={planning.kpis.map((kpi) => [kpi.name, `${kpi.currentValue} ${kpi.unit}`, `${kpi.targetValue} ${kpi.unit}`, kpi.status.replace(/_/g, ' ')])}
      />
      <DataTable
        columns={['Initiative Tracker', 'Owner', 'Progress', 'Blockers']}
        rows={planning.initiatives.map((initiative) => [initiative.title, initiative.owner, `${initiative.progress}%`, initiative.blockers.join('; ') || 'None'])}
      />
      <DataTable
        columns={['Executive Decision Log', 'Decision', 'Maker', 'Status']}
        rows={planning.decisions.map((decision) => [decision.title, decision.decision, decision.decisionMaker, decision.status])}
      />
      <DataTable
        columns={['Blocked Goals', 'Owner', 'Severity', 'Next Action']}
        rows={planning.blockers.map((blocker) => [blocker.title, blocker.owner, blocker.severity, blocker.nextAction])}
      />
      <DataTable
        columns={['Goal Progress Timeline', 'Target', 'Confidence', 'Attention']}
        rows={planning.goals.map((goal) => [goal.title, goal.targetDate, `${goal.confidenceScore}%`, goal.attentionLabel])}
      />
      <p className="subtle-note">Goal Progress Timeline tracks target dates, confidence, and Executive attention across active goals.</p>
      <DataTable
        columns={['Agent Contribution Summary', 'Goals', 'Tasks', 'Status']}
        rows={planning.agentContribution.map((agent) => [agent.agent, String(agent.goalsOwned), String(agent.linkedTasks), agent.contributionLabel])}
      />
      <p className="subtle-note">Executive planning is local and advisory. It does not complete goals, approve decisions, browse, email, sync CRM data, or submit proposals.</p>
    </section>
  );
}

function ExecutiveWorkQueuePanel({ sharedTaskSummary }: { sharedTaskSummary: NonNullable<ExecutiveDashboardProps['sharedTaskSummary']> }) {
  return (
    <section className="panel wide-panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Executive Work Queue</h2>
        </div>
        <span>{sharedTaskSummary.queueHealth}</span>
      </div>
      <div className="batch-grid">
        <div className="fact"><span>Approval Tasks</span><strong>{sharedTaskSummary.executiveQueue.length}</strong></div>
        <div className="fact"><span>Strategic Tasks</span><strong>{sharedTaskSummary.activeWorkQueue.filter((task) => task.priority === 'Critical').length}</strong></div>
        <div className="fact"><span>Blocked Decisions</span><strong>{sharedTaskSummary.blockedWork.length}</strong></div>
        <div className="fact"><span>Overdue Executive Items</span><strong>{sharedTaskSummary.overdueWork.filter((task) => task.assignedAgent === 'Executive').length}</strong></div>
      </div>
      <DataTable
        columns={['Executive Work Queue', 'Company', 'Priority', 'Next Action']}
        rows={sharedTaskSummary.executiveQueue.map((task) => [task.title, task.organization, `${task.priority} · ${task.status}`, task.recommendedNextAction])}
        emptyMessage="No Executive work queue items."
      />
      <DataTable
        columns={['Approval Tasks', 'Reason', 'SLA Risk']}
        rows={sharedTaskSummary.executiveQueue.map((task) => [task.title, task.queueReasons[0] ?? 'Manual Executive review required.', task.slaRisk])}
        emptyMessage="No approval tasks."
      />
      <DataTable
        columns={['Blocked Decisions', 'Blocker', 'Owner']}
        rows={sharedTaskSummary.blockedWork.map((task) => [task.title, task.blockers.join('; ') || task.slaRisk, task.assignedAgent])}
        emptyMessage="No blocked decisions."
      />
      <DataTable
        columns={['Overdue Executive Items', 'Due', 'Action']}
        rows={sharedTaskSummary.overdueWork
          .filter((task) => task.assignedAgent === 'Executive')
          .map((task) => [task.title, task.dueDate.slice(0, 10), task.recommendedNextAction])}
        emptyMessage="No overdue Executive items."
      />
      <p className="subtle-note">Executive task queues are read-only and local. They do not approve, browse, email, sync CRM records, or submit proposals.</p>
    </section>
  );
}

function ExecutiveKnowledgeSummaryPanel({ sharedMemory }: { sharedMemory: NonNullable<ExecutiveDashboardProps['sharedMemory']> }) {
  const view = sharedMemory.agentViews.Executive;
  return (
    <section className="panel wide-panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Cross-Agent Knowledge Summary</h2>
        </div>
        <span>read only</span>
      </div>
      <div className="batch-grid">
        <div className="fact"><span>Strategic Entities</span><strong>{view.entityCount}</strong></div>
        <div className="fact"><span>Relationships</span><strong>{view.relationshipCount}</strong></div>
        <div className="fact"><span>Risky Facts</span><strong>{view.riskyFactCount}</strong></div>
        <div className="fact"><span>Memory Conflicts</span><strong>{view.conflictCount}</strong></div>
        <div className="fact"><span>Decision History</span><strong>{view.sourceBackedFacts.length}</strong></div>
        <div className="fact"><span>Avg Entity Confidence</span><strong>{sharedMemory.summary.averageEntityConfidence}%</strong></div>
        <div className="fact"><span>Duplicate Entity Queue</span><strong>{sharedMemory.summary.duplicateEntityQueue}</strong></div>
      </div>
      <DataTable
        columns={['Strategic Entity', 'Type', 'Status', 'Confidence']}
        rows={view.topEntities.slice(0, 6).map((entity) => [entity.displayName, entity.entityType, entity.status.replace(/_/g, ' '), `${entity.confidence}%`])}
      />
      <DataTable
        columns={['Decision History', 'Source', 'Confidence']}
        rows={view.sourceBackedFacts.slice(0, 6).map((fact) => [fact.factType, fact.source, `${fact.confidence}% · ${fact.verificationStatus.replace(/_/g, ' ')}`])}
        emptyMessage="No Executive decision history facts yet."
      />
      <DataTable
        columns={['Risky Fact', 'Entity', 'Review']}
        rows={view.sourceBackedFacts.filter((fact) => fact.confidence < 55 || fact.verificationStatus !== 'verified').slice(0, 6).map((fact) => [fact.factType, fact.entityId, 'Review before Executive decision'])}
        emptyMessage="No risky facts in the Executive view."
      />
      <p className="subtle-note">Shared memory is advisory and local. It does not approve decisions, sync CRM data, browse, email, submit proposals, or merge entities.</p>
    </section>
  );
}

function DataTable({ columns, emptyMessage = 'No rows to show.', rows }: { columns: string[]; emptyMessage?: string; rows: ReactNode[][] }) {
  if (!rows.length) return <p className="empty-state">{emptyMessage}</p>;
  return (
    <div className="table-shell compact-table-shell">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.map((cell) => String(cell)).join('-')}-${index}`}>
              {row.map((cell, cellIndex) => <td key={`${columns[cellIndex]}-${cellIndex}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExecutiveRelationshipSummaryPanel({ summary }: { summary: NonNullable<ExecutiveDashboardProps['salesOrganizationIntelligenceSummary']> }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Executive Relationship Summary</h2>
        </div>
        <span>read only</span>
      </div>
      <div className="batch-grid">
        <div className="fact"><span>High Value Organizations</span><strong>{summary.highValueOrganizations}</strong></div>
        <div className="fact"><span>Decision Maker Coverage</span><strong>{summary.decisionMakerCoverage}%</strong></div>
        <div className="fact"><span>Relationship Health</span><strong>{summary.averageRelationshipHealth}%</strong></div>
        <div className="fact"><span>Committee Completeness</span><strong>{summary.averageBuyingCommitteeCompleteness}%</strong></div>
        <div className="fact"><span>Relationship Risks</span><strong>{summary.executiveRelationshipRisks}</strong></div>
        <div className="fact"><span>Largest Opportunity</span><strong>${summary.largestOpportunityValue.toLocaleString()}</strong></div>
      </div>
      <p className="subtle-note">Relationship intelligence is local and advisory. It does not browse, sync CRM records, send messages, approve relationships, or merge contacts.</p>
    </section>
  );
}

function ExecutiveSalesIntelligencePanel({ analytics }: { analytics: NonNullable<ExecutiveDashboardProps['salesPipelineAnalytics']> }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Executive Sales Intelligence Summary</h2>
        </div>
        <span>read only</span>
      </div>
      <div className="batch-grid">
        <div className="fact"><span>Total Opportunities</span><strong>{analytics.totalOpportunities}</strong></div>
        <div className="fact"><span>Hot / Warm / Cold</span><strong>{analytics.hotCount}/{analytics.warmCount}/{analytics.coldCount}</strong></div>
        <div className="fact"><span>Not Ready</span><strong>{analytics.notReadyCount}</strong></div>
        <div className="fact"><span>Pipeline Forecast</span><strong>${analytics.estimatedPipelineValue.toLocaleString()}</strong></div>
        <div className="fact"><span>Proposal Ready</span><strong>{analytics.proposalReadyCount}</strong></div>
        <div className="fact"><span>Executive Review</span><strong>{analytics.executiveReviewCount}</strong></div>
        <div className="fact"><span>Blocked</span><strong>{analytics.blockedCount}</strong></div>
        <div className="fact"><span>Average Confidence</span><strong>{analytics.averageConfidence}%</strong></div>
      </div>
      <p className="subtle-note">Scoring is local-only and advisory. Executive approval, external actions, emails, browsing, CRM sync, and proposal submission remain manual and gated.</p>
    </section>
  );
}

function ExecutiveSalesWorkflowPanel({ summary }: { summary: NonNullable<ExecutiveDashboardProps['salesWorkflowSummary']> }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Sales Approval Queue</h2>
        </div>
        <span>{summary.workflowHealth}/100</span>
      </div>
      <div className="batch-grid">
        <div className="fact"><span>High-Fit Opportunities</span><strong>{summary.assignedToExecutive}</strong></div>
        <div className="fact"><span>Risky Source Reviews</span><strong>{summary.approvalQueue}</strong></div>
        <div className="fact"><span>Proposal Readiness Reviews</span><strong>{summary.proposalPrepItems}</strong></div>
        <div className="fact"><span>External Action Gates</span><strong>{summary.externalActionGates}</strong></div>
        <div className="fact"><span>Blocked Workflows</span><strong>{summary.blockedWorkflows}</strong></div>
        <div className="fact"><span>Workflow Health</span><strong>{summary.workflowHealth}%</strong></div>
      </div>
      <p className="subtle-note">Executive review is manual only. This panel does not approve handoffs, send emails, browse, sync CRM, or submit proposals.</p>
    </section>
  );
}

function ExecutiveResearchIntelligencePanel({ summary }: { summary: NonNullable<ExecutiveDashboardProps['salesResearchIntelligenceSummary']> }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Research Intelligence</h2>
        </div>
        <span>read only</span>
      </div>
      <div className="batch-grid">
        <div className="fact">
          <span>Pending Reviews</span>
          <strong>{summary.pendingReviews}</strong>
        </div>
        <div className="fact">
          <span>Approved Sources</span>
          <strong>{summary.approvedSources}</strong>
        </div>
        <div className="fact">
          <span>Rejected Sources</span>
          <strong>{summary.rejectedSources}</strong>
        </div>
        <div className="fact">
          <span>Research Backlog</span>
          <strong>{summary.researchBacklog}</strong>
        </div>
        <div className="fact">
          <span>Duplicate Alerts</span>
          <strong>{summary.duplicateAlerts}</strong>
        </div>
        <div className="fact">
          <span>Verification Queue</span>
          <strong>{summary.verificationQueue}</strong>
        </div>
        <div className="fact">
          <span>Enrichment Progress</span>
          <strong>{summary.enrichmentProgress}%</strong>
        </div>
        <div className="fact">
          <span>Confidence Trend</span>
          <strong>{summary.confidenceTrend}%</strong>
        </div>
      </div>
      <p className="subtle-note">Executive view is read-only. No source approval, duplicate merge, browsing, messaging, CRM sync, or proposal submission occurs here.</p>
    </section>
  );
}

function ExecutiveEmailBriefingPanel({ briefing }: { briefing: NonNullable<ExecutiveDashboardProps['executiveEmailBriefing']> }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Daily Briefing Email</h2>
        </div>
        <span>{briefing.automationStatus}</span>
      </div>
      <div className="batch-grid">
        <div className="fact">
          <span>Last Sent / Skipped</span>
          <strong>{briefing.lastBriefingSentOrSkipped}</strong>
        </div>
        <div className="fact">
          <span>Recipients</span>
          <strong>{briefing.recipientReadiness.length}</strong>
        </div>
        <div className="fact">
          <span>Sender</span>
          <strong>{briefing.routeSender}</strong>
        </div>
        <div className="fact">
          <span>Recipient</span>
          <strong>{briefing.routeRecipient}</strong>
        </div>
        <div className="fact">
          <span>Failed / Skipped</span>
          <strong>{briefing.failedOrSkippedAttempts.length}</strong>
        </div>
        <div className="fact">
          <span>Safety</span>
          <strong>{briefing.safetyStatus}</strong>
        </div>
      </div>
      <div className="activity-list">
        {briefing.recipientReadiness.map((recipient) => (
          <p key={recipient.recipientName}>
            <strong>{recipient.recipientName}</strong>: {recipient.sendStatus.replace(/_/g, ' ')} · {recipient.recipientStatus.replace(/_/g, ' ')}
          </p>
        ))}
      </div>
      <p className="subtle-note">{briefing.nextScheduledBriefing}</p>
    </section>
  );
}

function ExecutiveOperationsCenterPanel({ operations }: { operations: NonNullable<ExecutiveDashboardProps['executiveOperations']> }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Operations Center</h2>
        </div>
        <span>{operations.dailyOperatingStatus}</span>
      </div>
      <div className="batch-grid">
        <div className="fact">
          <span>Executive Score</span>
          <strong>{operations.overallExecutiveScore}/100</strong>
        </div>
        <div className="fact">
          <span>Open Tasks</span>
          <strong>{operations.kpis.openTasks}</strong>
        </div>
        <div className="fact">
          <span>Release Ready</span>
          <strong>{operations.kpis.releaseReadinessPercent}%</strong>
        </div>
        <div className="fact">
          <span>Engineering</span>
          <strong>{operations.kpis.engineeringHealthPercent}%</strong>
        </div>
        <div className="fact">
          <span>Sales Pipeline</span>
          <strong>{operations.kpis.salesPipelineHealth}%</strong>
        </div>
        <div className="fact">
          <span>Automation</span>
          <strong>{operations.kpis.automationSuccess}%</strong>
        </div>
      </div>
      <div className="activity-list">
        <p>
          <strong>Daily Briefing</strong>: {operations.briefing.todaysPriorities[0] ?? 'No priority recorded.'}
        </p>
        <p>
          <strong>Risks</strong>: {operations.operationalAlerts[0] ?? 'No operational alerts.'}
        </p>
        <p>
          <strong>Releases</strong>: {operations.briefing.releaseReadinessSummary.releaseHealth} · {operations.briefing.releaseReadinessSummary.shipPlanDecision}
        </p>
        <p>
          <strong>Projects</strong>: {operations.projectHealth}; <strong>Communications</strong>: {operations.communicationHealth}; <strong>Connectors</strong>: {operations.connectorReadiness}
        </p>
      </div>
      <p className="subtle-note">{operations.briefing.recommendedNextActions[0] ?? 'No recommended action recorded.'}</p>
    </section>
  );
}

function ExecutiveShipPlanPanel({ releaseShipPlans }: { releaseShipPlans: NonNullable<ExecutiveDashboardProps['releaseShipPlans']> }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Ship Plan Decisions</h2>
        </div>
        <span>{releaseShipPlans.localApprovalStatus.replace(/_/g, ' ')}</span>
      </div>
      <div className="batch-grid">
        <div className="fact">
          <span>Needs Review</span>
          <strong>{releaseShipPlans.shipPlansNeedingReview}</strong>
        </div>
        <div className="fact">
          <span>Approved Prep</span>
          <strong>{releaseShipPlans.approvedPreparationPlans}</strong>
        </div>
        <div className="fact">
          <span>Blocked Ship Plans</span>
          <strong>{releaseShipPlans.blockedShipPlans}</strong>
        </div>
        <div className="fact">
          <span>Total Plans</span>
          <strong>{releaseShipPlans.totalShipPlans}</strong>
        </div>
      </div>
      <div className="activity-list">
        {releaseShipPlans.highestRiskPlannedReleases.slice(0, 5).map((plan) => (
          <p key={plan.shipPlanId}>
            <strong>{plan.projectName}</strong>: {plan.riskLevel} · {plan.recommendedShipDecision}
          </p>
        ))}
      </div>
      <p className="subtle-note">{releaseShipPlans.recommendedExecutiveDecision}</p>
    </section>
  );
}

function ExecutiveReleaseReadinessPanel({ releaseReadiness }: { releaseReadiness: NonNullable<ExecutiveDashboardProps['releaseReadiness']> }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Release Command Center</h2>
        </div>
        <span>{releaseReadiness.releaseHealth}</span>
      </div>
      <div className="batch-grid">
        <div className="fact">
          <span>Ready To Release</span>
          <strong>{releaseReadiness.readyProjects}</strong>
        </div>
        <div className="fact">
          <span>Blocked Releases</span>
          <strong>{releaseReadiness.blockedProjects}</strong>
        </div>
        <div className="fact">
          <span>Critical Risks</span>
          <strong>{releaseReadiness.criticalReleaseRisks}</strong>
        </div>
        <div className="fact">
          <span>Readiness Score</span>
          <strong>{releaseReadiness.averageReadinessScore}/100</strong>
        </div>
      </div>
      <div className="activity-list">
        {releaseReadiness.blockers.slice(0, 5).map((blocker) => (
          <p key={`${blocker.projectId}-${blocker.id}`}>
            <strong>{blocker.projectName}</strong>: {blocker.reason}
          </p>
        ))}
      </div>
      <p className="subtle-note">{releaseReadiness.recommendedExecutiveAction}</p>
    </section>
  );
}

function ExecutiveProjectRegistryPanel({ projectRegistry }: { projectRegistry: NonNullable<ExecutiveDashboardProps['projectRegistry']> }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Project Risk Summary</h2>
        </div>
        <span>{projectRegistry.releaseReadinessStatus}</span>
      </div>
      <div className="batch-grid">
        <div className="fact">
          <span>Registered Projects</span>
          <strong>{projectRegistry.registeredProjects}</strong>
        </div>
        <div className="fact">
          <span>Blocked Projects</span>
          <strong>{projectRegistry.blockedProjects}</strong>
        </div>
        <div className="fact">
          <span>Missing Paths</span>
          <strong>{projectRegistry.missingPaths}</strong>
        </div>
        <div className="fact">
          <span>Validation</span>
          <strong>{projectRegistry.validationStatus}</strong>
        </div>
      </div>
      <div className="activity-list">
        {projectRegistry.projects.slice(0, 5).map((project) => (
          <p key={project.id}>
            <strong>{project.projectName}</strong>: {project.releaseReadiness} · {project.status}
          </p>
        ))}
      </div>
      <p className="subtle-note">{projectRegistry.highPriorityProjectIssues[0] ?? projectRegistry.safetyStatus}</p>
    </section>
  );
}

function ExecutiveAutomationPanel({ automation }: { automation: NonNullable<ExecutiveDashboardProps['executiveAutomation']> }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <Workflow size={18} />
          <h2>Automation Engine</h2>
        </div>
        <span>{automation.automationHealth}</span>
      </div>
      <div className="batch-grid">
        <div className="fact">
          <span>Triggered Rules</span>
          <strong>{automation.triggeredRules.length}</strong>
        </div>
        <div className="fact">
          <span>Tasks Created</span>
          <strong>{automation.generatedTasks}</strong>
        </div>
        <div className="fact">
          <span>Emails Sent / Skipped</span>
          <strong>{automation.emailsSent}/{automation.emailsSkipped}</strong>
        </div>
        <div className="fact">
          <span>Workflows Run</span>
          <strong>{automation.agentWorkflowsRun}</strong>
        </div>
        <div className="fact">
          <span>Reports</span>
          <strong>{automation.generatedReports}</strong>
        </div>
        <div className="fact">
          <span>Safety</span>
          <strong>{automation.safetyStatus}</strong>
        </div>
      </div>
      <div className="activity-list">
        {automation.topTriggeredRules.map((rule) => (
          <p key={rule.id}>
            <strong>{rule.category}</strong>: {rule.signals[0]}
          </p>
        ))}
      </div>
      <p className="subtle-note">{automation.nextRecommendedAction}</p>
    </section>
  );
}
