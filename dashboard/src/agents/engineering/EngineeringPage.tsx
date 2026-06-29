import { CheckCircle2, Copy, Database, Download, GitBranch, ListChecks, Network, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import { loadEngineeringGraph } from './engineeringGraph';
import { engineeringMockGraph } from './engineeringMockData';
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
  downloadFunctionTableMap,
  downloadFullImpactSummary,
  downloadMigrationHistoryReport,
  downloadNodeDetailReport,
  downloadNodeImpactReport,
  downloadMissingDocsReport,
  downloadOrphanCandidatesReport,
  downloadOwnershipMap,
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
import { searchEngineeringNodes } from './engineeringSearch';
import { edgeTypes, missingRepositoryWarnings, nodeTypes, topConnectedNodes, uniqueSorted } from './engineeringSummary';
import type { EngineeringGraph, EngineeringNode, EngineeringScanResult } from './engineeringTypes';
import { runEngineeringScanFromDashboard } from './engineeringScanner';

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

  const graph = scan.graph;
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
          <div className="split-panel">
            <div className="fact-list compact-facts">
              <Fact label="Graph Source" value={scan.source === 'generated-json' ? 'Generated JSON' : 'Fallback'} />
              <Fact label="Loaded At" value={scan.loadedAt === 'Loading' ? scan.loadedAt : formatDate(scan.loadedAt)} />
              <Fact label="Generated At" value={graph.generatedAt === 'Not generated yet' ? graph.generatedAt : formatDate(graph.generatedAt)} />
              <Fact label="Mode" value={graph.scanner.mode} />
              <Fact label="Stores Contents" value={graph.scanner.storesFileContents ? 'Yes' : 'No'} />
            </div>
            <div className="button-row end-row">
              <button className="approval-button compact-button" onClick={runScan} type="button">
                Run Engineering Scan
              </button>
              <button className="report-button" disabled={!graph.nodes.length} onClick={() => downloadEngineeringGraph(graph)} type="button">
                <Download size={15} />
                <span>Export Engineering Graph JSON</span>
              </button>
              <button className="report-button" disabled={!graph.nodes.length} onClick={() => downloadEngineeringReport(graph)} type="button">
                <Download size={15} />
                <span>Export Engineering Report Markdown</span>
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
          <div className="button-row end-row">
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
          <div className="button-row end-row">
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
          <div className="toolbar-row">
            <div className="filter-row">
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
          <div className="button-row end-row">
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
            <label>
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
              <div className="toolbar-row">
                <div className="filter-row">
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

function riskTone(risk: EngineeringImpactRisk): 'neutral' | 'good' | 'warn' {
  if (risk === 'low') return 'good';
  if (risk === 'medium' || risk === 'high') return 'warn';
  return 'neutral';
}
