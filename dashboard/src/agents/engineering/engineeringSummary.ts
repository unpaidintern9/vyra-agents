import type { EngineeringEdge, EngineeringGraph, EngineeringNodeType } from './engineeringTypes';

export function countNodes(graph: EngineeringGraph, type: EngineeringNodeType): number {
  return graph.nodes.filter((node) => node.type === type && node.status !== 'missing').length;
}

export function missingRepositoryWarnings(graph: EngineeringGraph): string[] {
  return graph.repositories.filter((repo) => repo.status === 'missing').map((repo) => `${repo.name} missing at ${repo.path}`);
}

export function topConnectedNodes(graph: EngineeringGraph, limit = 8) {
  const counts = graph.edges.reduce<Record<string, number>>((accumulator, edge) => {
    accumulator[edge.from] = (accumulator[edge.from] ?? 0) + 1;
    accumulator[edge.to] = (accumulator[edge.to] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .map(([id, count]) => ({
      node: graph.nodes.find((candidate) => candidate.id === id),
      count,
    }))
    .filter((item) => item.node)
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);
}

export function edgeTypes(graph: EngineeringGraph): string[] {
  return uniqueSorted(graph.edges.map((edge) => edge.type));
}

export function nodeTypes(graph: EngineeringGraph): string[] {
  return uniqueSorted(graph.nodes.map((node) => node.type));
}

export function filterEdges(graph: EngineeringGraph, type: string): EngineeringEdge[] {
  return type === 'all' ? graph.edges : graph.edges.filter((edge) => edge.type === type);
}

export function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}
