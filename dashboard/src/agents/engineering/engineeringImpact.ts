import type { EngineeringEdge, EngineeringGraph, EngineeringNode, EngineeringNodeType } from './engineeringTypes';

export type EngineeringImpactRisk = 'low' | 'medium' | 'high' | 'unknown';

export interface EngineeringRelationship {
  edge: EngineeringEdge;
  node: EngineeringNode;
}

export interface EngineeringImpactAnalysis {
  affectedComponents: EngineeringNode[];
  affectedMigrations: EngineeringNode[];
  affectedRepos: string[];
  affectedRoutes: EngineeringNode[];
  affectedSupabaseFunctions: EngineeringNode[];
  affectedTables: EngineeringNode[];
  directDependencies: EngineeringRelationship[];
  directDependents: EngineeringRelationship[];
  riskLevel: EngineeringImpactRisk;
  riskReasons: string[];
  secondOrderDependencies: EngineeringNode[];
  secondOrderDependents: EngineeringNode[];
  selectedNode: EngineeringNode;
}

export interface EngineeringTableImpact {
  files: EngineeringNode[];
  functions: EngineeringNode[];
  migrations: EngineeringNode[];
  policies: EngineeringNode[];
  routes: EngineeringNode[];
  services: EngineeringNode[];
}

export interface EngineeringRouteImpact {
  components: EngineeringNode[];
  functions: EngineeringNode[];
  hooks: EngineeringNode[];
  ownerFiles: EngineeringNode[];
  services: EngineeringNode[];
  tables: EngineeringNode[];
}

export interface EngineeringMigrationHistory {
  alteredTables: EngineeringNode[];
  createdTables: EngineeringNode[];
  migrations: EngineeringNode[];
  policies: EngineeringNode[];
  relatedFiles: EngineeringNode[];
}

export function inboundRelationships(graph: EngineeringGraph, nodeId: string): EngineeringRelationship[] {
  return graph.edges
    .filter((edge) => edge.to === nodeId)
    .map((edge) => ({ edge, node: nodeById(graph, edge.from) }))
    .filter((item): item is EngineeringRelationship => Boolean(item.node));
}

export function outboundRelationships(graph: EngineeringGraph, nodeId: string): EngineeringRelationship[] {
  return graph.edges
    .filter((edge) => edge.from === nodeId)
    .map((edge) => ({ edge, node: nodeById(graph, edge.to) }))
    .filter((item): item is EngineeringRelationship => Boolean(item.node));
}

export function analyzeEngineeringImpact(graph: EngineeringGraph, selectedNode: EngineeringNode): EngineeringImpactAnalysis {
  const directDependents = inboundRelationships(graph, selectedNode.id);
  const directDependencies = outboundRelationships(graph, selectedNode.id);
  const secondOrderDependents = uniqueNodes(
    directDependents.flatMap((relationship) => inboundRelationships(graph, relationship.node.id).map((item) => item.node)),
  );
  const secondOrderDependencies = uniqueNodes(
    directDependencies.flatMap((relationship) => outboundRelationships(graph, relationship.node.id).map((item) => item.node)),
  );
  const affectedNodes = uniqueNodes([
    selectedNode,
    ...directDependents.map((item) => item.node),
    ...directDependencies.map((item) => item.node),
    ...secondOrderDependents,
    ...secondOrderDependencies,
  ]);
  const affectedRepos = Array.from(new Set(affectedNodes.map((node) => node.repo))).sort();
  const riskReasons = riskReasonList(selectedNode, directDependents.length, affectedRepos.length);

  return {
    affectedComponents: nodesOfType(affectedNodes, ['component']),
    affectedMigrations: nodesOfType(affectedNodes, ['migration']),
    affectedRepos,
    affectedRoutes: nodesOfType(affectedNodes, ['route', 'screen']),
    affectedSupabaseFunctions: nodesOfType(affectedNodes, ['supabase_function']),
    affectedTables: nodesOfType(affectedNodes, ['table']),
    directDependencies,
    directDependents,
    riskLevel: riskLevel(selectedNode, directDependents.length, affectedRepos.length),
    riskReasons,
    secondOrderDependencies,
    secondOrderDependents,
    selectedNode,
  };
}

export function tableImpact(graph: EngineeringGraph, tableNode: EngineeringNode): EngineeringTableImpact {
  const inbound = inboundRelationships(graph, tableNode.id);
  const sourceNodes = inbound.map((relationship) => relationship.node);
  const ownerFiles = sourceNodes.filter((node) => node.type === 'file');
  const fileNeighbors = uniqueNodes(ownerFiles.flatMap((file) => [...inboundRelationships(graph, file.id), ...outboundRelationships(graph, file.id)].map((item) => item.node)));

  return {
    files: nodesOfType(sourceNodes, ['file']),
    functions: nodesOfType([...sourceNodes, ...fileNeighbors], ['supabase_function']),
    migrations: nodesOfType(sourceNodes, ['migration']),
    policies: nodesOfType(sourceNodes, ['rls_policy']),
    routes: nodesOfType(fileNeighbors, ['route', 'screen']),
    services: nodesOfType(fileNeighbors, ['service']),
  };
}

export function routeImpact(graph: EngineeringGraph, routeNode: EngineeringNode): EngineeringRouteImpact {
  const ownerFiles = routeNode.type === 'file' ? [routeNode] : inboundRelationships(graph, routeNode.id).map((relationship) => relationship.node);
  const fileRelationships = ownerFiles.flatMap((file) => [...inboundRelationships(graph, file.id), ...outboundRelationships(graph, file.id)]);
  const nodes = uniqueNodes(fileRelationships.map((relationship) => relationship.node));

  return {
    components: nodesOfType(nodes, ['component']),
    functions: nodesOfType(nodes, ['supabase_function']),
    hooks: nodesOfType(nodes, ['hook']),
    ownerFiles: nodesOfType(ownerFiles, ['file']),
    services: nodesOfType(nodes, ['service']),
    tables: nodesOfType(nodes, ['table']),
  };
}

export function migrationHistory(graph: EngineeringGraph, node: EngineeringNode): EngineeringMigrationHistory {
  const migrations =
    node.type === 'migration'
      ? [node]
      : uniqueNodes(
          inboundRelationships(graph, node.id)
            .filter((relationship) => ['creates_table', 'alters_table', 'references_table'].includes(relationship.edge.type))
            .map((relationship) => relationship.node)
            .filter((candidate) => candidate.type === 'migration'),
        );
  const migrationRelationships = migrations.flatMap((migration) => outboundRelationships(graph, migration.id));

  return {
    alteredTables: uniqueNodes(migrationRelationships.filter((item) => item.edge.type === 'alters_table').map((item) => item.node)),
    createdTables: uniqueNodes(migrationRelationships.filter((item) => item.edge.type === 'creates_table').map((item) => item.node)),
    migrations: sortMigrations(migrations),
    policies: uniqueNodes(migrationRelationships.filter((item) => item.node.type === 'rls_policy').map((item) => item.node)),
    relatedFiles: uniqueNodes(migrationRelationships.filter((item) => item.node.type === 'file').map((item) => item.node)),
  };
}

export function nodeById(graph: EngineeringGraph, id: string): EngineeringNode | undefined {
  return graph.nodes.find((node) => node.id === id);
}

export function uniqueNodes(nodes: EngineeringNode[]): EngineeringNode[] {
  return Array.from(new Map(nodes.map((node) => [node.id, node])).values());
}

function nodesOfType(nodes: EngineeringNode[], types: EngineeringNodeType[]): EngineeringNode[] {
  return uniqueNodes(nodes.filter((node) => types.includes(node.type))).sort((left, right) => left.label.localeCompare(right.label));
}

function riskLevel(node: EngineeringNode, dependents: number, repoCount: number): EngineeringImpactRisk {
  const value = `${node.path} ${node.label}`.toLowerCase();
  if (
    ['table', 'migration', 'supabase_function'].includes(node.type) ||
    value.includes('auth') ||
    value.includes('payment') ||
    value.includes('billing') ||
    value.includes('health') ||
    (node.type === 'service' && /(^|\/)(shared|src\/services|lib)\//.test(node.path))
  ) {
    return 'high';
  }
  if (dependents > 10 || repoCount > 1) return 'medium';
  if (dependents === 0 && repoCount <= 1) return 'low';
  return 'unknown';
}

function riskReasonList(node: EngineeringNode, dependents: number, repoCount: number): string[] {
  const reasons: string[] = [];
  const value = `${node.path} ${node.label}`.toLowerCase();
  if (['table', 'migration', 'supabase_function'].includes(node.type)) reasons.push(`${node.type} changes can affect runtime data paths.`);
  if (value.includes('auth')) reasons.push('Auth-related path or label.');
  if (value.includes('payment') || value.includes('billing')) reasons.push('Payment or billing-related path or label.');
  if (value.includes('health')) reasons.push('Health-data-related path or label.');
  if (node.type === 'service' && /(^|\/)(shared|src\/services|lib)\//.test(node.path)) reasons.push('Shared service path.');
  if (dependents > 10) reasons.push(`${dependents} direct dependents.`);
  if (repoCount > 1) reasons.push(`Touches ${repoCount} repositories.`);
  return reasons.length ? reasons : ['Low local graph connectivity detected.'];
}

function sortMigrations(nodes: EngineeringNode[]): EngineeringNode[] {
  return [...nodes].sort((left, right) => left.path.localeCompare(right.path));
}
