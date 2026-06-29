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
  | 'defines'
  | 'creates_table'
  | 'alters_table'
  | 'references_table'
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
  filesIndexed: number;
  functions: number;
  migrations: number;
  tables: number;
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
