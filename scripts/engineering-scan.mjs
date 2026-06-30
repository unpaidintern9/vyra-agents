import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDir, '..');
const outputPath = join(workspaceRoot, 'dashboard/public/engineering-graph.json');
const home = process.env.HOME || '/Users/vyra';

const repoTargets = [
  { name: 'Vyra-Part-1', path: join(home, 'Documents/Vyra-Part-1') },
  { name: 'vyra-agents', path: workspaceRoot },
  { name: 'Vyra-Software', path: join(home, 'Documents/Vyra-Software') },
  { name: 'vyra-website', path: join(home, 'Documents/vyra-website') },
];

const ignoredDirectories = new Set([
  '.git',
  '.expo',
  '.next',
  '.tools',
  '.vite',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'reports',
]);
const ignoredExactFiles = new Set(['.env', '.env.local', '.env.production', '.env.development']);
const safeEnvFiles = new Set(['.env.example', '.env.vyra-part-1.example']);
const textExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.sql',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);
const largeMediaExtensions = new Set([
  '.avif',
  '.bin',
  '.dmg',
  '.gif',
  '.heic',
  '.ico',
  '.jpeg',
  '.jpg',
  '.mov',
  '.mp3',
  '.mp4',
  '.pdf',
  '.png',
  '.sqlite',
  '.webp',
  '.zip',
]);

const graph = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
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
  warnings: [],
};

const nodeIds = new Set();
const edgeIds = new Set();
const repoByName = new Map();

for (const target of repoTargets) {
  scanRepository(target);
}

pruneLowSignalGraph();
enrichOwnershipAndHealth();

graph.summary.repositoriesIndexed = graph.repositories.filter((repo) => repo.status === 'indexed').length;
graph.summary.repositoriesMissing = graph.repositories.filter((repo) => repo.status === 'missing').length;
graph.summary.filesIndexed = countNodes('file');
graph.summary.routes = countNodes('route');
graph.summary.components = countNodes('component');
graph.summary.supabaseFunctions = countNodes('supabase_function');
graph.summary.migrations = countNodes('migration');
graph.summary.tables = countNodes('table');
graph.summary.dependencies = countNodes('package_dependency');
graph.summary.envVariableNames = countNodes('env_variable_name');
graph.summary.docs = countNodes('document');

writeFileSync(outputPath, `${JSON.stringify(graph)}\n`);
console.log(
  JSON.stringify(
    {
      outputPath,
      repositoriesIndexed: graph.summary.repositoriesIndexed,
      repositoriesMissing: graph.summary.repositoriesMissing,
      filesIndexed: graph.summary.filesIndexed,
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      warnings: graph.warnings.length,
    },
    null,
    2,
  ),
);

function scanRepository(target) {
  const repoPath = target.path;
  const repoId = nodeId(target.name, 'repository', '');
  const exists = existsSync(repoPath);
  const metadata = exists
    ? {
        gitRemote: git(repoPath, ['config', '--get', 'remote.origin.url']),
        branch: git(repoPath, ['branch', '--show-current']),
        latestCommit: git(repoPath, ['rev-parse', '--short', 'HEAD']),
        dirty: git(repoPath, ['status', '--short']) !== '',
        packageManager: detectPackageManager(repoPath),
      }
    : {
        gitRemote: 'missing',
        branch: 'missing',
        latestCommit: 'missing',
        dirty: false,
        packageManager: 'unknown',
      };

  addNode({
    id: repoId,
    type: 'repository',
    label: target.name,
    repo: target.name,
    path: repoPath,
    status: exists ? 'indexed' : 'missing',
    metadata,
  });

  const repoSummary = {
    name: target.name,
    path: repoPath,
    status: exists ? 'indexed' : 'missing',
    gitRemote: String(metadata.gitRemote || 'unknown'),
    branch: String(metadata.branch || 'unknown'),
    latestCommit: String(metadata.latestCommit || 'unknown'),
    dirty: Boolean(metadata.dirty),
    packageManager: String(metadata.packageManager || 'unknown'),
    filesIndexed: 0,
    functions: 0,
    migrations: 0,
    tables: 0,
    owner: 'Unknown',
    healthScore: exists ? 100 : 0,
    riskLevel: exists ? 'unknown' : 'high',
    orphanCandidates: 0,
    missingDocs: 0,
    brokenRelationshipWarnings: 0,
    highRiskNodes: 0,
  };
  graph.repositories.push(repoSummary);
  repoByName.set(target.name, repoSummary);

  if (!exists) {
    graph.warnings.push(`${target.name} missing at ${repoPath}`);
    return;
  }

  const files = [];
  walk(repoPath, repoPath, target.name, repoId, files);
  repoSummary.filesIndexed = files.length;

  scanPackageJson(repoPath, target.name, repoId);
  scanSupabase(repoPath, target.name, repoId);

  for (const filePath of files) {
    scanFile(filePath, repoPath, target.name);
  }

  repoSummary.functions = graph.nodes.filter((node) => node.repo === target.name && node.type === 'supabase_function').length;
  repoSummary.migrations = graph.nodes.filter((node) => node.repo === target.name && node.type === 'migration').length;
  repoSummary.tables = graph.nodes.filter((node) => node.repo === target.name && node.type === 'table').length;
}

function walk(currentPath, repoPath, repoName, parentNodeId, files) {
  let entries = [];
  try {
    entries = readdirSync(currentPath, { withFileTypes: true });
  } catch (error) {
    graph.warnings.push(`Unable to read ${currentPath}: ${error.message}`);
    return;
  }

  for (const entry of entries) {
    if (shouldIgnoreEntry(entry.name, entry.isDirectory())) continue;
    const absolutePath = join(currentPath, entry.name);
    const relativePath = relative(repoPath, absolutePath);
    if (entry.isDirectory()) {
      const shouldIndexFolder = relativePath.split('/').length <= 2;
      const folderId = shouldIndexFolder ? nodeId(repoName, 'folder', relativePath) : parentNodeId;
      if (shouldIndexFolder) {
        addNode({
          id: folderId,
          type: 'folder',
          label: entry.name,
          repo: repoName,
          path: relativePath,
          status: 'indexed',
          metadata: {},
        });
        addEdge(parentNodeId, folderId, 'contains', {});
      }
      walk(absolutePath, repoPath, repoName, folderId, files);
      continue;
    }

    if (!entry.isFile() || shouldIgnoreFile(entry.name, absolutePath)) continue;
    const stat = lstatSync(absolutePath);
    if (stat.size > 500_000) continue;

    const fileId = nodeId(repoName, 'file', relativePath);
    addNode({
      id: fileId,
      type: 'file',
      label: entry.name,
      repo: repoName,
      path: relativePath,
      status: 'indexed',
      metadata: {
        extension: extname(entry.name),
        bytes: stat.size,
      },
    });
    addEdge(parentNodeId, fileId, 'contains', {});
    files.push(absolutePath);
  }
}

function scanPackageJson(repoPath, repoName, repoId) {
  const packagePath = join(repoPath, 'package.json');
  if (!existsSync(packagePath)) return;

  const packageFileId = nodeId(repoName, 'file', 'package.json');
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(packagePath, 'utf8'));
  } catch (error) {
    graph.warnings.push(`Unable to parse ${repoName}/package.json: ${error.message}`);
    return;
  }

  for (const [scope, dependencies] of [
    ['dependencies', parsed.dependencies],
    ['devDependencies', parsed.devDependencies],
  ]) {
    for (const [name, version] of Object.entries(dependencies ?? {})) {
      const dependencyId = nodeId(repoName, 'package_dependency', `${scope}:${name}`);
      addNode({
        id: dependencyId,
        type: 'package_dependency',
        label: name,
        repo: repoName,
        path: 'package.json',
        status: 'indexed',
        metadata: { scope, version },
      });
      addEdge(repoId, dependencyId, 'depends_on', { scope });
      addEdge(packageFileId, dependencyId, 'defines', { scope });
    }
  }

  for (const [name, command] of Object.entries(parsed.scripts ?? {})) {
    const scriptId = nodeId(repoName, 'npm_script', name);
    addNode({
      id: scriptId,
      type: 'npm_script',
      label: name,
      repo: repoName,
      path: 'package.json',
      status: 'indexed',
      metadata: { command: sanitizeCommand(String(command)) },
    });
    addEdge(repoId, scriptId, 'has_script', {});
    addEdge(packageFileId, scriptId, 'defines', {});
  }
}

function scanSupabase(repoPath, repoName, repoId) {
  const functionsPath = join(repoPath, 'supabase/functions');
  if (existsSync(functionsPath)) {
    for (const entry of readdirSync(functionsPath, { withFileTypes: true })) {
      if (!entry.isDirectory() || shouldIgnoreEntry(entry.name, true)) continue;
      const relativePath = `supabase/functions/${entry.name}`;
      const functionId = nodeId(repoName, 'supabase_function', entry.name);
      addNode({
        id: functionId,
        type: 'supabase_function',
        label: entry.name,
        repo: repoName,
        path: relativePath,
        status: 'indexed',
        metadata: {
          hasReadme: existsSync(join(functionsPath, entry.name, 'README.md')),
          hasIndex: existsSync(join(functionsPath, entry.name, 'index.ts')),
        },
      });
      addEdge(repoId, functionId, 'contains', {});
    }
  }

  const migrationsPath = join(repoPath, 'supabase/migrations');
  if (!existsSync(migrationsPath)) return;

  for (const entry of readdirSync(migrationsPath, { withFileTypes: true })) {
    if (!entry.isFile() || extname(entry.name) !== '.sql') continue;
    const relativePath = `supabase/migrations/${entry.name}`;
    const migrationId = nodeId(repoName, 'migration', relativePath);
    addNode({
      id: migrationId,
      type: 'migration',
      label: entry.name,
      repo: repoName,
      path: relativePath,
      status: 'indexed',
      metadata: {},
    });
    addEdge(repoId, migrationId, 'contains', {});

    const sql = readSafe(join(migrationsPath, entry.name));
    for (const table of matchAll(sql, /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?["`]?([a-zA-Z0-9_]+)["`]?/gi)) {
      const tableId = addTable(repoName, table);
      addEdge(migrationId, tableId, 'creates_table', {});
    }
    for (const table of matchAll(sql, /alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?["`]?([a-zA-Z0-9_]+)["`]?/gi)) {
      const tableId = addTable(repoName, table);
      addEdge(migrationId, tableId, 'alters_table', {});
    }
    for (const policy of matchPolicies(sql)) {
      const policyId = nodeId(repoName, 'rls_policy', `${policy.table}:${policy.name}`);
      addNode({
        id: policyId,
        type: 'rls_policy',
        label: policy.name,
        repo: repoName,
        path: relativePath,
        status: 'indexed',
        metadata: { table: policy.table },
      });
      addEdge(migrationId, policyId, 'defines', {});
      addEdge(policyId, addTable(repoName, policy.table), 'references_table', {});
    }
    for (const bucket of matchAll(sql, /storage\.buckets[^;]*['"]([a-zA-Z0-9_-]+)['"]/gi)) {
      const bucketId = nodeId(repoName, 'storage_bucket', bucket);
      addNode({
        id: bucketId,
        type: 'storage_bucket',
        label: bucket,
        repo: repoName,
        path: relativePath,
        status: 'indexed',
        metadata: {},
      });
      addEdge(migrationId, bucketId, 'defines', {});
    }
  }
}

function scanFile(filePath, repoPath, repoName) {
  const relativePath = relative(repoPath, filePath);
  const extension = extname(filePath).toLowerCase();
  const fileId = nodeId(repoName, 'file', relativePath);
  const content = readSafe(filePath);
  if (!content) return;

  if (extension === '.md') {
    const documentId = nodeId(repoName, 'document', relativePath);
    addNode({
      id: documentId,
      type: 'document',
      label: basename(filePath),
      repo: repoName,
      path: relativePath,
      status: 'indexed',
      metadata: { title: firstMarkdownTitle(content) },
    });
    addEdge(fileId, documentId, 'documents', {});
  }

  if (safeEnvFiles.has(basename(filePath))) {
    for (const envName of matchAll(content, /^([A-Z][A-Z0-9_]+)=/gm)) {
      addEnv(repoName, fileId, envName, relativePath, 'example');
    }
  }

  for (const envName of [
    ...matchAll(content, /import\.meta\.env\.([A-Z][A-Z0-9_]+)/g),
    ...matchAll(content, /process\.env\.([A-Z][A-Z0-9_]+)/g),
    ...matchAll(content, /Deno\.env\.get\(['"`]([A-Z][A-Z0-9_]+)['"`]\)/g),
  ]) {
    addEnv(repoName, fileId, envName, relativePath, 'source_reference');
  }

  if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(extension)) {
    scanSourceFile(content, repoName, relativePath, fileId);
  }

  if (extension === '.sql') {
    for (const table of matchAll(content, /(?:from|join|references)\s+(?:public\.)?["`]?([a-zA-Z0-9_]+)["`]?/gi)) {
      addEdge(fileId, addTable(repoName, table), 'references_table', {});
    }
  }
}

function scanSourceFile(content, repoName, relativePath, fileId) {
  const componentIds = [];
  const screenIds = [];
  for (const importTarget of matchAll(content, /import(?:\s+type)?(?:[\s\S]*?)from\s+['"]([^'"]+)['"]/g)) {
    if (importTarget.startsWith('.')) {
      addEdge(fileId, resolveImportNodeId(repoName, relativePath, importTarget), 'imports', { target: importTarget });
    }
  }

  for (const name of [
    ...matchAll(content, /(?:export\s+)?function\s+([A-Z][A-Za-z0-9_]*)\s*\(/g),
    ...matchAll(content, /(?:export\s+)?const\s+([A-Z][A-Za-z0-9_]*)\s*=/g),
  ]) {
    const type = /(?:Page|Screen)$/.test(name) ? 'screen' : 'component';
    const node = nodeId(repoName, type, `${relativePath}:${name}`);
    addNode({
      id: node,
      type,
      label: name,
      repo: repoName,
      path: relativePath,
      status: 'indexed',
      metadata: {},
    });
    addEdge(fileId, node, 'defines', {});
    if (type === 'screen') screenIds.push(node);
    if (type === 'component') componentIds.push(node);
  }

  for (const name of [
    ...matchAll(content, /(?:export\s+)?function\s+(use[A-Z][A-Za-z0-9_]*)\s*\(/g),
    ...matchAll(content, /(?:export\s+)?const\s+(use[A-Z][A-Za-z0-9_]*)\s*=/g),
  ]) {
    const node = nodeId(repoName, 'hook', `${relativePath}:${name}`);
    addNode({
      id: node,
      type: 'hook',
      label: name,
      repo: repoName,
      path: relativePath,
      status: 'indexed',
      metadata: {},
    });
    addEdge(fileId, node, 'defines', {});
    screenIds.push(node);
  }

  if (isServicePath(relativePath)) {
    for (const name of matchAll(content, /export\s+async\s+function\s+([a-z][A-Za-z0-9_]*)\s*\(/g)) {
      const node = nodeId(repoName, 'service', `${relativePath}:${name}`);
      addNode({
        id: node,
        type: 'service',
        label: name,
        repo: repoName,
        path: relativePath,
        status: 'indexed',
        metadata: {},
      });
      addEdge(fileId, node, 'defines', {});
    }
  }

  for (const routePath of [
    ...matchAll(content, /path\s*[:=]\s*['"`]([^'"`]+)['"`]/g),
    ...matchAll(content, /<Route[^>]+path=['"]([^'"]+)['"]/g),
  ]) {
    const node = nodeId(repoName, 'route', routePath);
    addNode({
      id: node,
      type: 'route',
      label: routePath,
      repo: repoName,
      path: relativePath,
      status: 'indexed',
      metadata: {},
    });
    addEdge(fileId, node, 'defines', {});
  }

  for (const endpoint of matchAll(content, /['"`](\/api\/[A-Za-z0-9_./:-]+)['"`]/g)) {
    const node = nodeId(repoName, 'api_endpoint', endpoint);
    addNode({
      id: node,
      type: 'api_endpoint',
      label: endpoint,
      repo: repoName,
      path: relativePath,
      status: 'indexed',
      metadata: {},
    });
    addEdge(fileId, node, 'defines', {});
  }

  for (const table of matchAll(content, /\.from\(['"`]([a-zA-Z0-9_]+)['"`]\)/g)) {
    addEdge(fileId, addTable(repoName, table), 'references_table', {});
    const tableId = addTable(repoName, table);
    const action = tableActionForContent(content, table);
    if (action === 'read') addEdge(fileId, tableId, 'reads_table', {});
    if (action === 'write') addEdge(fileId, tableId, 'writes_table', {});
    for (const screenId of screenIds) addEdge(screenId, tableId, 'references_table', { sourceFile: relativePath });
    const functionName = supabaseFunctionNameForPath(relativePath);
    if (functionName) {
      const functionId = nodeId(repoName, 'supabase_function', functionName);
      addEdge(functionId, tableId, 'references_table', { sourceFile: relativePath });
      if (action === 'read') addEdge(functionId, tableId, 'reads_table', { sourceFile: relativePath });
      if (action === 'write') addEdge(functionId, tableId, 'writes_table', { sourceFile: relativePath });
    }
  }

  for (const componentId of componentIds) {
    for (const screenId of screenIds) addEdge(screenId, componentId, 'renders', { sourceFile: relativePath });
  }

  for (const functionName of [
    ...matchAll(content, /\.functions\.invoke\(['"`]([a-zA-Z0-9_-]+)['"`]/g),
    ...matchAll(content, /\/functions\/v1\/([a-zA-Z0-9_-]+)/g),
  ]) {
    const functionId = nodeId(repoName, 'supabase_function', functionName);
    addNode({
      id: functionId,
      type: 'supabase_function',
      label: functionName,
      repo: repoName,
      path: relativePath,
      status: 'indexed',
      metadata: { detectedFromCall: true },
    });
    addEdge(fileId, functionId, 'calls_function', {});
  }
}

function addTable(repoName, table) {
  const tableId = nodeId(repoName, 'table', table);
  addNode({
    id: tableId,
    type: 'table',
    label: table,
    repo: repoName,
    path: 'supabase',
    status: 'indexed',
    metadata: {},
  });
  return tableId;
}

function addEnv(repoName, fileId, envName, path, source) {
  const envId = nodeId(repoName, 'env_variable_name', envName);
  addNode({
    id: envId,
    type: 'env_variable_name',
    label: envName,
    repo: repoName,
    path,
    status: 'indexed',
    metadata: { source },
  });
  addEdge(fileId, envId, 'declares_env', { source });
}

function addNode(node) {
  if (nodeIds.has(node.id)) return;
  nodeIds.add(node.id);
  graph.nodes.push(node);
}

function addEdge(from, to, type, metadata) {
  const id = edgeId(from, to, type);
  if (edgeIds.has(id)) return;
  edgeIds.add(id);
  graph.edges.push({ id, from, to, type, metadata });
}

function nodeId(repo, type, value) {
  return `${slug(repo)}:${type}:${slug(value || repo)}`;
}

function edgeId(from, to, type) {
  return `${type}:${slug(from)}:${slug(to)}`;
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9_./:-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function countNodes(type) {
  return graph.nodes.filter((node) => node.type === type && node.status !== 'missing').length;
}

function git(cwd, args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}

function detectPackageManager(repoPath) {
  if (existsSync(join(repoPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(repoPath, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(repoPath, 'package-lock.json'))) return 'npm';
  if (existsSync(join(repoPath, 'package.json'))) return 'npm';
  return 'unknown';
}

function shouldIgnoreEntry(name, isDirectory) {
  if (isDirectory && ignoredDirectories.has(name)) return true;
  if (name === '.DS_Store') return true;
  return ignoredExactFiles.has(name);
}

function shouldIgnoreFile(name, path) {
  if (ignoredExactFiles.has(name)) return true;
  if (name.includes('.env.') && !safeEnvFiles.has(name)) return true;
  const extension = extname(name).toLowerCase();
  if (largeMediaExtensions.has(extension)) return true;
  if (!textExtensions.has(extension) && !safeEnvFiles.has(name)) return true;
  return path.includes('/.tools/') || path.includes('/tools/deno/');
}

function readSafe(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function matchAll(content, regex) {
  const matches = [];
  let match = regex.exec(content);
  while (match) {
    matches.push(match[1]);
    match = regex.exec(content);
  }
  return matches;
}

function matchPolicies(sql) {
  const policies = [];
  const regex = /create\s+policy\s+["']?([^"'\n]+)["']?\s+on\s+(?:public\.)?["`]?([a-zA-Z0-9_]+)["`]?/gi;
  let match = regex.exec(sql);
  while (match) {
    policies.push({ name: match[1].trim(), table: match[2] });
    match = regex.exec(sql);
  }
  return policies;
}

function firstMarkdownTitle(content) {
  return content
    .split('\n')
    .find((line) => line.startsWith('# '))
    ?.replace(/^#\s+/, '')
    .trim();
}

function sanitizeCommand(command) {
  return command.replace(/AGENT_MEMORY_WRITE_TOKEN=[^\s]+/g, 'AGENT_MEMORY_WRITE_TOKEN=[redacted]');
}

function isServicePath(relativePath) {
  return /(^|\/)(api|client|clients|integrations?|lib|services?|supabase|sync)(\/|$)/i.test(relativePath);
}

function resolveImportNodeId(repoName, fromPath, importTarget) {
  const base = dirname(fromPath);
  const target = importTarget.startsWith('.') ? relative('.', join(base, importTarget)) : importTarget;
  const candidates = [
    target,
    `${target}.ts`,
    `${target}.tsx`,
    `${target}.js`,
    `${target}.jsx`,
    `${target}/index.ts`,
    `${target}/index.tsx`,
    `${target}/index.js`,
    `${target}/index.jsx`,
  ];
  for (const candidate of candidates) {
    const id = nodeId(repoName, 'file', candidate);
    if (nodeIds.has(id)) return id;
  }
  return nodeId(repoName, 'file', target);
}

function supabaseFunctionNameForPath(relativePath) {
  const match = relativePath.match(/^supabase\/functions\/([^/]+)\//);
  return match?.[1] || '';
}

function tableActionForContent(content, table) {
  const escaped = table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fromPattern = String.raw`\.from\(['"\`]${escaped}['"\`]\)([\s\S]{0,260})`;
  const match = content.match(new RegExp(fromPattern));
  const context = match?.[1] || '';
  if (/\.(insert|update|upsert|delete)\s*\(/.test(context)) return 'write';
  if (/\.select\s*\(/.test(context)) return 'read';
  return 'reference';
}

function pruneLowSignalGraph() {
  const semanticFileIds = new Set(
    graph.edges
      .filter((edge) => edge.type !== 'contains' && (edge.from.includes(':file:') || edge.to.includes(':file:')))
      .flatMap((edge) => [edge.from, edge.to])
      .filter((id) => id.includes(':file:')),
  );
  const keepNodeIds = new Set(
    graph.nodes
      .filter((node) => node.type !== 'file' || semanticFileIds.has(node.id))
      .map((node) => node.id),
  );
  graph.nodes = graph.nodes.filter((node) => keepNodeIds.has(node.id));
  graph.edges = graph.edges.filter((edge) => keepNodeIds.has(edge.from) && keepNodeIds.has(edge.to));
  for (const repo of graph.repositories) {
    repo.filesIndexed = graph.nodes.filter((node) => node.repo === repo.name && node.type === 'file').length;
  }
}

function enrichOwnershipAndHealth() {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const envExamplesByRepo = new Map();
  for (const node of graph.nodes.filter((item) => item.type === 'env_variable_name')) {
    if (node.metadata?.source !== 'example') continue;
    if (!envExamplesByRepo.has(node.repo)) envExamplesByRepo.set(node.repo, new Set());
    envExamplesByRepo.get(node.repo).add(node.label);
  }

  for (const node of graph.nodes) {
    node.owner = detectOwner(node);
    node.featureArea = detectFeatureArea(node);
    node.docStatus = docStatusForNode(node);
    node.orphanStatus = orphanStatusForNode(node);
    node.riskSignals = riskSignalsForNode(node);
  }

  const brokenWarnings = [];
  for (const edge of graph.edges) {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (to?.type === 'file' && to.status !== 'indexed' && ['imports', 'uses', 'renders'].includes(edge.type)) {
      brokenWarnings.push(`${from?.repo || 'Unknown'}: ${from?.path || edge.from} references missing file ${edge.metadata?.target || to.path}`);
    }
  }

  for (const node of graph.nodes.filter((item) => item.type === 'env_variable_name' && item.metadata?.source === 'source_reference')) {
    if (!envExamplesByRepo.get(node.repo)?.has(node.label)) {
      brokenWarnings.push(`${node.repo}: env variable ${node.label} is referenced but not present in an example env file.`);
    }
  }

  for (const node of graph.nodes.filter((item) => item.type === 'supabase_function' && item.metadata?.detectedFromCall)) {
    const hasFunctionFolder = graph.nodes.some(
      (candidate) =>
        candidate.type === 'supabase_function' &&
        candidate.repo === node.repo &&
        candidate.label === node.label &&
        candidate.metadata?.detectedFromCall !== true,
    );
    if (!hasFunctionFolder) brokenWarnings.push(`${node.repo}: function ${node.label} is referenced in code but no supabase/functions folder was indexed.`);
  }

  for (const node of graph.nodes.filter((item) => item.type === 'table')) {
    const inbound = inboundEdges(node.id);
    const appReferences = inbound.filter((edge) => {
      const source = nodeById.get(edge.from);
      return source && source.type !== 'migration' && ['references_table', 'reads_table', 'writes_table'].includes(edge.type);
    });
    const created = inbound.some((edge) => edge.type === 'creates_table');
    if (created && appReferences.length === 0) {
      brokenWarnings.push(`${node.repo}: table ${node.label} is created by migrations but no app references were detected.`);
    }
  }

  for (const warning of brokenWarnings.slice(0, 500)) graph.warnings.push(`Relationship warning: ${warning}`);

  for (const repo of graph.repositories) {
    const repoNodes = graph.nodes.filter((node) => node.repo === repo.name);
    const highRiskNodes = repoNodes.filter((node) => node.riskSignals?.some((signal) => signal.startsWith('high:'))).length;
    const missingDocs = repoNodes.filter((node) => node.docStatus === 'missing').length;
    const orphanCandidates = repoNodes.filter((node) => node.orphanStatus === 'orphan_candidate').length;
    const brokenRelationshipWarnings = brokenWarnings.filter((warning) => warning.startsWith(`${repo.name}:`)).length;
    repo.owner = primaryOwner(repoNodes);
    repo.highRiskNodes = highRiskNodes;
    repo.missingDocs = missingDocs;
    repo.orphanCandidates = orphanCandidates;
    repo.brokenRelationshipWarnings = brokenRelationshipWarnings;
    const repoNodeCount = Math.max(1, repoNodes.length);
    repo.healthScore = Math.round(
      Math.max(
        0,
        Math.min(
          100,
          100 -
            Math.min(45, (highRiskNodes / repoNodeCount) * 100) -
            Math.min(25, (missingDocs / repoNodeCount) * 100) -
            Math.min(20, (orphanCandidates / repoNodeCount) * 100) -
            Math.min(10, brokenRelationshipWarnings),
        ),
      ),
    );
    repo.riskLevel = highRiskNodes / repoNodeCount > 0.25 || repo.healthScore < 55 ? 'high' : repo.healthScore < 80 ? 'medium' : 'low';
  }
}

function detectOwner(node) {
  const value = `${node.repo} ${node.path} ${node.label}`.toLowerCase();
  if (node.repo === 'vyra-agents') return 'Agent Platform';
  if (node.repo === 'Vyra-Software') return 'Desktop Software';
  if (node.repo === 'vyra-website') return keywordOwner(value, 'Website');
  if (value.includes('supabase/functions') || value.includes('supabase/migrations') || node.type === 'table') return 'Backend / Supabase';
  return keywordOwner(value, node.repo === 'Vyra-Part-1' ? 'Mobile App' : 'Unknown');
}

function keywordOwner(value, fallback) {
  if (/(stripe|billing|subscription|payment|invoice|revenue|commission)/.test(value)) return 'Billing / Revenue';
  if (/(sales|crm|lead|attribution)/.test(value)) return 'Sales / CRM';
  if (/(gym|organization|member|membership|class|attendance)/.test(value)) return 'Gym OS';
  if (/coach/.test(value)) return 'Coach Platform';
  if (/(athlete|workout|track|nutrition)/.test(value)) return 'Athlete Experience';
  if (/migration/.test(value)) return 'Migration System';
  if (/(oura|whoop|health|apple-health)/.test(value)) return 'Health Integrations';
  if (/(support|operation|audit|queue)/.test(value)) return 'Support / Operations';
  return fallback;
}

function detectFeatureArea(node) {
  const value = `${node.path} ${node.label}`.toLowerCase();
  const matches = [
    ['billing', /(stripe|billing|subscription|payment|invoice|revenue)/],
    ['sales-crm', /(sales|crm|lead|commission|attribution)/],
    ['memberships', /(member|membership|organization_member)/],
    ['gym-operations', /(gym|organization|class|attendance)/],
    ['coach-platform', /coach/],
    ['athlete-experience', /(athlete|workout|training|nutrition|progress)/],
    ['migration', /migration/],
    ['health-integrations', /(oura|whoop|health|apple-health)/],
    ['auth-security', /(auth|rls|policy|permission|security)/],
    ['agent-memory', /(agent_memory|agent-memory|agent memory)/],
  ];
  return matches.find(([, regex]) => regex.test(value))?.[0] || 'core-platform';
}

function riskSignalsForNode(node) {
  const signals = [];
  const inboundCount = inboundEdges(node.id).length;
  const outbound = outboundEdges(node.id);
  const value = `${node.path} ${node.label}`.toLowerCase();
  if (['table', 'migration', 'supabase_function', 'rls_policy'].includes(node.type)) signals.push('high:data-or-runtime-control-plane');
  if (/(auth|payment|billing|health|rls|membership|organization_members?)/.test(value)) signals.push('high:sensitive-domain');
  if (node.type === 'supabase_function' && outbound.some((edge) => ['writes_table', 'references_table'].includes(edge.type))) signals.push('high:function-table-coupling');
  if (node.type === 'table' && inboundCount > 20) signals.push('high:many-dependents');
  else if (inboundCount > 8) signals.push('medium:moderate-dependents');
  if (node.docStatus === 'missing') signals.push('medium:missing-docs');
  return signals;
}

function docStatusForNode(node) {
  if (node.type === 'document') return 'documented';
  if (['folder', 'package_dependency', 'npm_script', 'env_variable_name', 'storage_bucket'].includes(node.type)) return 'unknown';
  if (node.type === 'supabase_function') return node.metadata?.hasReadme ? 'documented' : 'missing';
  if (node.type === 'table') {
    const hasDoc = graph.nodes.some((candidate) => candidate.type === 'document' && candidate.repo === node.repo && normalized(candidate.path).includes(normalized(node.label)));
    return hasDoc ? 'documented' : inboundEdges(node.id).length > 12 ? 'missing' : 'unknown';
  }
  if (['route', 'screen', 'service'].includes(node.type)) {
    const folder = dirname(node.path);
    const hasNearbyDoc = graph.nodes.some((candidate) => candidate.type === 'document' && candidate.repo === node.repo && dirname(candidate.path) === folder);
    return hasNearbyDoc ? 'documented' : 'missing';
  }
  return 'unknown';
}

function orphanStatusForNode(node) {
  if (!['component', 'service', 'document', 'table', 'supabase_function'].includes(node.type)) return 'unknown';
  const inbound = inboundEdges(node.id);
  if (node.type === 'table') {
    const appReferences = inbound.filter((edge) => {
      const source = graph.nodes.find((item) => item.id === edge.from);
      return source && source.type !== 'migration' && ['references_table', 'reads_table', 'writes_table'].includes(edge.type);
    });
    return appReferences.length === 0 ? 'orphan_candidate' : 'connected';
  }
  if (node.type === 'document') return inbound.length <= 1 ? 'orphan_candidate' : 'connected';
  if (node.type === 'supabase_function') return node.metadata?.hasReadme || inbound.some((edge) => edge.type === 'calls_function') ? 'connected' : 'orphan_candidate';
  return inbound.filter((edge) => edge.type !== 'defines').length === 0 ? 'orphan_candidate' : 'connected';
}

function primaryOwner(nodes) {
  const counts = new Map();
  for (const node of nodes) counts.set(node.owner || 'Unknown', (counts.get(node.owner || 'Unknown') || 0) + 1);
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || 'Unknown';
}

function inboundEdges(nodeIdValue) {
  return graph.edges.filter((edge) => edge.to === nodeIdValue);
}

function outboundEdges(nodeIdValue) {
  return graph.edges.filter((edge) => edge.from === nodeIdValue);
}

function normalized(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}
