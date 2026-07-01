import type { EngineeringGraph } from '../agents/engineering/engineeringTypes';

export interface RepositoryIntelligenceDashboardSummary {
  applications: number;
  circularDependencies: number;
  commands: string[];
  configuration: number;
  dependencyEdges: number;
  dependencyHealth: string;
  documentation: number;
  documentationCompleteness: number;
  engineeringHealthScore: number;
  engineeringWarnings: number;
  libraries: number;
  migrations: number;
  modules: number;
  orphanedModules: number;
  packages: number;
  blockedProjects: number;
  indexedProjects: number;
  registeredProjects: number;
  releaseReadinessStatus: string;
  repositories: number;
  repositoryRisk: string;
  scripts: number;
  services: number;
  technicalDebtMarkers: number;
  validationTrend: string;
}

export function summarizeRepositoryIntelligence(graph?: EngineeringGraph): RepositoryIntelligenceDashboardSummary {
  if (!graph) return defaultRepositoryIntelligenceSummary();
  const repositories = graph.repositories.length;
  const moduleNodes = graph.nodes.filter((node) => ['file', 'folder', 'component', 'hook', 'route', 'screen'].includes(node.type));
  const docNodes = graph.nodes.filter((node) => node.type === 'document');
  const dependencyEdges = graph.edges.filter((edge) => ['imports', 'uses', 'renders', 'depends_on', 'calls_function', 'references_table', 'reads_table', 'writes_table'].includes(edge.type));
  const totalHealth = graph.repositories.reduce((sum, repo) => sum + (repo.healthScore ?? 0), 0);
  const engineeringHealthScore = Math.round(totalHealth / Math.max(1, graph.repositories.length));
  const documentationCompleteness = Math.round((docNodes.length / Math.max(1, moduleNodes.length)) * 100);
  const orphanedModules = graph.nodes.filter((node) => node.orphanStatus === 'orphan_candidate').length;
  const circularDependencies = 0;
  const technicalDebtMarkers =
    graph.repositories.reduce((sum, repo) => sum + (repo.highRiskNodes ?? 0) + (repo.orphanCandidates ?? 0) + (repo.brokenRelationshipWarnings ?? 0), 0);

  return {
    applications: graph.nodes.filter((node) => ['route', 'screen'].includes(node.type)).length,
    circularDependencies,
    commands: repoCommands,
    configuration: graph.nodes.filter((node) => node.type === 'env_variable_name' || /\.(json|toml|ya?ml)$/i.test(node.path)).length,
    dependencyEdges: dependencyEdges.length,
    dependencyHealth: orphanedModules > 25 ? 'Watch' : 'Ready',
    documentation: docNodes.length,
    documentationCompleteness,
    engineeringHealthScore,
    engineeringWarnings: graph.warnings.length,
    libraries: graph.nodes.filter((node) => ['component', 'hook'].includes(node.type)).length,
    migrations: graph.nodes.filter((node) => node.type === 'migration').length,
    modules: moduleNodes.length,
    orphanedModules,
    packages: graph.nodes.filter((node) => node.type === 'package_dependency').length,
    blockedProjects: graph.repositories.filter((repo) => repo.dirty || repo.riskLevel === 'high').length,
    indexedProjects: graph.repositories.filter((repo) => repo.status === 'indexed').length,
    registeredProjects: Math.max(6, graph.repositories.length),
    releaseReadinessStatus: graph.repositories.some((repo) => repo.dirty || repo.riskLevel === 'high') ? 'Blocked' : 'Ready',
    repositories,
    repositoryRisk: graph.repositories.some((repo) => repo.riskLevel === 'high') ? 'High' : graph.repositories.some((repo) => repo.riskLevel === 'medium') ? 'Medium' : 'Low',
    scripts: graph.nodes.filter((node) => node.type === 'npm_script').length,
    services: graph.nodes.filter((node) => ['service', 'api_endpoint', 'supabase_function'].includes(node.type)).length,
    technicalDebtMarkers,
    validationTrend: graph.generatedAt ? 'Latest local scan available' : 'Scan unavailable',
  };
}

export function defaultRepositoryIntelligenceSummary(): RepositoryIntelligenceDashboardSummary {
  return {
    applications: 0,
    circularDependencies: 0,
    commands: repoCommands,
    configuration: 0,
    dependencyEdges: 0,
    dependencyHealth: 'Run repo:scan',
    documentation: 0,
    documentationCompleteness: 0,
    engineeringHealthScore: 0,
    engineeringWarnings: 0,
    libraries: 0,
    migrations: 0,
    modules: 0,
    orphanedModules: 0,
    packages: 0,
    blockedProjects: 0,
    indexedProjects: 0,
    registeredProjects: 6,
    releaseReadinessStatus: 'Needs scan',
    repositories: 0,
    repositoryRisk: 'Unknown',
    scripts: 0,
    services: 0,
    technicalDebtMarkers: 0,
    validationTrend: 'Run npm run repo:validate',
  };
}

export const repoCommands = [
  'npm run repo:scan',
  'npm run repo:status',
  'npm run repo:graph',
  'npm run repo:health',
  'npm run repo:owners',
  'npm run repo:validate',
];
