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
  downloadFullImpactSummary,
  downloadMigrationHistoryReport,
  downloadNodeDetailReport,
  downloadNodeImpactReport,
  downloadRouteImpactReport,
  downloadTableImpactReport,
  type EngineeringReportFormat,
} from './engineeringReports';
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
            </div>
          </div>
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
