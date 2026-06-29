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
      const folderId = nodeId(repoName, 'folder', relativePath);
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
  for (const importTarget of matchAll(content, /import(?:\s+type)?(?:[\s\S]*?)from\s+['"]([^'"]+)['"]/g)) {
    addEdge(fileId, nodeId(repoName, 'file', importTarget), 'imports', { target: importTarget });
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
  }

  for (const name of matchAll(content, /(?:export\s+)?async\s+function\s+([a-z][A-Za-z0-9_]*)\s*\(/g)) {
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
