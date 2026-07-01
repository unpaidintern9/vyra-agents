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
