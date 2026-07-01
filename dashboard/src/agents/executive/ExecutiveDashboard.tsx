import { Workflow } from 'lucide-react';
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
        {salesPipelineAnalytics ? <ExecutiveSalesIntelligencePanel analytics={salesPipelineAnalytics} /> : null}
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
