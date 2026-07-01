import { CheckCircle2, Copy, Database, Download, GitBranch, ListChecks, Network, Search, ShieldCheck, Workflow, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import { buildDashboardEngineeringTaskSummary } from '../../runtime/engineeringTaskGenerator';
import { buildDashboardGitHubPlanningSummary } from '../../runtime/githubPlanning';
import { buildDashboardProjectRegistrySummary } from '../../runtime/projectRegistry';
import { buildDashboardReleaseReadinessSummary } from '../../runtime/releaseReadiness';
import { buildDashboardReleaseShipPlanSummary } from '../../runtime/releaseShipPlans';
import { summarizeRepositoryIntelligence } from '../../runtime/repositoryIntelligence';
import { buildDashboardSharedTaskSummary } from '../../runtime/sharedTaskQueue';
import { loadEngineeringGraph } from './engineeringGraph';
import { engineeringMockGraph } from './engineeringMockData';
import {
  buildEngineeringBacklog,
  engineeringBacklogStatusStorageKey,
  summarizeEngineeringBacklog,
} from './engineeringBacklog';
import {
  buildEngineeringIssueDrafts,
  downloadIssueDraft,
  downloadIssueDraftCollection,
  engineeringIssueDraftStatusStorageKey,
  summarizeIssueDrafts,
} from './engineeringIssueDrafts';
import {
  analyzeEngineeringImpact,
  inboundRelationships,
  migrationHistory,
  outboundRelationships,
  routeImpact,
  tableImpact,
  type EngineeringImpactRisk,
  type EngineeringRelationship,
} from './engineeringImpact';
import {
  downloadEngineeringGraph,
  downloadEngineeringReport,
  downloadBrokenRelationshipPlanner,
  downloadDocumentationGapPlanner,
  downloadEngineeringBacklog,
  downloadFunctionTableMap,
  downloadFullImpactSummary,
  downloadMigrationHistoryReport,
  downloadNodeDetailReport,
  downloadNodeImpactReport,
  downloadMissingDocsReport,
  downloadOrphanCandidatesReport,
  downloadOrphanReviewPlanner,
  downloadOwnershipMap,
  downloadRepoHealthImprovementPlan,
  downloadRepoHealthReport,
  downloadRiskQueueReport,
  downloadRouteImpactReport,
  downloadTableScreenMap,
  downloadTableImpactReport,
  type EngineeringReportFormat,
} from './engineeringReports';
import {
  featureAreaMap,
  filteredRiskNodes,
  functionTableMap,
  ownerGroups,
  ownershipOverview,
  riskLevelForNode,
  riskWarningQueue,
  tableScreenMap,
} from './engineeringOwnership';
import { groupBacklogItems, repoHealthImprovementPlans } from './engineeringPlanner';
import type { EngineeringPlannerGroup } from './engineeringPlanner';
import { searchEngineeringNodes } from './engineeringSearch';
import { edgeTypes, missingRepositoryWarnings, nodeTypes, topConnectedNodes, uniqueSorted } from './engineeringSummary';
import type { EngineeringGraph, EngineeringNode, EngineeringScanResult } from './engineeringTypes';
import type { EngineeringBacklogStatus } from './engineeringTaskTypes';
import type { EngineeringIssueDraftStatus } from './engineeringIssueTypes';
import { runEngineeringScanFromDashboard } from './engineeringScanner';
import {
  createGitHubIssueFromDraft,
  createdGitHubIssuesStorageKey,
  githubIssueCreationConfigFromEnv,
} from '../../integrations/github/githubIssueClient';
import type { CreatedGitHubIssueRecord, GitHubIssueCreationMode } from '../../integrations/github/githubIssueTypes';
import { resolveGitHubRepo } from '../../integrations/github/githubRepoConfig';
import { gitHubTokenConfigurationStatus, hasGitHubTokenForRepo } from '../../integrations/github/githubTokenResolver';

interface EngineeringPageProps {
  onImpactExport(_event: {
    affectedCount: number;
    nodeLabel: string;
    nodeType: string;
    reportType: string;
    riskLevel: EngineeringImpactRisk;
  }): void;
  onScanLoaded(_result: EngineeringScanResult): void;
}

export default function EngineeringPage({ onImpactExport, onScanLoaded }: EngineeringPageProps) {
  const [scan, setScan] = useState<EngineeringScanResult>({
    graph: engineeringMockGraph,
    loadedAt: 'Loading',
    source: 'mock-fallback',
  });
  const [query, setQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [relationshipTypeFilter, setRelationshipTypeFilter] = useState('all');
  const [relationshipNodeTypeFilter, setRelationshipNodeTypeFilter] = useState('all');
  const [relationshipRepoFilter, setRelationshipRepoFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [riskRepoFilter, setRiskRepoFilter] = useState('all');
  const [riskNodeTypeFilter, setRiskNodeTypeFilter] = useState('all');
  const [riskLevelFilter, setRiskLevelFilter] = useState('all');
  const [warningTypeFilter, setWarningTypeFilter] = useState('high_risk');
  const [backlogStatusOverrides, setBacklogStatusOverrides] = useState<Record<string, EngineeringBacklogStatus>>(() => loadBacklogStatusOverrides());
  const [planningSeverityFilter, setPlanningSeverityFilter] = useState('all');
  const [planningCategoryFilter, setPlanningCategoryFilter] = useState('all');
  const [planningOwnerFilter, setPlanningOwnerFilter] = useState('all');
  const [planningRepoFilter, setPlanningRepoFilter] = useState('all');
  const [planningStatusFilter, setPlanningStatusFilter] = useState('all');
  const [planningEffortFilter, setPlanningEffortFilter] = useState('all');
  const [issueDraftStatusOverrides, setIssueDraftStatusOverrides] = useState<Record<string, EngineeringIssueDraftStatus>>(() => loadIssueDraftStatusOverrides());
  const [issuePriorityFilter, setIssuePriorityFilter] = useState('all');
  const [issueRepoFilter, setIssueRepoFilter] = useState('all');
  const [issueOwnerFilter, setIssueOwnerFilter] = useState('all');
  const [issueFeatureFilter, setIssueFeatureFilter] = useState('all');
  const [issueCategoryFilter, setIssueCategoryFilter] = useState('all');
  const [issueStatusFilter, setIssueStatusFilter] = useState('all');
  const [issueReadyFilter, setIssueReadyFilter] = useState('all');
  const [selectedIssueDraftId, setSelectedIssueDraftId] = useState<string | null>(null);
  const [createdGitHubIssues, setCreatedGitHubIssues] = useState<CreatedGitHubIssueRecord[]>(() => loadCreatedGitHubIssues());
  const [bulkCreationDraftIds, setBulkCreationDraftIds] = useState<string[]>([]);
  const [issueCreationBusy, setIssueCreationBusy] = useState(false);
  const [issueCreationMessage, setIssueCreationMessage] = useState('No GitHub issue creation attempts this session.');

  const graph = scan.graph;
  const repositoryIntelligence = useMemo(() => summarizeRepositoryIntelligence(graph), [graph]);
  const projectRegistry = useMemo(() => buildDashboardProjectRegistrySummary(graph), [graph]);
  const releaseReadiness = useMemo(
    () =>
      buildDashboardReleaseReadinessSummary({
        graph,
        githubPlanning: buildDashboardGitHubPlanningSummary(),
        projectRegistry,
        repositoryIntelligence,
        sharedTasks: buildDashboardSharedTaskSummary(),
      }),
    [graph, projectRegistry, repositoryIntelligence],
  );
  const engineeringTaskSummary = useMemo(
    () =>
      buildDashboardEngineeringTaskSummary({
        githubPlanning: buildDashboardGitHubPlanningSummary(),
        projectRegistry,
        releaseReadiness,
        releaseShipPlans: buildDashboardReleaseShipPlanSummary({
          githubPlanning: buildDashboardGitHubPlanningSummary(),
          releaseReadiness,
          sharedTasks: buildDashboardSharedTaskSummary(),
        }),
        repositoryIntelligence,
        sharedTasks: buildDashboardSharedTaskSummary(),
      }),
    [projectRegistry, releaseReadiness, repositoryIntelligence],
  );
  const releaseShipPlans = useMemo(
    () =>
      buildDashboardReleaseShipPlanSummary({
        githubPlanning: buildDashboardGitHubPlanningSummary(),
        releaseReadiness,
        sharedTasks: buildDashboardSharedTaskSummary(),
      }),
    [releaseReadiness],
  );
  const selectedNode = selectedNodeId ? graph.nodes.find((node) => node.id === selectedNodeId) ?? null : null;
  const searchResults = useMemo(() => searchEngineeringNodes(graph, query), [graph, query]);
  const impact = selectedNode ? analyzeEngineeringImpact(graph, selectedNode) : null;
  const inbound = selectedNode ? filterRelationships(inboundRelationships(graph, selectedNode.id), relationshipTypeFilter, relationshipNodeTypeFilter, relationshipRepoFilter) : [];
  const outbound = selectedNode ? filterRelationships(outboundRelationships(graph, selectedNode.id), relationshipTypeFilter, relationshipNodeTypeFilter, relationshipRepoFilter) : [];
  const tableView = selectedNode?.type === 'table' ? tableImpact(graph, selectedNode) : null;
  const routeView = selectedNode && ['route', 'screen'].includes(selectedNode.type) ? routeImpact(graph, selectedNode) : null;
  const migrationView = selectedNode && ['table', 'migration'].includes(selectedNode.type) ? migrationHistory(graph, selectedNode) : null;
  const relationshipRepos = uniqueSorted([...inboundRelationships(graph, selectedNodeId ?? ''), ...outboundRelationships(graph, selectedNodeId ?? '')].map((item) => item.node.repo));
  const ownershipRows = useMemo(() => ownershipOverview(graph), [graph]);
  const featureRows = useMemo(() => featureAreaMap(graph), [graph]);
  const tableScreenRows = useMemo(() => tableScreenMap(graph), [graph]);
  const functionTableRows = useMemo(() => functionTableMap(graph), [graph]);
  const riskQueue = useMemo(() => riskWarningQueue(graph), [graph]);
  const riskRows = useMemo(
    () =>
      filteredRiskNodes(graph, {
        owner: ownerFilter,
        repo: riskRepoFilter,
        risk: riskLevelFilter,
        type: riskNodeTypeFilter,
        warningType: warningTypeFilter,
      }),
    [graph, ownerFilter, riskLevelFilter, riskNodeTypeFilter, riskRepoFilter, warningTypeFilter],
  );
  const brokenWarningRows = useMemo(
    () =>
      riskQueue.brokenRelationships.filter(
        (warning) =>
          riskRepoFilter === 'all' ||
          graph.repositories.some((repo) => repo.name === riskRepoFilter && warning.includes(`${repo.name}:`)),
      ),
    [graph.repositories, riskQueue.brokenRelationships, riskRepoFilter],
  );
  const backlogItems = useMemo(() => buildEngineeringBacklog(graph, backlogStatusOverrides), [backlogStatusOverrides, graph]);
  const backlogSummary = useMemo(() => summarizeEngineeringBacklog(backlogItems), [backlogItems]);
  const filteredBacklogItems = useMemo(
    () =>
      backlogItems.filter(
        (item) =>
          (planningSeverityFilter === 'all' || item.severity === planningSeverityFilter) &&
          (planningCategoryFilter === 'all' || item.category === planningCategoryFilter) &&
          (planningOwnerFilter === 'all' || item.owner === planningOwnerFilter) &&
          (planningRepoFilter === 'all' || item.repo === planningRepoFilter) &&
          (planningStatusFilter === 'all' || item.status === planningStatusFilter) &&
          (planningEffortFilter === 'all' || item.effort === planningEffortFilter),
      ),
    [backlogItems, planningCategoryFilter, planningEffortFilter, planningOwnerFilter, planningRepoFilter, planningSeverityFilter, planningStatusFilter],
  );
  const docPlannerGroups = useMemo(() => groupBacklogItems(backlogItems, 'missing_doc'), [backlogItems]);
  const orphanPlannerGroups = useMemo(() => groupBacklogItems(backlogItems, 'orphan_review'), [backlogItems]);
  const brokenRelationshipItems = useMemo(() => backlogItems.filter((item) => item.category === 'broken_relationship'), [backlogItems]);
  const repoHealthPlans = useMemo(() => repoHealthImprovementPlans(graph), [graph]);
  const issueDrafts = useMemo(() => buildEngineeringIssueDrafts(backlogItems, issueDraftStatusOverrides), [backlogItems, issueDraftStatusOverrides]);
  const issueDraftSummary = useMemo(() => summarizeIssueDrafts(issueDrafts), [issueDrafts]);
  const githubIssueConfig = useMemo(() => githubIssueCreationConfigFromEnv(), []);
  const githubTokenStatus = useMemo(() => gitHubTokenConfigurationStatus(), []);
  const readyIssueDrafts = useMemo(() => issueDrafts.filter((draft) => draft.readyForGitHub), [issueDrafts]);
  const readyP0P1IssueDrafts = useMemo(() => readyIssueDrafts.filter((draft) => draft.priority === 'P0' || draft.priority === 'P1'), [readyIssueDrafts]);
  const createdIssueByDraftId = useMemo(() => {
    const records = new Map<string, CreatedGitHubIssueRecord>();
    for (const record of createdGitHubIssues) {
      if (!records.has(record.draftId) && ['created', 'duplicate_skipped'].includes(record.status)) {
        records.set(record.draftId, record);
      }
    }
    return records;
  }, [createdGitHubIssues]);
  const createdIssueCount = createdGitHubIssues.filter((record) => record.status === 'created').length;
  const duplicateSkipCount = createdGitHubIssues.filter((record) => record.status === 'duplicate_skipped').length;
  const filteredIssueDrafts = useMemo(
    () =>
      issueDrafts.filter(
        (draft) =>
          (issuePriorityFilter === 'all' || draft.priority === issuePriorityFilter) &&
          (issueRepoFilter === 'all' || draft.repo === issueRepoFilter) &&
          (issueOwnerFilter === 'all' || draft.owner === issueOwnerFilter) &&
          (issueFeatureFilter === 'all' || draft.featureArea === issueFeatureFilter) &&
          (issueCategoryFilter === 'all' || draft.category === issueCategoryFilter) &&
          (issueStatusFilter === 'all' || draft.status === issueStatusFilter) &&
          (issueReadyFilter === 'all' || String(draft.readyForGitHub) === issueReadyFilter),
      ),
    [issueCategoryFilter, issueDrafts, issueFeatureFilter, issueOwnerFilter, issuePriorityFilter, issueReadyFilter, issueRepoFilter, issueStatusFilter],
  );
  const selectedIssueDraft = selectedIssueDraftId ? issueDrafts.find((draft) => draft.id === selectedIssueDraftId) ?? null : null;
  const selectedIssueRecord = selectedIssueDraft ? createdIssueByDraftId.get(selectedIssueDraft.id) ?? null : null;
  const filteredReadyIssueDrafts = filteredIssueDrafts.filter((draft) => draft.readyForGitHub);
  const pendingBulkDrafts = bulkCreationDraftIds
    .map((draftId) => issueDrafts.find((draft) => draft.id === draftId))
    .filter((draft): draft is NonNullable<typeof draft> => Boolean(draft));

  useEffect(() => {
    loadEngineeringGraph().then((result) => {
      setScan(result);
      setSelectedNodeId(null);
    });
  }, []);

  const runScan = async () => {
    const result = await runEngineeringScanFromDashboard();
    setScan(result);
    setSelectedNodeId(null);
    onScanLoaded(result);
  };

  const exportImpact = (reportType: string, format: EngineeringReportFormat, exporter: () => void) => {
    if (!selectedNode || !impact) return;
    exporter();
    onImpactExport({
      affectedCount:
        impact.directDependencies.length +
        impact.directDependents.length +
        impact.secondOrderDependencies.length +
        impact.secondOrderDependents.length,
      nodeLabel: selectedNode.label,
      nodeType: selectedNode.type,
      reportType: `${reportType} ${format.toUpperCase()}`,
      riskLevel: impact.riskLevel,
    });
  };

  const exportFullImpact = (format: EngineeringReportFormat) => {
    downloadFullImpactSummary(graph, format);
    onImpactExport({
      affectedCount: graph.nodes.length,
      nodeLabel: 'engineering graph',
      nodeType: 'graph',
      reportType: `full impact summary ${format.toUpperCase()}`,
      riskLevel: graph.summary.tables || graph.summary.supabaseFunctions || graph.summary.migrations ? 'high' : 'medium',
    });
  };

  const exportOwnershipHealth = (reportType: string, exporter: () => void) => {
    exporter();
    onImpactExport({
      affectedCount: graph.nodes.length,
      nodeLabel: 'engineering ownership health map',
      nodeType: 'graph',
      reportType,
      riskLevel: 'low',
    });
  };

  const exportPlanningReport = (reportType: string, exporter: () => void) => {
    exporter();
    onImpactExport({
      affectedCount: backlogItems.length,
      nodeLabel: 'engineering fix queue',
      nodeType: 'planning',
      reportType,
      riskLevel: 'low',
    });
  };

  const updateBacklogStatus = (itemId: string, status: EngineeringBacklogStatus) => {
    setBacklogStatusOverrides((current) => {
      const next = { ...current, [itemId]: status };
      localStorage.setItem(engineeringBacklogStatusStorageKey, JSON.stringify(next));
      return next;
    });
    onImpactExport({
      affectedCount: 1,
      nodeLabel: itemId,
      nodeType: 'planning-task',
      reportType: `fix queue status ${status}`,
      riskLevel: 'low',
    });
  };

  const exportIssueDrafts = (reportType: string, exporter: () => void) => {
    exporter();
    onImpactExport({
      affectedCount: issueDrafts.length,
      nodeLabel: 'engineering GitHub issue drafts',
      nodeType: 'issue-draft-planning',
      reportType,
      riskLevel: 'medium',
    });
  };

  const updateIssueDraftStatus = (draftId: string, status: EngineeringIssueDraftStatus) => {
    setIssueDraftStatusOverrides((current) => {
      const next = { ...current, [draftId]: status };
      localStorage.setItem(engineeringIssueDraftStatusStorageKey, JSON.stringify(next));
      return next;
    });
    onImpactExport({
      affectedCount: 1,
      nodeLabel: draftId,
      nodeType: 'issue-draft',
      reportType: `GitHub issue draft status ${status}`,
      riskLevel: 'medium',
    });
  };

  const copyIssueDraftMarkdown = (draftId: string, markdown: string) => {
    void navigator.clipboard?.writeText(markdown);
    onImpactExport({
      affectedCount: 1,
      nodeLabel: draftId,
      nodeType: 'issue-draft',
      reportType: 'GitHub issue draft markdown copied',
      riskLevel: 'medium',
    });
  };

  const runGitHubIssueCreation = async (drafts: typeof issueDrafts, mode: GitHubIssueCreationMode) => {
    if (!drafts.length || issueCreationBusy) return;
    setIssueCreationBusy(true);
    setIssueCreationMessage(`${mode === 'dry-run' ? 'Dry-running' : 'Creating'} ${drafts.length} GitHub issue draft${drafts.length === 1 ? '' : 's'}...`);

    const results: CreatedGitHubIssueRecord[] = [];
    for (const draft of drafts) {
      try {
        const result = await createGitHubIssueFromDraft(draft, githubIssueConfig, mode);
        results.push(result);
        if (result.status === 'created') updateIssueDraftStatus(draft.id, 'created_later');
        if (result.status === 'duplicate_skipped') updateIssueDraftStatus(draft.id, 'duplicate_skipped');
        onImpactExport({
          affectedCount: 1,
          nodeLabel: draft.id,
          nodeType: 'issue-draft',
          reportType: `GitHub issue creation ${mode} ${result.status}`,
          riskLevel: draft.priority === 'P0' || draft.priority === 'P1' ? 'high' : 'medium',
        });
      } catch (error) {
        const result: CreatedGitHubIssueRecord = {
          createdAt: new Date().toISOString(),
          draftId: draft.id,
          dryRun: mode === 'dry-run',
          message: error instanceof Error ? error.message : 'GitHub issue creation failed.',
          repo: draft.repo,
          status: 'failed',
          title: draft.title,
        };
        results.push(result);
        onImpactExport({
          affectedCount: 1,
          nodeLabel: draft.id,
          nodeType: 'issue-draft',
          reportType: `GitHub issue creation ${mode} failed`,
          riskLevel: draft.priority === 'P0' || draft.priority === 'P1' ? 'high' : 'medium',
        });
      }
    }

    persistCreatedGitHubIssues(results);
    setIssueCreationMessage(issueCreationSummary(results));
    setBulkCreationDraftIds([]);
    setIssueCreationBusy(false);
  };

  const persistCreatedGitHubIssues = (records: CreatedGitHubIssueRecord[]) => {
    setCreatedGitHubIssues((current) => {
      const next = [...records, ...current].slice(0, 200);
      localStorage.setItem(createdGitHubIssuesStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const createButtonDisabled = (draft = selectedIssueDraft) =>
    !draft ||
    !draft.readyForGitHub ||
    issueCreationBusy ||
    !githubIssueConfig.enabled ||
    githubIssueConfig.dryRun ||
    !hasGitHubTokenForRepo(resolveGitHubRepo(draft.repo, githubIssueConfig.owner)) ||
    Boolean(createdIssueByDraftId.get(draft.id));

  const summaryCards: Array<[string, number]> = [
    ['Repositories Indexed', graph.summary.repositoriesIndexed],
    ['Files Indexed', graph.summary.filesIndexed],
    ['Routes Found', graph.summary.routes],
    ['Components Found', graph.summary.components],
    ['Supabase Functions', graph.summary.supabaseFunctions],
    ['Migrations', graph.summary.migrations],
    ['Tables', graph.summary.tables],
    ['Dependencies', graph.summary.dependencies],
    ['Env Variable Names', graph.summary.envVariableNames],
    ['Docs', graph.summary.docs],
  ];

  return (
    <>
      <section className="summary-grid engineering-summary" aria-label="Engineering graph summary">
        {summaryCards.map(([label, value]) => (
          <article className="metric-card" key={label}>
            <Network size={20} />
            <span>{label}</span>
            <strong>{value.toLocaleString()}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <Panel title="Engineering Graph Controls" icon={<Network size={18} />} wide>
          <p className="panel-description">Refresh the local metadata graph and export read-only engineering reports.</p>
          <div className="control-toolbar graph-control-toolbar">
            <div className="fact-list compact-facts">
              <Fact label="Graph Source" value={scan.source === 'generated-json' ? 'Generated JSON' : 'Fallback'} />
              <Fact label="Loaded At" value={scan.loadedAt === 'Loading' ? scan.loadedAt : formatDate(scan.loadedAt)} />
              <Fact label="Generated At" value={graph.generatedAt === 'Not generated yet' ? graph.generatedAt : formatDate(graph.generatedAt)} />
              <Fact label="Mode" value={graph.scanner.mode} />
              <Fact label="Stores Contents" value={graph.scanner.storesFileContents ? 'Yes' : 'No'} />
            </div>
            <div className="control-stack">
              <span className="section-kicker">Actions</span>
              <div className="button-group">
                <button className="approval-button compact-button" onClick={runScan} type="button">
                  Run Engineering Scan
                </button>
              </div>
              <span className="section-kicker">Exports</span>
              <div className="export-group">
              <button className="report-button" disabled={!graph.nodes.length} onClick={() => downloadEngineeringGraph(graph)} type="button">
                <Download size={15} />
                <span>Graph JSON</span>
              </button>
              <button className="report-button" disabled={!graph.nodes.length} onClick={() => downloadEngineeringReport(graph)} type="button">
                <Download size={15} />
                <span>Report Markdown</span>
              </button>
              <ReportPair
                disabled={!graph.nodes.length}
                label="Full Impact Summary"
                onExport={exportFullImpact}
              />
              <ReportPair
                disabled={!graph.nodes.length}
                label="Ownership Map"
                onExport={(format) => {
                  downloadOwnershipMap(graph, format);
                  onImpactExport({
                    affectedCount: graph.nodes.length,
                    nodeLabel: 'engineering ownership map',
                    nodeType: 'graph',
                    reportType: `ownership map ${format.toUpperCase()}`,
                    riskLevel: 'low',
                  });
                }}
              />
              <button
                className="report-button"
                disabled={!graph.nodes.length}
                onClick={() => exportOwnershipHealth('repo health report MARKDOWN', () => downloadRepoHealthReport(graph))}
                type="button"
              >
                <Download size={15} />
                <span>Repo Health Markdown</span>
              </button>
              <button
                className="report-button"
                disabled={!graph.nodes.length}
                onClick={() => exportOwnershipHealth('risk queue report MARKDOWN', () => downloadRiskQueueReport(graph))}
                type="button"
              >
                <Download size={15} />
                <span>Risk Queue Markdown</span>
              </button>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Repository Intelligence Engine" icon={<Network size={18} />} wide>
          <p className="panel-description">
            Primary Engineering Agent knowledge source for repository structure, dependencies, ownership, health, documentation, and technical debt. This view is generated locally from metadata only.
          </p>
          <div className="summary-grid compact-summary">
            {[
              ['Engineering Health', `${repositoryIntelligence.engineeringHealthScore}/100`],
              ['Repository Risk', repositoryIntelligence.repositoryRisk],
              ['Dependency Health', repositoryIntelligence.dependencyHealth],
              ['Documentation', `${repositoryIntelligence.documentationCompleteness}%`],
              ['Dependency Edges', repositoryIntelligence.dependencyEdges],
              ['Orphaned Modules', repositoryIntelligence.orphanedModules],
              ['Technical Debt', repositoryIntelligence.technicalDebtMarkers],
              ['Warnings', repositoryIntelligence.engineeringWarnings],
            ].map(([label, value]) => (
              <article className="metric-card" key={label}>
                <Network size={18} />
                <span>{label}</span>
                <strong>{String(value)}</strong>
              </article>
            ))}
          </div>
          <DataTable
            columns={['Repository', 'Owner', 'Health', 'Risk', 'Docs', 'Warnings']}
            rows={graph.repositories.map((repo) => [
              repo.name,
              repo.owner ?? 'Unknown',
              `${repo.healthScore ?? 0}/100`,
              repo.riskLevel ?? 'unknown',
              String(repo.missingDocs ?? 0),
              String(repo.brokenRelationshipWarnings ?? 0),
            ])}
          />
          <DataTable
            columns={['Inventory', 'Count']}
            rows={[
              ['Modules', String(repositoryIntelligence.modules)],
              ['Applications', String(repositoryIntelligence.applications)],
              ['Services', String(repositoryIntelligence.services)],
              ['Libraries', String(repositoryIntelligence.libraries)],
              ['Packages', String(repositoryIntelligence.packages)],
              ['Documentation', String(repositoryIntelligence.documentation)],
              ['Migrations', String(repositoryIntelligence.migrations)],
              ['Configuration', String(repositoryIntelligence.configuration)],
              ['Scripts', String(repositoryIntelligence.scripts)],
            ]}
          />
          <p className="subtle-note">Use repo:scan and repo:validate from the root CLI for generated intelligence reports. No repository files or GitHub records are modified.</p>
        </Panel>

        <Panel title="Project Registry" icon={<Network size={18} />} wide>
          <p className="panel-description">
            Multi-project registry for Vyra Agents, mobile/backend, desktop, websites, Valor Solutions, and future projects. Engineering scans are local-only and never modify project repositories.
          </p>
          <div className="summary-grid compact-summary">
            {[
              ['Registered Projects', projectRegistry.registeredProjects],
              ['Indexed Projects', projectRegistry.indexedProjects],
              ['Blocked Projects', projectRegistry.blockedProjects],
              ['Missing Paths', projectRegistry.missingPaths],
              ['Release Readiness', projectRegistry.releaseReadinessStatus],
              ['Validation', projectRegistry.validationStatus],
            ].map(([label, value]) => (
              <article className="metric-card" key={label}>
                <Network size={18} />
                <span>{label}</span>
                <strong>{String(value)}</strong>
              </article>
            ))}
          </div>
          <DataTable
            columns={['Project', 'Repo', 'Agent', 'Status', 'Branch', 'Health', 'Release', 'Path']}
            rows={projectRegistry.projects.map((project) => [
              project.projectName,
              `${project.repoOwner}/${project.repoName}`,
              project.owningAgent,
              project.status.replace(/_/g, ' '),
              project.branch,
              `${project.healthScore}/100`,
              project.releaseReadiness,
              project.localPath,
            ])}
          />
          <DataTable
            columns={['Project', 'Validation Commands']}
            rows={projectRegistry.projects.map((project) => [
              project.projectName,
              project.validationCommands.length ? project.validationCommands.join(', ') : 'None configured',
            ])}
          />
          <p className="subtle-note">{projectRegistry.safetyStatus}</p>
        </Panel>

        <Panel title="Release Readiness Command Center" icon={<Workflow size={18} />} wide>
          <p className="panel-description">
            Per-project release checklist for build, lint, validation, tests, docs, secrets, blockers, risk, and recommended Engineering action. This analysis is local-only and does not deploy or modify project files.
          </p>
          <div className="summary-grid compact-summary">
            {[
              ['Ready Projects', releaseReadiness.readyProjects],
              ['Blocked Releases', releaseReadiness.blockedProjects],
              ['Critical Risks', releaseReadiness.criticalReleaseRisks],
              ['Average Score', `${releaseReadiness.averageReadinessScore}/100`],
              ['Trend', releaseReadiness.releaseReadinessTrend],
              ['Generated Blocker Tasks', engineeringTaskSummary.releaseBlockerEngineeringTasks],
            ].map(([label, value]) => (
              <article className="metric-card" key={label}>
                <Workflow size={18} />
                <span>{label}</span>
                <strong>{String(value)}</strong>
              </article>
            ))}
          </div>
          <DataTable
            columns={['Project', 'Build', 'Lint', 'Validation', 'Tests', 'Docs', 'Secrets', 'Score', 'Risk']}
            rows={releaseReadiness.projects.map((project) => [
              project.projectName,
              project.buildStatus,
              project.lintStatus,
              project.validationStatus,
              project.testStatus,
              project.docsStatus,
              project.secretsStatus,
              `${project.readinessScore}/100`,
              project.riskLevel,
            ])}
          />
          <DataTable
            columns={['Project', 'Severity', 'Blocker', 'Recommended Action']}
            rows={releaseReadiness.blockers.map((blocker) => [
              blocker.projectName,
              blocker.severity,
              blocker.reason,
              blocker.recommendedAction,
            ])}
          />
          <DataTable
            columns={['Candidate', 'Priority', 'Reason']}
            rows={engineeringTaskSummary.candidates
              .filter((candidate) => candidate.linkedReleaseBlocker)
              .map((candidate) => [candidate.title, candidate.recommendedPriority, candidate.reason])}
          />
          <p className="subtle-note">{releaseReadiness.safetyState}</p>
        </Panel>

        <Panel title="Release Ship Plan Workflow" icon={<ShieldCheck size={18} />} wide>
          <p className="panel-description">
            Local ship plans turn readiness into Engineering preparation checklists, blocker tasks, GitHub plan links, QA notes, and rollback notes without release execution.
          </p>
          <div className="summary-grid compact-summary">
            {[
              ['Ship Plans', releaseShipPlans.totalShipPlans],
              ['Needs Review', releaseShipPlans.shipPlansNeedingReview],
              ['Approved Prep', releaseShipPlans.approvedPreparationPlans],
              ['Blocked Plans', releaseShipPlans.blockedShipPlans],
              ['Ship Plan Tasks', engineeringTaskSummary.releaseShipPlanEngineeringTasks],
              ['Safety', releaseShipPlans.localApprovalStatus],
            ].map(([label, value]) => (
              <article className="metric-card" key={label}>
                <ShieldCheck size={18} />
                <span>{label}</span>
                <strong>{String(value).replace(/_/g, ' ')}</strong>
              </article>
            ))}
          </div>
          <DataTable
            columns={['Project', 'Checklist', 'Status', 'Decision', 'Score', 'Risk']}
            rows={releaseShipPlans.shipPlanQueue.map((plan) => [
              plan.projectName,
              plan.releaseChecklist.map((item) => `${item.label}: ${item.status}`).join(', '),
              plan.status.replace(/_/g, ' '),
              plan.recommendedShipDecision.replace(/_/g, ' '),
              `${plan.readinessScore}/100`,
              plan.riskLevel,
            ])}
          />
          <DataTable
            columns={['Project', 'Blockers Tied To Tasks', 'GitHub Plans', 'QA Notes', 'Rollback Notes']}
            rows={releaseShipPlans.shipPlanQueue.map((plan) => [
              plan.projectName,
              plan.linkedTasks.join(', ') || plan.blockers.map((blocker) => blocker.id).join(', ') || 'None',
              plan.linkedGitHubPlans.join(', ') || 'None',
              plan.qaNotes.join(' '),
              plan.rollbackNotes.join(' '),
            ])}
          />
          <p className="subtle-note">{releaseShipPlans.releaseSafetyStatus}</p>
        </Panel>

        <Panel title="Engineering Task Generator" icon={<ListChecks size={18} />} wide>
          <p className="panel-description">
            Deterministic task candidates generated from repository health, dependency warnings, orphaned modules, missing documentation, GitHub plans, Executive priorities, and blocked Sales or Migration work. Candidates stay local and approval-only.
          </p>
          <div className="summary-grid compact-summary">
            {[
              ['Generated Candidates', engineeringTaskSummary.generatedTasks],
              ['Critical', engineeringTaskSummary.criticalEngineeringTasks],
              ['Sales Blocking', engineeringTaskSummary.salesBlockingEngineeringTasks],
              ['Migration Blocking', engineeringTaskSummary.migrationBlockingEngineeringTasks],
              ['Project Specific', engineeringTaskSummary.projectSpecificEngineeringTasks],
              ['Release Blockers', engineeringTaskSummary.releaseBlockerEngineeringTasks],
              ['Release Readiness', engineeringTaskSummary.releaseReadinessTasks],
              ['Linked GitHub Plans', engineeringTaskSummary.linkedGitHubPlans],
              ['Linked Repo Risks', engineeringTaskSummary.linkedRepoRisks],
              ['Executive Priorities', engineeringTaskSummary.linkedExecutivePriorities],
            ].map(([label, value]) => (
              <article className="metric-card" key={label}>
                <ListChecks size={18} />
                <span>{label}</span>
                <strong>{String(value)}</strong>
              </article>
            ))}
          </div>
          <DataTable
            columns={['Candidate', 'Category', 'Priority', 'Repo Risk', 'GitHub Plan', 'Blocker', 'Reason']}
            rows={engineeringTaskSummary.candidates.map((candidate) => [
              candidate.title,
              candidate.category,
              candidate.recommendedPriority,
              candidate.linkedRepoRisk ?? 'None',
              candidate.linkedGitHubPlan ?? 'None',
              candidate.linkedSalesMigrationBlocker ?? 'None',
              candidate.reason,
            ])}
          />
          <div className="safety-badge-row">
            {engineeringTaskSummary.safetyLabels.map((label) => (
              <StatusBadge key={label} value={label} tone="good" />
            ))}
          </div>
        </Panel>

        <Panel title="Ownership Overview" icon={<Network size={18} />} wide>
          <DataTable
            columns={['Owner', 'Nodes', 'High Risk', 'Orphans', 'Missing Docs', 'Health']}
            rows={ownershipRows.map((row) => [
              row.owner,
              String(row.nodeCount),
              String(row.highRiskNodes),
              String(row.orphanCandidates),
              String(row.missingDocs),
              `${row.healthScore}/100`,
            ])}
          />
        </Panel>

        <Panel title="Product Area Map" icon={<ListChecks size={18} />} wide>
          <DataTable
            columns={['Feature Area', 'Routes / Screens', 'Tables', 'Functions', 'Docs', 'Risks']}
            rows={featureRows.map((row) => [
              formatHealth(row.featureArea),
              String(row.routes),
              String(row.tables),
              String(row.functions),
              String(row.docs),
              String(row.risks),
            ])}
          />
        </Panel>

        <Panel title="Engineering Planning Summary" icon={<ListChecks size={18} />} wide>
          <div className="summary-grid compact-summary">
            {[
              ['Total Backlog Items', backlogSummary.total],
              ['Critical', backlogSummary.critical],
              ['High', backlogSummary.high],
              ['Medium', backlogSummary.medium],
              ['Low', backlogSummary.low],
              ['Missing Docs', backlogSummary.missingDocs],
              ['Orphan Reviews', backlogSummary.orphanReviews],
              ['Broken Relationships', backlogSummary.brokenRelationships],
              ['Repo Health Tasks', backlogSummary.repoHealthTasks],
            ].map(([label, value]) => (
              <article className="metric-card" key={label}>
                <ListChecks size={18} />
                <span>{label}</span>
                <strong>{String(value)}</strong>
              </article>
            ))}
          </div>
          <div className="export-group">
            <ReportPair
              disabled={!backlogItems.length}
              label="Engineering Backlog"
              onExport={(format) => exportPlanningReport(`engineering backlog ${format.toUpperCase()}`, () => downloadEngineeringBacklog(backlogItems, format))}
            />
            <button className="report-button" disabled={!backlogItems.length} onClick={() => exportPlanningReport('documentation gap report MARKDOWN', () => downloadDocumentationGapPlanner(backlogItems))} type="button">
              <Download size={15} />
              <span>Documentation Gap Markdown</span>
            </button>
            <button className="report-button" disabled={!backlogItems.length} onClick={() => exportPlanningReport('orphan review report MARKDOWN', () => downloadOrphanReviewPlanner(backlogItems))} type="button">
              <Download size={15} />
              <span>Orphan Review Markdown</span>
            </button>
            <button className="report-button" disabled={!backlogItems.length} onClick={() => exportPlanningReport('broken relationship report MARKDOWN', () => downloadBrokenRelationshipPlanner(backlogItems))} type="button">
              <Download size={15} />
              <span>Broken Relationship Markdown</span>
            </button>
            <button className="report-button" disabled={!repoHealthPlans.length} onClick={() => exportPlanningReport('repo health improvement plan MARKDOWN', () => downloadRepoHealthImprovementPlan(graph))} type="button">
              <Download size={15} />
              <span>Repo Health Plan Markdown</span>
            </button>
          </div>
        </Panel>

        <Panel title="Engineering Fix Queue" icon={<ListChecks size={18} />} wide>
          <p className="panel-description">Filter advisory backlog items generated from graph warnings, risk signals, and repo health.</p>
          <div className="table-toolbar">
            <div className="filter-grid">
              <select aria-label="Filter backlog severity" value={planningSeverityFilter} onChange={(event) => setPlanningSeverityFilter(event.target.value)}>
                <option value="all">All severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select aria-label="Filter backlog category" value={planningCategoryFilter} onChange={(event) => setPlanningCategoryFilter(event.target.value)}>
                <option value="all">All categories</option>
                {uniqueSorted(backlogItems.map((item) => item.category)).map((category) => (
                  <option key={category} value={category}>
                    {formatHealth(category)}
                  </option>
                ))}
              </select>
              <select aria-label="Filter backlog owner" value={planningOwnerFilter} onChange={(event) => setPlanningOwnerFilter(event.target.value)}>
                <option value="all">All owners</option>
                {ownerGroups(graph).map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
              <select aria-label="Filter backlog repo" value={planningRepoFilter} onChange={(event) => setPlanningRepoFilter(event.target.value)}>
                <option value="all">All repos</option>
                {graph.repositories.map((repo) => (
                  <option key={repo.name} value={repo.name}>
                    {repo.name}
                  </option>
                ))}
              </select>
              <select aria-label="Filter backlog status" value={planningStatusFilter} onChange={(event) => setPlanningStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="reviewed">Reviewed</option>
                <option value="dismissed">Dismissed</option>
                <option value="planned">Planned</option>
                <option value="done">Done</option>
              </select>
              <select aria-label="Filter backlog effort" value={planningEffortFilter} onChange={(event) => setPlanningEffortFilter(event.target.value)}>
                <option value="all">All efforts</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <StatusBadge value={`${filteredBacklogItems.length} visible`} />
          </div>
          <DataTable
            columns={['Severity', 'Title', 'Category', 'Owner', 'Feature Area', 'Repo', 'Effort', 'Status', 'Recommended Action', 'Actions']}
            rows={filteredBacklogItems.slice(0, 60).map((item) => [
              <StatusBadge key={`${item.id}-severity`} value={formatHealth(item.severity)} tone={item.severity === 'critical' || item.severity === 'high' ? 'warn' : 'neutral'} />,
              item.title,
              formatHealth(item.category),
              item.owner,
              formatHealth(item.featureArea),
              item.repo,
              formatHealth(item.effort),
              formatHealth(item.status),
              item.recommendedAction,
              <BacklogActions itemId={item.id} key={item.id} onUpdate={updateBacklogStatus} />,
            ])}
          />
        </Panel>

        <Panel title="Documentation Gap Planner" icon={<ListChecks size={18} />} wide>
          <PlannerGroupTable groups={docPlannerGroups} />
        </Panel>

        <Panel title="Orphan Review Queue" icon={<ListChecks size={18} />} wide>
          <p className="subtle-note">Review candidate — do not delete automatically.</p>
          <PlannerGroupTable groups={orphanPlannerGroups} />
        </Panel>

        <Panel title="Broken Relationship Queue" icon={<Network size={18} />} wide>
          <DataTable
            columns={['Severity', 'Repo', 'Owner', 'Feature Area', 'Description', 'Recommended Investigation', 'Status', 'Actions']}
            rows={brokenRelationshipItems.slice(0, 50).map((item) => [
              <StatusBadge key={`${item.id}-severity`} value={formatHealth(item.severity)} tone={item.severity === 'critical' || item.severity === 'high' ? 'warn' : 'neutral'} />,
              item.repo,
              item.owner,
              formatHealth(item.featureArea),
              item.description,
              item.recommendedAction,
              formatHealth(item.status),
              <BacklogActions itemId={item.id} key={item.id} onUpdate={updateBacklogStatus} />,
            ])}
          />
        </Panel>

        <Panel title="Repo Health Improvement Plan" icon={<GitBranch size={18} />} wide>
          <DataTable
            columns={['Repo', 'Health', 'Risk', 'Effort', 'Expected Impact', 'Top Recommended Actions']}
            rows={repoHealthPlans.map((plan) => [
              plan.repo,
              `${plan.healthScore}/100`,
              formatHealth(plan.riskLevel),
              formatHealth(plan.effort),
              plan.expectedImpact,
              plan.recommendedActions.slice(0, 3).join(' · '),
            ])}
          />
        </Panel>

        <Panel title="GitHub Issue Draft Planner" icon={<GitBranch size={18} />} wide>
          <div className="summary-grid compact-summary">
            {[
              ['Total Drafts', issueDraftSummary.total],
              ['P0', issueDraftSummary.p0],
              ['P1', issueDraftSummary.p1],
              ['P2', issueDraftSummary.p2],
              ['P3', issueDraftSummary.p3],
              ['Ready for GitHub', issueDraftSummary.readyForGitHub],
              ['Approval Required', issueDraftSummary.approvalRequired],
              ['Exported', issueDraftSummary.exported],
              ['Created Issues', createdIssueCount],
              ['Duplicate Skips', duplicateSkipCount],
            ].map(([label, value]) => (
              <article className="metric-card" key={label}>
                <GitBranch size={18} />
                <span>{label}</span>
                <strong>{String(value)}</strong>
              </article>
            ))}
          </div>
          <div className="export-group">
            <button className="report-button" disabled={!issueDrafts.length} onClick={() => exportIssueDrafts('all issue drafts JSON', () => downloadIssueDraftCollection(issueDrafts, 'all-json'))} type="button">
              <Download size={15} />
              <span>All Issue Drafts JSON</span>
            </button>
            <button className="report-button" disabled={!issueDrafts.length} onClick={() => exportIssueDrafts('all issue drafts MARKDOWN', () => downloadIssueDraftCollection(issueDrafts, 'all-markdown'))} type="button">
              <Download size={15} />
              <span>All Issue Drafts Markdown</span>
            </button>
            <button className="report-button" disabled={!issueDrafts.some((draft) => draft.readyForGitHub)} onClick={() => exportIssueDrafts('ready GitHub issue drafts MARKDOWN', () => downloadIssueDraftCollection(issueDrafts, 'ready-markdown'))} type="button">
              <Download size={15} />
              <span>Ready Drafts Markdown</span>
            </button>
            <button className="report-button" disabled={!issueDrafts.some((draft) => draft.priority === 'P0' || draft.priority === 'P1')} onClick={() => exportIssueDrafts('P0 P1 issue drafts MARKDOWN', () => downloadIssueDraftCollection(issueDrafts, 'p0-p1-markdown'))} type="button">
              <Download size={15} />
              <span>P0/P1 Drafts Markdown</span>
            </button>
          </div>
          <div className="metadata-list">
            <div className="fact">
              <span>Issue Creation Enabled</span>
              <strong>{githubIssueConfig.enabled ? 'Yes' : 'No'}</strong>
            </div>
            <div className="fact">
              <span>Dry Run</span>
              <strong>{githubIssueConfig.dryRun ? 'Yes' : 'No'}</strong>
            </div>
            <div className="fact">
              <span>Default Token</span>
              <strong>{formatHealth(githubTokenStatus.defaultToken)}</strong>
            </div>
            <div className="fact">
              <span>Vyra-Part-1 Token</span>
              <strong>{formatHealth(githubTokenStatus.vyraPart1Token)}</strong>
            </div>
            <div className="fact">
              <span>Owner</span>
              <strong>{githubIssueConfig.owner || 'Missing'}</strong>
            </div>
          </div>
          <div className="action-row">
            <button className="report-button" disabled={!selectedIssueDraft?.readyForGitHub || issueCreationBusy} onClick={() => selectedIssueDraft && void runGitHubIssueCreation([selectedIssueDraft], 'dry-run')} type="button">
              Dry Run Selected Draft
            </button>
            <button className="report-button" disabled={!readyIssueDrafts.length || issueCreationBusy} onClick={() => void runGitHubIssueCreation(readyIssueDrafts, 'dry-run')} type="button">
              Dry Run Ready Drafts
            </button>
            <button className="report-button" disabled={!readyP0P1IssueDrafts.length || issueCreationBusy} onClick={() => void runGitHubIssueCreation(readyP0P1IssueDrafts, 'dry-run')} type="button">
              Dry Run P0/P1 Ready Drafts
            </button>
            <button className="report-button" disabled={!filteredReadyIssueDrafts.length || filteredReadyIssueDrafts.every((draft) => createButtonDisabled(draft))} onClick={() => setBulkCreationDraftIds(filteredReadyIssueDrafts.filter((draft) => !createButtonDisabled(draft)).map((draft) => draft.id))} type="button">
              Create Selected Ready Drafts
            </button>
            <button className="report-button" disabled={!readyP0P1IssueDrafts.length || readyP0P1IssueDrafts.every((draft) => createButtonDisabled(draft))} onClick={() => setBulkCreationDraftIds(readyP0P1IssueDrafts.filter((draft) => !createButtonDisabled(draft)).map((draft) => draft.id))} type="button">
              Create P0/P1 Ready Drafts
            </button>
          </div>
          {pendingBulkDrafts.length ? (
            <div className="detail-panel">
              <div className="split-panel">
                <p className="panel-copy">Confirm live GitHub issue creation for {pendingBulkDrafts.length} ready draft{pendingBulkDrafts.length === 1 ? '' : 's'}.</p>
                <div className="button-row end-row">
                  <button className="approval-button compact-button" disabled={issueCreationBusy} onClick={() => void runGitHubIssueCreation(pendingBulkDrafts, 'live')} type="button">
                    Confirm Create
                  </button>
                  <button className="clear-button" disabled={issueCreationBusy} onClick={() => setBulkCreationDraftIds([])} type="button">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          <p className="subtle-note">{issueCreationMessage}</p>
          <div className="table-toolbar">
            <div className="filter-grid">
              <select aria-label="Filter issue priority" value={issuePriorityFilter} onChange={(event) => setIssuePriorityFilter(event.target.value)}>
                <option value="all">All priorities</option>
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
              </select>
              <select aria-label="Filter issue repo" value={issueRepoFilter} onChange={(event) => setIssueRepoFilter(event.target.value)}>
                <option value="all">All repos</option>
                {uniqueSorted(issueDrafts.map((draft) => draft.repo)).map((repo) => (
                  <option key={repo} value={repo}>
                    {repo}
                  </option>
                ))}
              </select>
              <select aria-label="Filter issue owner" value={issueOwnerFilter} onChange={(event) => setIssueOwnerFilter(event.target.value)}>
                <option value="all">All owners</option>
                {uniqueSorted(issueDrafts.map((draft) => draft.owner)).map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
              <select aria-label="Filter issue feature area" value={issueFeatureFilter} onChange={(event) => setIssueFeatureFilter(event.target.value)}>
                <option value="all">All feature areas</option>
                {uniqueSorted(issueDrafts.map((draft) => draft.featureArea)).map((featureArea) => (
                  <option key={featureArea} value={featureArea}>
                    {formatHealth(featureArea)}
                  </option>
                ))}
              </select>
              <select aria-label="Filter issue category" value={issueCategoryFilter} onChange={(event) => setIssueCategoryFilter(event.target.value)}>
                <option value="all">All categories</option>
                {uniqueSorted(issueDrafts.map((draft) => draft.category)).map((category) => (
                  <option key={category} value={category}>
                    {formatHealth(category)}
                  </option>
                ))}
              </select>
              <select aria-label="Filter issue status" value={issueStatusFilter} onChange={(event) => setIssueStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="dismissed">Dismissed</option>
                <option value="exported">Exported</option>
                <option value="created_later">Created Later</option>
                <option value="duplicate_skipped">Duplicate Skipped</option>
              </select>
              <select aria-label="Filter ready for GitHub" value={issueReadyFilter} onChange={(event) => setIssueReadyFilter(event.target.value)}>
                <option value="all">All readiness</option>
                <option value="true">Ready</option>
                <option value="false">Not ready</option>
              </select>
            </div>
            <StatusBadge value={`${filteredIssueDrafts.length} drafts`} />
          </div>
          <DataTable
            columns={['Priority', 'Title', 'Repo', 'Owner', 'Feature Area', 'Category', 'Severity', 'Effort', 'Status', 'Ready', 'GitHub', 'Open']}
            rows={filteredIssueDrafts.slice(0, 60).map((draft) => {
              const record = createdIssueByDraftId.get(draft.id);
              return [
                <StatusBadge key={`${draft.id}-priority`} value={draft.priority} tone={draft.priority === 'P0' || draft.priority === 'P1' ? 'warn' : 'neutral'} />,
                draft.title,
                draft.repo,
                draft.owner,
                formatHealth(draft.featureArea),
                formatHealth(draft.category),
                formatHealth(draft.severity),
                formatHealth(draft.effort),
                formatHealth(draft.status),
                draft.readyForGitHub ? 'Yes' : 'No',
                record ? issueRecordLabel(record) : 'Not created',
                <button className="inline-action" key={draft.id} onClick={() => setSelectedIssueDraftId(draft.id)} type="button">
                  Open
                </button>,
              ];
            })}
          />
          <DataTable
            columns={['Status', 'Draft', 'Repo', 'Issue', 'Created At']}
            rows={createdGitHubIssues.slice(0, 10).map((record) => [
              formatHealth(record.status),
              record.draftId,
              record.repo,
              record.issueUrl || record.existingIssueUrl || record.message,
              formatDate(record.createdAt),
            ])}
          />
        </Panel>

        <Panel title="Issue Draft Detail" icon={<GitBranch size={18} />} wide>
          {selectedIssueDraft ? (
            <div className="node-detail-grid">
              <div className="detail-panel">
                <div className="fact-list compact-facts">
                  <Fact label="Title" value={selectedIssueDraft.title} />
                  <Fact label="Priority" value={selectedIssueDraft.priority} />
                  <Fact label="Repo" value={selectedIssueDraft.repo} />
                  <Fact label="Owner" value={selectedIssueDraft.owner} />
                  <Fact label="Feature Area" value={formatHealth(selectedIssueDraft.featureArea)} />
                  <Fact label="Category" value={formatHealth(selectedIssueDraft.category)} />
                  <Fact label="Severity" value={formatHealth(selectedIssueDraft.severity)} />
                  <Fact label="Effort" value={formatHealth(selectedIssueDraft.effort)} />
                  <Fact label="Status" value={formatHealth(selectedIssueDraft.status)} />
                  <Fact label="Ready" value={selectedIssueDraft.readyForGitHub ? 'Yes' : 'No'} />
                  <Fact label="GitHub Issue" value={selectedIssueRecord ? issueRecordLabel(selectedIssueRecord) : 'Not created'} />
                </div>
                <div className="button-row">
                  <button className="report-button" onClick={() => updateIssueDraftStatus(selectedIssueDraft.id, 'ready')} type="button">Mark Ready</button>
                  <button className="report-button" onClick={() => updateIssueDraftStatus(selectedIssueDraft.id, 'draft')} type="button">Mark Draft</button>
                  <button className="report-button" onClick={() => updateIssueDraftStatus(selectedIssueDraft.id, 'dismissed')} type="button">Dismiss</button>
                  <button className="report-button" onClick={() => updateIssueDraftStatus(selectedIssueDraft.id, 'exported')} type="button">Mark Exported</button>
                  <button className="report-button" onClick={() => copyIssueDraftMarkdown(selectedIssueDraft.id, selectedIssueDraft.bodyMarkdown)} type="button">
                    <Copy size={15} />
                    <span>Copy Markdown</span>
                  </button>
                  <button className="report-button" onClick={() => exportIssueDrafts('selected issue draft MARKDOWN', () => downloadIssueDraft(selectedIssueDraft))} type="button">
                    <Download size={15} />
                    <span>Export Draft Markdown</span>
                  </button>
                  <button className="report-button" disabled={!selectedIssueDraft.readyForGitHub || issueCreationBusy} onClick={() => void runGitHubIssueCreation([selectedIssueDraft], 'dry-run')} type="button">
                    Dry Run Selected Draft
                  </button>
                  <button className="approval-button compact-button" disabled={createButtonDisabled(selectedIssueDraft)} onClick={() => void runGitHubIssueCreation([selectedIssueDraft], 'live')} type="button">
                    Create GitHub Issue
                  </button>
                </div>
                <div className="metadata-list">
                  <div className="fact">
                    <span>Labels</span>
                    <strong>{selectedIssueDraft.labels.join(', ')}</strong>
                  </div>
                  <div className="fact">
                    <span>Source Items</span>
                    <strong>{String(selectedIssueDraft.sourceBacklogItemIds.length)}</strong>
                  </div>
                </div>
              </div>
              <pre className="markdown-preview">{selectedIssueDraft.bodyMarkdown}</pre>
            </div>
          ) : (
            <EmptyState message="Open an issue draft to review markdown, labels, source backlog items, and local-only actions." />
          )}
        </Panel>

        <Panel title="Repo Health Score" icon={<GitBranch size={18} />} wide>
          <DataTable
            columns={['Repository', 'Owner', 'Health', 'Risk', 'High Risk', 'Missing Docs', 'Orphans', 'Warnings']}
            rows={graph.repositories.map((repo) => [
              repo.name,
              repo.owner || 'Unknown',
              `${repo.healthScore ?? 0}/100`,
              <StatusBadge key={`${repo.name}-risk`} value={formatHealth(repo.riskLevel || 'unknown')} tone={riskTone(repo.riskLevel || 'unknown')} />,
              String(repo.highRiskNodes ?? 0),
              String(repo.missingDocs ?? 0),
              String(repo.orphanCandidates ?? 0),
              String(repo.brokenRelationshipWarnings ?? 0),
            ])}
          />
        </Panel>

        <Panel title="Table-to-Screen Map" icon={<Database size={18} />} wide>
          <div className="export-group">
            <button
              className="report-button"
              disabled={!graph.nodes.length}
              onClick={() => exportOwnershipHealth('table-to-screen map JSON', () => downloadTableScreenMap(graph))}
              type="button"
            >
              <Download size={15} />
              <span>Table-to-Screen Map JSON</span>
            </button>
          </div>
          <DataTable
            columns={['Table', 'Owner', 'Routes / Screens', 'Files / Services', 'Functions', 'Migrations', 'Open']}
            rows={tableScreenRows.slice(0, 24).map((row) => [
              row.table.label,
              row.table.owner || 'Unknown',
              formatNodeList(row.routes),
              formatNodeList([...row.files, ...row.services]),
              formatNodeList(row.functions),
              formatNodeList(row.migrations),
              <button className="inline-action" key={row.table.id} onClick={() => setSelectedNodeId(row.table.id)} type="button">
                Open
              </button>,
            ])}
          />
        </Panel>

        <Panel title="Function-to-Table Map" icon={<Database size={18} />} wide>
          <div className="export-group">
            <button
              className="report-button"
              disabled={!graph.nodes.length}
              onClick={() => exportOwnershipHealth('function-to-table map JSON', () => downloadFunctionTableMap(graph))}
              type="button"
            >
              <Download size={15} />
              <span>Function-to-Table Map JSON</span>
            </button>
          </div>
          <DataTable
            columns={['Function', 'Owner', 'Risk', 'Docs', 'Reads', 'Writes', 'References', 'Open']}
            rows={functionTableRows.slice(0, 24).map((row) => [
              row.functionNode.label,
              row.functionNode.owner || 'Unknown',
              <StatusBadge key={`${row.functionNode.id}-risk`} value={formatHealth(row.riskLevel)} tone={riskTone(row.riskLevel)} />,
              formatHealth(row.docsStatus || 'unknown'),
              formatNodeList(row.tablesRead),
              formatNodeList(row.tablesWritten),
              formatNodeList(row.tablesReferenced),
              <button className="inline-action" key={row.functionNode.id} onClick={() => setSelectedNodeId(row.functionNode.id)} type="button">
                Open
              </button>,
            ])}
          />
        </Panel>

        <Panel title="Risk & Warning Queue" icon={<ListChecks size={18} />} wide>
          <div className="table-toolbar">
            <div className="filter-grid">
              <select aria-label="Filter risk owner" value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
                <option value="all">All owners</option>
                {ownerGroups(graph).map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
              <select aria-label="Filter risk repo" value={riskRepoFilter} onChange={(event) => setRiskRepoFilter(event.target.value)}>
                <option value="all">All repos</option>
                {graph.repositories.map((repo) => (
                  <option key={repo.name} value={repo.name}>
                    {repo.name}
                  </option>
                ))}
              </select>
              <select aria-label="Filter risk node type" value={riskNodeTypeFilter} onChange={(event) => setRiskNodeTypeFilter(event.target.value)}>
                <option value="all">All node types</option>
                {nodeTypes(graph).map((type) => (
                  <option key={type} value={type}>
                    {formatHealth(type)}
                  </option>
                ))}
              </select>
              <select aria-label="Filter risk level" value={riskLevelFilter} onChange={(event) => setRiskLevelFilter(event.target.value)}>
                <option value="all">All risks</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="unknown">Unknown</option>
              </select>
              <select aria-label="Filter warning type" value={warningTypeFilter} onChange={(event) => setWarningTypeFilter(event.target.value)}>
                <option value="high_risk">High risk nodes</option>
                <option value="missing_docs">Missing docs</option>
                <option value="orphan">Orphan candidates</option>
                <option value="broken_relationship">Broken relationships</option>
              </select>
            </div>
            <div className="button-row">
              <StatusBadge value={`${riskQueue.highRiskNodes.length} high risk`} tone="warn" />
              <StatusBadge value={`${riskQueue.missingDocs.length} missing docs`} />
              <StatusBadge value={`${riskQueue.orphanCandidates.length} orphans`} />
              <StatusBadge value={`${riskQueue.brokenRelationships.length} warnings`} tone="warn" />
            </div>
          </div>
          <div className="export-group">
            <button
              className="report-button"
              disabled={!graph.nodes.length}
              onClick={() => exportOwnershipHealth('missing docs report MARKDOWN', () => downloadMissingDocsReport(graph))}
              type="button"
            >
              <Download size={15} />
              <span>Missing Docs Markdown</span>
            </button>
            <button
              className="report-button"
              disabled={!graph.nodes.length}
              onClick={() => exportOwnershipHealth('orphan candidates report MARKDOWN', () => downloadOrphanCandidatesReport(graph))}
              type="button"
            >
              <Download size={15} />
              <span>Orphan Candidates Markdown</span>
            </button>
          </div>
          {warningTypeFilter === 'broken_relationship' ? (
            <DataTable
              columns={['Warning']}
              rows={brokenWarningRows.slice(0, 40).map((warning) => [warning.replace(/^Relationship warning:\s*/, '')])}
            />
          ) : (
            <DataTable
              columns={['Node', 'Type', 'Owner', 'Repo', 'Risk', 'Docs', 'Orphan', 'Signals', 'Open']}
              rows={riskRows.slice(0, 40).map((node) => [
                node.label,
                formatHealth(node.type),
                node.owner || 'Unknown',
                node.repo,
                formatHealth(riskLevelForNode(node)),
                formatHealth(node.docStatus || 'unknown'),
                formatHealth(node.orphanStatus || 'unknown'),
                (node.riskSignals || []).slice(0, 2).join(' · '),
                <button className="inline-action" key={node.id} onClick={() => setSelectedNodeId(node.id)} type="button">
                  Open
                </button>,
              ])}
            />
          )}
        </Panel>

        <Panel title="Global Graph Search" icon={<Search size={18} />} wide>
          <div className="search-panel">
            <label className="input-control">
              <span>Search graph nodes</span>
              <input
                aria-label="Search graph nodes"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search label, type, repo, path, or safe metadata"
                value={query}
              />
            </label>
            <DataTable
              columns={['Label', 'Type', 'Repo', 'Path', 'Edges', 'Status', 'Open']}
              rows={searchResults.slice(0, 24).map((result) => [
                result.node.label,
                formatHealth(result.node.type),
                result.node.repo,
                result.node.path,
                String(result.connectedEdgeCount),
                <StatusBadge key={`${result.node.id}-status`} value={formatHealth(result.node.status)} tone={result.node.status === 'missing' ? 'warn' : 'neutral'} />,
                <button className="inline-action" key={`${result.node.id}-open`} onClick={() => setSelectedNodeId(result.node.id)} type="button">
                  Open
                </button>,
              ])}
            />
          </div>
        </Panel>

        <Panel title="Node Detail" icon={<CheckCircle2 size={18} />} wide>
          {selectedNode && impact ? (
            <div className="node-detail-grid">
              <div className="detail-panel">
                <div className="fact-list compact-facts">
                  <Fact label="Label" value={selectedNode.label} />
                  <Fact label="Type" value={formatHealth(selectedNode.type)} />
                  <Fact label="Repo" value={selectedNode.repo} />
                  <Fact label="Status" value={formatHealth(selectedNode.status)} />
                  <Fact label="Incoming" value={String(impact.directDependents.length)} />
                  <Fact label="Outgoing" value={String(impact.directDependencies.length)} />
                  <Fact label="Risk" value={formatHealth(impact.riskLevel)} />
                  <Fact label="Path" value={selectedNode.path} />
                </div>
                <MetadataList metadata={selectedNode.metadata} />
                <div className="button-row">
                  <button className="report-button" onClick={() => void navigator.clipboard?.writeText(selectedNode.id)} type="button">
                    <Copy size={15} />
                    <span>Copy Node ID</span>
                  </button>
                  <ReportPair
                    label="Node Detail"
                    onExport={(format) => downloadNodeDetailReport(graph, selectedNode, format)}
                  />
                  <ReportPair
                    label="Node Impact"
                    onExport={(format) =>
                      exportImpact('node impact report', format, () => downloadNodeImpactReport(graph, selectedNode, format))
                    }
                  />
                  <button className="clear-button" onClick={() => setSelectedNodeId(null)} type="button">
                    <X size={15} />
                    <span>Clear Selection</span>
                  </button>
                </div>
              </div>
              <ImpactSummary impact={impact} />
            </div>
          ) : (
            <EmptyState message="Search for a node or open one from the graph list." />
          )}
        </Panel>

        <Panel title="Relationship Explorer" icon={<Network size={18} />} wide>
          {selectedNode ? (
            <>
              <div className="table-toolbar">
                <div className="filter-grid compact-filter-grid">
                  <select aria-label="Filter relationship type" value={relationshipTypeFilter} onChange={(event) => setRelationshipTypeFilter(event.target.value)}>
                    <option value="all">All relationships</option>
                    {edgeTypes(graph).map((type) => (
                      <option key={type} value={type}>
                        {formatHealth(type)}
                      </option>
                    ))}
                  </select>
                  <select aria-label="Filter relationship node type" value={relationshipNodeTypeFilter} onChange={(event) => setRelationshipNodeTypeFilter(event.target.value)}>
                    <option value="all">All node types</option>
                    {nodeTypes(graph).map((type) => (
                      <option key={type} value={type}>
                        {formatHealth(type)}
                      </option>
                    ))}
                  </select>
                  <select aria-label="Filter relationship repo" value={relationshipRepoFilter} onChange={(event) => setRelationshipRepoFilter(event.target.value)}>
                    <option value="all">All repos</option>
                    {relationshipRepos.map((repo) => (
                      <option key={repo} value={repo}>
                        {repo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="button-row">
                  <StatusBadge value={`${inbound.length} inbound`} />
                  <StatusBadge value={`${outbound.length} outbound`} />
                </div>
              </div>
              <div className="relationship-grid">
                <RelationshipList relationships={inbound} title="Inbound" onSelect={setSelectedNodeId} />
                <RelationshipList relationships={outbound} title="Outbound" onSelect={setSelectedNodeId} />
              </div>
            </>
          ) : (
            <EmptyState message="Select a node to explore relationships." />
          )}
        </Panel>

        <Panel title="Table Impact View" icon={<Database size={18} />} wide>
          {selectedNode?.type === 'table' && tableView ? (
            <>
              <ImpactBuckets
                buckets={[
                  ['Migrations', tableView.migrations],
                  ['RLS Policies', tableView.policies],
                  ['Functions', tableView.functions],
                  ['Files / Services', [...tableView.files, ...tableView.services]],
                  ['Routes / Screens', tableView.routes],
                ]}
                onSelect={setSelectedNodeId}
              />
              <ReportPair
                label="Table Impact"
                onExport={(format) =>
                  exportImpact('table impact report', format, () => downloadTableImpactReport(graph, selectedNode, format))
                }
              />
            </>
          ) : (
            <EmptyState message="Select a table node to see migrations, policies, functions, files, and affected routes." />
          )}
        </Panel>

        <Panel title="Route / Screen Impact View" icon={<ListChecks size={18} />} wide>
          {selectedNode && ['route', 'screen'].includes(selectedNode.type) && routeView ? (
            <>
              <ImpactBuckets
                buckets={[
                  ['Owner Files', routeView.ownerFiles],
                  ['Components', routeView.components],
                  ['Hooks / Services', [...routeView.hooks, ...routeView.services]],
                  ['Tables', routeView.tables],
                  ['Functions', routeView.functions],
                ]}
                onSelect={setSelectedNodeId}
              />
              <ReportPair
                label="Route Impact"
                onExport={(format) =>
                  exportImpact('route impact report', format, () => downloadRouteImpactReport(graph, selectedNode, format))
                }
              />
            </>
          ) : (
            <EmptyState message="Select a route or screen node to see owner files, components, hooks, tables, and functions." />
          )}
        </Panel>

        <Panel title="Migration History View" icon={<GitBranch size={18} />} wide>
          {migrationView ? (
            <>
              <ImpactBuckets
                buckets={[
                  ['Migrations', migrationView.migrations],
                  ['Created Tables', migrationView.createdTables],
                  ['Altered Tables', migrationView.alteredTables],
                  ['Policies', migrationView.policies],
                  ['Related Files', migrationView.relatedFiles],
                ]}
                onSelect={setSelectedNodeId}
              />
              <ReportPair
                label="Migration History"
                onExport={(format) =>
                  exportImpact('migration history report', format, () => downloadMigrationHistoryReport(graph, selectedNode!, format))
                }
              />
            </>
          ) : (
            <EmptyState message="Select a table or migration node to see chronological migration history." />
          )}
        </Panel>

        <Panel title="Repository Explorer" icon={<GitBranch size={18} />} wide>
          <DataTable
            columns={['Repository', 'Status', 'Branch', 'Commit', 'Dirty', 'Files', 'Functions', 'Migrations', 'Tables']}
            rows={graph.repositories.map((repo) => [
              repo.name,
              <StatusBadge key={`${repo.name}-status`} value={formatHealth(repo.status)} tone={repo.status === 'missing' ? 'warn' : 'good'} />,
              repo.branch,
              shortSha(repo.latestCommit),
              repo.dirty ? 'Yes' : 'No',
              String(repo.filesIndexed),
              String(repo.functions),
              String(repo.migrations),
              String(repo.tables),
            ])}
          />
        </Panel>

        <Panel title="Knowledge Graph Overview" icon={<Network size={18} />} wide>
          <GraphOverview graph={graph} onSelect={setSelectedNodeId} />
        </Panel>
      </section>
    </>
  );
}

function ImpactSummary({ impact }: { impact: ReturnType<typeof analyzeEngineeringImpact> }) {
  return (
    <div className="impact-summary">
      <div>
        <strong>Impact Analysis</strong>
        <StatusBadge value={`${formatHealth(impact.riskLevel)} Risk`} tone={riskTone(impact.riskLevel)} />
      </div>
      <div className="rule-list">
        {impact.riskReasons.map((reason) => (
          <p key={reason}>{reason}</p>
        ))}
      </div>
      <div className="fact-list compact-facts">
        <Fact label="Affected Repos" value={String(impact.affectedRepos.length)} />
        <Fact label="Routes / Screens" value={String(impact.affectedRoutes.length)} />
        <Fact label="Components" value={String(impact.affectedComponents.length)} />
        <Fact label="Functions" value={String(impact.affectedSupabaseFunctions.length)} />
        <Fact label="Tables" value={String(impact.affectedTables.length)} />
        <Fact label="Migrations" value={String(impact.affectedMigrations.length)} />
      </div>
    </div>
  );
}

function RelationshipList({
  onSelect,
  relationships,
  title,
}: {
  onSelect(_id: string): void;
  relationships: EngineeringRelationship[];
  title: string;
}) {
  return (
    <div>
      <h3>{title}</h3>
      {relationships.length === 0 ? (
        <EmptyState message={`No ${title.toLowerCase()} relationships match the filters.`} />
      ) : (
        <DataTable
          columns={['Node', 'Type', 'Repo', 'Relationship', 'Open']}
          rows={relationships.slice(0, 40).map((relationship) => [
            relationship.node.label,
            formatHealth(relationship.node.type),
            relationship.node.repo,
            formatHealth(relationship.edge.type),
            <button className="inline-action" key={relationship.edge.id} onClick={() => onSelect(relationship.node.id)} type="button">
              Open
            </button>,
          ])}
        />
      )}
    </div>
  );
}

function ImpactBuckets({ buckets, onSelect }: { buckets: Array<[string, EngineeringNode[]]>; onSelect(_id: string): void }) {
  return (
    <div className="impact-buckets">
      {buckets.map(([title, nodes]) => (
        <div className="impact-bucket" key={title}>
          <h3>{title}</h3>
          {nodes.length === 0 ? (
            <EmptyState message="None detected." />
          ) : (
            <div className="history-list compact-history">
              {nodes.slice(0, 12).map((node) => (
                <div className="history-item" key={node.id}>
                  <div>
                    <strong>{node.label}</strong>
                    <span>
                      {formatHealth(node.type)} · {node.repo}
                    </span>
                  </div>
                  <button className="inline-action" onClick={() => onSelect(node.id)} type="button">
                    Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function GraphOverview({ graph, onSelect }: { graph: EngineeringGraph; onSelect(_id: string): void }) {
  const topNodes = topConnectedNodes(graph);
  const missingWarnings = missingRepositoryWarnings(graph);
  const supabaseRows = graph.nodes
    .filter((node) => ['migration', 'table', 'rls_policy', 'supabase_function'].includes(node.type))
    .slice(0, 40);
  const dependencyRows = graph.nodes.filter((node) => node.type === 'package_dependency' || node.type === 'npm_script').slice(0, 40);

  return (
    <>
      {missingWarnings.length || graph.warnings.length ? (
        <div className="warning-list">
          {[...missingWarnings, ...graph.warnings].slice(0, 6).map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
      <div className="graph-browser">
        <div>
          <h3>Top Connected Nodes</h3>
          <div className="history-list compact-history">
            {topNodes.map((item) =>
              item.node ? (
                <div className="history-item" key={item.node.id}>
                  <div>
                    <strong>{item.node.label}</strong>
                    <span>
                      {formatHealth(item.node.type)} · {item.node.repo}
                    </span>
                  </div>
                  <button className="inline-action" onClick={() => onSelect(item.node!.id)} type="button">
                    {item.count} links
                  </button>
                </div>
              ) : null,
            )}
          </div>
        </div>
        <div>
          <h3>Supabase Map</h3>
          <DataTable
            columns={['Type', 'Label', 'Repo', 'Path', 'Open']}
            rows={supabaseRows.map((node) => [
              formatHealth(node.type),
              node.label,
              node.repo,
              node.path,
              <button className="inline-action" key={node.id} onClick={() => onSelect(node.id)} type="button">
                Open
              </button>,
            ])}
          />
        </div>
      </div>
      <div className="section-gap">
        <h3>Dependency Map</h3>
        <DataTable
          columns={['Type', 'Name', 'Repo', 'Metadata', 'Open']}
          rows={dependencyRows.map((node) => [
            formatHealth(node.type),
            node.label,
            node.repo,
            formatMetadata(node.metadata),
            <button className="inline-action" key={node.id} onClick={() => onSelect(node.id)} type="button">
              Open
            </button>,
          ])}
        />
      </div>
    </>
  );
}

function MetadataList({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata).filter(([, value]) => value !== undefined && value !== '');
  if (!entries.length) return <EmptyState message="No metadata recorded for this node." />;
  return (
    <div className="metadata-list">
      {entries.slice(0, 12).map(([key, value]) => (
        <div className="fact" key={key}>
          <span>{formatHealth(key)}</span>
          <strong>{String(value)}</strong>
        </div>
      ))}
    </div>
  );
}

function ReportPair({
  disabled = false,
  label,
  onExport,
}: {
  disabled?: boolean;
  label: string;
  onExport(_format: EngineeringReportFormat): void;
}) {
  return (
    <div className="button-row compact-row">
      <button className="report-button" disabled={disabled} onClick={() => onExport('json')} type="button">
        <Download size={15} />
        <span>{label} JSON</span>
      </button>
      <button className="report-button" disabled={disabled} onClick={() => onExport('markdown')} type="button">
        <Download size={15} />
        <span>{label} Markdown</span>
      </button>
    </div>
  );
}

function PlannerGroupTable({ groups }: { groups: EngineeringPlannerGroup[] }) {
  return (
    <DataTable
      columns={['Repo', 'Owner', 'Feature Area', 'Items', 'Effort', 'Examples']}
      rows={groups.slice(0, 40).map((group) => [
        group.repo,
        group.owner,
        formatHealth(group.featureArea),
        String(group.count),
        formatHealth(group.effort),
        group.items.slice(0, 3).map((item) => item.title).join(' · '),
      ])}
    />
  );
}

function BacklogActions({ itemId, onUpdate }: { itemId: string; onUpdate(_itemId: string, _status: EngineeringBacklogStatus): void }) {
  return (
    <div className="button-row compact-row">
      {[
        ['reviewed', 'Reviewed'],
        ['planned', 'Plan'],
        ['dismissed', 'Dismiss'],
        ['done', 'Done'],
        ['open', 'Reset'],
      ].map(([status, label]) => (
        <button className="inline-action" key={status} onClick={() => onUpdate(itemId, status as EngineeringBacklogStatus)} type="button">
          {label}
        </button>
      ))}
    </div>
  );
}

function Panel({ children, icon, title, wide = false }: { children: ReactNode; icon: ReactNode; title: string; wide?: boolean }) {
  return (
    <section className={wide ? 'panel wide-panel' : 'panel'}>
      <div className="panel-header">
        <div>
          {icon}
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function filterRelationships(relationships: EngineeringRelationship[], relationshipType: string, nodeType: string, repo: string): EngineeringRelationship[] {
  return relationships.filter(
    (relationship) =>
      (relationshipType === 'all' || relationship.edge.type === relationshipType) &&
      (nodeType === 'all' || relationship.node.type === nodeType) &&
      (repo === 'all' || relationship.node.repo === repo),
  );
}

function formatMetadata(metadata: Record<string, unknown>): string {
  const entries = Object.entries(metadata).filter(([, value]) => value !== undefined && value !== '');
  return entries
    .slice(0, 3)
    .map(([key, value]) => `${formatHealth(key)}: ${String(value)}`)
    .join(' · ');
}

function formatNodeList(nodes: EngineeringNode[]): string {
  if (!nodes.length) return 'None detected';
  return nodes
    .slice(0, 4)
    .map((node) => node.label)
    .join(', ');
}

function formatHealth(status: string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString();
}

function shortSha(value: string): string {
  return value && value !== 'unknown' ? value.slice(0, 7) : value;
}

function issueRecordLabel(record: CreatedGitHubIssueRecord): string {
  if (record.issueNumber && record.issueUrl) return `#${record.issueNumber} ${record.issueUrl}`;
  if (record.existingIssueUrl) return `Duplicate ${record.existingIssueUrl}`;
  return formatHealth(record.status);
}

function issueCreationSummary(records: CreatedGitHubIssueRecord[]): string {
  const created = records.filter((record) => record.status === 'created').length;
  const dryRuns = records.filter((record) => record.status === 'dry_run').length;
  const duplicates = records.filter((record) => record.status === 'duplicate_skipped').length;
  const blocked = records.filter((record) => record.status === 'blocked').length;
  const failed = records.filter((record) => record.status === 'failed').length;
  return `GitHub issue creation results: ${created} created, ${dryRuns} dry-run, ${duplicates} duplicate skipped, ${blocked} blocked, ${failed} failed.`;
}

function riskTone(risk: EngineeringImpactRisk): 'neutral' | 'good' | 'warn' {
  if (risk === 'low') return 'good';
  if (risk === 'medium' || risk === 'high') return 'warn';
  return 'neutral';
}

function loadBacklogStatusOverrides(): Record<string, EngineeringBacklogStatus> {
  try {
    const parsed = JSON.parse(localStorage.getItem(engineeringBacklogStatusStorageKey) || '{}') as Record<string, EngineeringBacklogStatus>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function loadIssueDraftStatusOverrides(): Record<string, EngineeringIssueDraftStatus> {
  try {
    const parsed = JSON.parse(localStorage.getItem(engineeringIssueDraftStatusStorageKey) || '{}') as Record<string, EngineeringIssueDraftStatus>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function loadCreatedGitHubIssues(): CreatedGitHubIssueRecord[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(createdGitHubIssuesStorageKey) || '[]') as CreatedGitHubIssueRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
