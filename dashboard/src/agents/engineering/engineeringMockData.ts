import type { EngineeringGraph } from './engineeringTypes';

export const engineeringMockGraph: EngineeringGraph = {
  schemaVersion: 1,
  generatedAt: 'Not generated yet',
  scanner: {
    name: 'engineering-knowledge-graph-scanner',
    version: '0.1.0',
    mode: 'local read-only',
    storesFileContents: false,
  },
  summary: {
    repositoriesIndexed: 0,
    repositoriesMissing: 0,
    filesIndexed: 0,
    routes: 0,
    components: 0,
    supabaseFunctions: 0,
    migrations: 0,
    tables: 0,
    dependencies: 0,
    envVariableNames: 0,
    docs: 0,
  },
  repositories: [],
  nodes: [],
  edges: [],
  warnings: ['Run `node scripts/engineering-scan.mjs` to generate dashboard/public/engineering-graph.json.'],
};
