export type EngineeringNodeType =
  | 'repository'
  | 'folder'
  | 'file'
  | 'route'
  | 'screen'
  | 'component'
  | 'hook'
  | 'service'
  | 'api_endpoint'
  | 'supabase_function'
  | 'migration'
  | 'table'
  | 'rls_policy'
  | 'storage_bucket'
  | 'package_dependency'
  | 'env_variable_name'
  | 'npm_script'
  | 'document';

export type EngineeringEdgeType =
  | 'contains'
  | 'imports'
  | 'uses'
  | 'renders'
  | 'defines'
  | 'creates_table'
  | 'alters_table'
  | 'references_table'
  | 'reads_table'
  | 'writes_table'
  | 'calls_function'
  | 'depends_on'
  | 'has_script'
  | 'declares_env'
  | 'documents';

export type EngineeringNodeStatus = 'indexed' | 'missing' | 'ignored' | 'warning';

export interface EngineeringNode {
  id: string;
  type: EngineeringNodeType;
  label: string;
  repo: string;
  path: string;
  status: EngineeringNodeStatus;
  owner?: string;
  featureArea?: string;
  riskSignals?: string[];
  docStatus?: 'documented' | 'missing' | 'unknown';
  orphanStatus?: 'connected' | 'orphan_candidate' | 'unknown';
  metadata: Record<string, unknown>;
}

export interface EngineeringEdge {
  id: string;
  from: string;
  to: string;
  type: EngineeringEdgeType;
  metadata: Record<string, unknown>;
}

export interface EngineeringRepositorySummary {
  name: string;
  path: string;
  status: EngineeringNodeStatus;
  gitRemote: string;
  branch: string;
  latestCommit: string;
  dirty: boolean;
  packageManager: string;
  projectId?: string;
  projectName?: string;
  projectType?: string;
  repoOwner?: string;
  repoName?: string;
  owningAgent?: string;
  validationCommands?: string[];
  filesIndexed: number;
  functions: number;
  migrations: number;
  tables: number;
  owner?: string;
  healthScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'unknown';
  orphanCandidates?: number;
  missingDocs?: number;
  brokenRelationshipWarnings?: number;
  highRiskNodes?: number;
}

export interface EngineeringGraphSummary {
  repositoriesIndexed: number;
  repositoriesMissing: number;
  filesIndexed: number;
  routes: number;
  components: number;
  supabaseFunctions: number;
  migrations: number;
  tables: number;
  dependencies: number;
  envVariableNames: number;
  docs: number;
}

export interface EngineeringGraph {
  schemaVersion: 1;
  generatedAt: string;
  scanner: {
    name: string;
    version: string;
    mode: 'local read-only';
    storesFileContents: false;
  };
  summary: EngineeringGraphSummary;
  repositories: EngineeringRepositorySummary[];
  nodes: EngineeringNode[];
  edges: EngineeringEdge[];
  warnings: string[];
}

export interface EngineeringScanResult {
  graph: EngineeringGraph;
  loadedAt: string;
  source: 'generated-json' | 'mock-fallback';
}
