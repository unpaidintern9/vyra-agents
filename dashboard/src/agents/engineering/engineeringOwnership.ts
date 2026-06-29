import type { EngineeringEdge, EngineeringGraph, EngineeringNode } from './engineeringTypes';

export interface OwnershipSummary {
  healthScore: number;
  highRiskNodes: number;
  missingDocs: number;
  nodeCount: number;
  orphanCandidates: number;
  owner: string;
}

export interface FeatureAreaSummary {
  docs: number;
  featureArea: string;
  functions: number;
  risks: number;
  routes: number;
  tables: number;
}

export interface TableScreenMapRow {
  files: EngineeringNode[];
  functions: EngineeringNode[];
  migrations: EngineeringNode[];
  routes: EngineeringNode[];
  services: EngineeringNode[];
  table: EngineeringNode;
}

export interface FunctionTableMapRow {
  docsStatus: EngineeringNode['docStatus'];
  functionNode: EngineeringNode;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  tablesRead: EngineeringNode[];
  tablesReferenced: EngineeringNode[];
  tablesWritten: EngineeringNode[];
}

export interface RiskWarningQueue {
  brokenRelationships: string[];
  highRiskNodes: EngineeringNode[];
  missingDocs: EngineeringNode[];
  orphanCandidates: EngineeringNode[];
}

export function ownershipOverview(graph: EngineeringGraph): OwnershipSummary[] {
  const groups = new Map<string, EngineeringNode[]>();
  for (const node of graph.nodes) {
    const owner = node.owner || 'Unknown';
    groups.set(owner, [...(groups.get(owner) || []), node]);
  }
  return [...groups.entries()]
    .map(([owner, nodes]) => {
      const highRiskNodes = nodes.filter(isHighRisk).length;
      const missingDocs = nodes.filter((node) => node.docStatus === 'missing').length;
      const orphanCandidates = nodes.filter((node) => node.orphanStatus === 'orphan_candidate').length;
      return {
        healthScore: Math.round(
          Math.max(
            0,
            Math.min(
              100,
              100 -
                Math.min(45, (highRiskNodes / Math.max(1, nodes.length)) * 100) -
                Math.min(25, (missingDocs / Math.max(1, nodes.length)) * 100) -
                Math.min(20, (orphanCandidates / Math.max(1, nodes.length)) * 100),
            ),
          ),
        ),
        highRiskNodes,
        missingDocs,
        nodeCount: nodes.length,
        orphanCandidates,
        owner,
      };
    })
    .sort((left, right) => right.nodeCount - left.nodeCount);
}

export function featureAreaMap(graph: EngineeringGraph): FeatureAreaSummary[] {
  const groups = new Map<string, EngineeringNode[]>();
  for (const node of graph.nodes) {
    const featureArea = node.featureArea || 'core-platform';
    groups.set(featureArea, [...(groups.get(featureArea) || []), node]);
  }
  return [...groups.entries()]
    .map(([featureArea, nodes]) => ({
      docs: countType(nodes, 'document'),
      featureArea,
      functions: countType(nodes, 'supabase_function'),
      risks: nodes.filter(isHighRisk).length,
      routes: nodes.filter((node) => node.type === 'route' || node.type === 'screen').length,
      tables: countType(nodes, 'table'),
    }))
    .sort((left, right) => right.risks - left.risks || right.tables - left.tables);
}

export function tableScreenMap(graph: EngineeringGraph): TableScreenMapRow[] {
  return graph.nodes
    .filter((node) => node.type === 'table')
    .map((table) => {
      const inbound = inboundRelationships(graph, table.id);
      return {
        files: nodesOfType(inbound, ['file']),
        functions: nodesOfType(inbound, ['supabase_function']),
        migrations: nodesOfType(inbound, ['migration']),
        routes: nodesOfType(inbound, ['route', 'screen']),
        services: nodesOfType(inbound, ['service']),
        table,
      };
    })
    .sort((left, right) => relationshipWeight(right) - relationshipWeight(left));
}

export function functionTableMap(graph: EngineeringGraph): FunctionTableMapRow[] {
  return graph.nodes
    .filter((node) => node.type === 'supabase_function')
    .map((functionNode) => {
      const outbound = outboundEdges(graph, functionNode.id);
      return {
        docsStatus: functionNode.docStatus,
        functionNode,
        riskLevel: riskLevelForNode(functionNode),
        tablesRead: edgeTargets(graph, outbound.filter((edge) => edge.type === 'reads_table')),
        tablesReferenced: edgeTargets(graph, outbound.filter((edge) => edge.type === 'references_table')),
        tablesWritten: edgeTargets(graph, outbound.filter((edge) => edge.type === 'writes_table')),
      };
    })
    .sort((left, right) => riskWeight(right.riskLevel) - riskWeight(left.riskLevel));
}

export function riskWarningQueue(graph: EngineeringGraph): RiskWarningQueue {
  return {
    brokenRelationships: graph.warnings.filter((warning) => warning.startsWith('Relationship warning:')),
    highRiskNodes: graph.nodes.filter(isHighRisk),
    missingDocs: graph.nodes.filter((node) => node.docStatus === 'missing'),
    orphanCandidates: graph.nodes.filter((node) => node.orphanStatus === 'orphan_candidate'),
  };
}

export function filteredRiskNodes(
  graph: EngineeringGraph,
  filters: { owner: string; repo: string; risk: string; type: string; warningType: string },
): EngineeringNode[] {
  const queue = riskWarningQueue(graph);
  const source =
    filters.warningType === 'orphan'
      ? queue.orphanCandidates
      : filters.warningType === 'missing_docs'
        ? queue.missingDocs
        : queue.highRiskNodes;
  return source.filter(
    (node) =>
      (filters.owner === 'all' || node.owner === filters.owner) &&
      (filters.repo === 'all' || node.repo === filters.repo) &&
      (filters.type === 'all' || node.type === filters.type) &&
      (filters.risk === 'all' || riskLevelForNode(node) === filters.risk),
  );
}

export function riskLevelForNode(node: EngineeringNode): 'low' | 'medium' | 'high' | 'unknown' {
  if (node.riskSignals?.some((signal) => signal.startsWith('high:'))) return 'high';
  if (node.riskSignals?.some((signal) => signal.startsWith('medium:'))) return 'medium';
  if (node.orphanStatus === 'connected' && node.docStatus !== 'missing') return 'low';
  return 'unknown';
}

export function ownerGroups(graph: EngineeringGraph): string[] {
  return uniqueSorted(graph.nodes.map((node) => node.owner || 'Unknown'));
}

function inboundRelationships(graph: EngineeringGraph, nodeId: string): EngineeringNode[] {
  return graph.edges
    .filter((edge) => edge.to === nodeId)
    .map((edge) => graph.nodes.find((node) => node.id === edge.from))
    .filter((node): node is EngineeringNode => Boolean(node));
}

function outboundEdges(graph: EngineeringGraph, nodeId: string): EngineeringEdge[] {
  return graph.edges.filter((edge) => edge.from === nodeId);
}

function edgeTargets(graph: EngineeringGraph, edges: EngineeringEdge[]): EngineeringNode[] {
  return uniqueNodes(
    edges
      .map((edge) => graph.nodes.find((node) => node.id === edge.to))
      .filter((node): node is EngineeringNode => node !== undefined && node.type === 'table'),
  );
}

function nodesOfType(nodes: EngineeringNode[], types: EngineeringNode['type'][]): EngineeringNode[] {
  return uniqueNodes(nodes.filter((node) => types.includes(node.type)));
}

function relationshipWeight(row: TableScreenMapRow): number {
  return row.routes.length * 3 + row.functions.length * 3 + row.services.length * 2 + row.files.length + row.migrations.length;
}

function isHighRisk(node: EngineeringNode): boolean {
  return Boolean(node.riskSignals?.some((signal) => signal.startsWith('high:')));
}

function riskWeight(risk: string): number {
  if (risk === 'high') return 3;
  if (risk === 'medium') return 2;
  if (risk === 'low') return 1;
  return 0;
}

function countType(nodes: EngineeringNode[], type: EngineeringNode['type']): number {
  return nodes.filter((node) => node.type === type).length;
}

function uniqueNodes(nodes: EngineeringNode[]): EngineeringNode[] {
  return [...new Map(nodes.map((node) => [node.id, node])).values()];
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
