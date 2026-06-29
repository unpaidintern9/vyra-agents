import type { EngineeringGraph, EngineeringNode } from './engineeringTypes';

export interface EngineeringSearchResult {
  connectedEdgeCount: number;
  node: EngineeringNode;
}

export function searchEngineeringNodes(graph: EngineeringGraph, query: string, limit = 60): EngineeringSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  const candidates = graph.nodes.map((node) => ({
    connectedEdgeCount: connectedEdgeCount(graph, node.id),
    node,
    haystack: searchableText(node),
  }));

  const results = normalizedQuery
    ? candidates.filter((candidate) => candidate.haystack.includes(normalizedQuery))
    : candidates
        .filter((candidate) => ['table', 'route', 'screen', 'supabase_function', 'migration', 'component'].includes(candidate.node.type))
        .sort((left, right) => right.connectedEdgeCount - left.connectedEdgeCount);

  return results
    .sort((left, right) => right.connectedEdgeCount - left.connectedEdgeCount || left.node.label.localeCompare(right.node.label))
    .slice(0, limit)
    .map(({ connectedEdgeCount, node }) => ({ connectedEdgeCount, node }));
}

export function connectedEdgeCount(graph: EngineeringGraph, nodeId: string): number {
  return graph.edges.filter((edge) => edge.from === nodeId || edge.to === nodeId).length;
}

function searchableText(node: EngineeringNode): string {
  const metadata = Object.values(node.metadata)
    .filter((value) => ['string', 'number', 'boolean'].includes(typeof value))
    .join(' ');
  return [node.label, node.type, node.repo, node.path, node.status, metadata].join(' ').toLowerCase();
}
