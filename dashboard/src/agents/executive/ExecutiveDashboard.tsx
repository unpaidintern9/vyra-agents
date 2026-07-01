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
  salesIntegration,
  salesProposalSummary,
  salesProspectDossierSummary,
  salesScoringSummary,
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
