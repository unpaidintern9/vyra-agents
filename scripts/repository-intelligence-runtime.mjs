import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGitHubPlanningStatus } from './github-planning-runtime.mjs';
import { buildProjectRegistry } from './project-registry-runtime.mjs';
import { buildSharedTaskStatus } from './shared-task-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const engineeringGraphPath = path.join(repoRoot, 'dashboard/public/engineering-graph.json');
export const repoIntelligenceReportRoot = path.join(repoRoot, 'reports/agents/engineering');
export const repoRuntimeReportRoot = path.join(repoRoot, 'reports/agents/runtime');

export const repoIntelligenceCommands = ['repo:scan', 'repo:status', 'repo:graph', 'repo:health', 'repo:owners', 'repo:validate'];

export function runRepositoryScan() {
  execFileSync('node', ['scripts/engineering-scan.mjs'], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const intelligence = buildRepositoryIntelligence();
  writeRepositoryReports(intelligence);
  return {
    status: 'success',
    action: 'repo_scan',
    graphPath: path.relative(repoRoot, engineeringGraphPath),
    intelligenceSummary: intelligence.summary,
    safety: safetySummary(),
  };
}

export function buildRepositoryIntelligence() {
  const graph = loadEngineeringGraph();
  const sharedTasks = buildSharedTaskStatus();
  const githubPlanning = buildGitHubPlanningStatus();
  const projectRegistry = buildProjectRegistry();
  const repositories = graph.repositories.map((repo) => buildRepositoryModel(repo, graph, sharedTasks, githubPlanning));
  const dependencyGraph = buildDependencyGraph(graph);
  const ownership = buildOwnershipModel(repositories, graph, sharedTasks, githubPlanning);
  const health = buildHealthAnalysis(repositories, graph, dependencyGraph);
  const knowledgeGraph = buildKnowledgeGraph(repositories, dependencyGraph, ownership);

  return {
    title: 'Repository Intelligence',
    generatedAt: new Date().toISOString(),
    schemaVersion: 1,
    sourceGraph: {
      generatedAt: graph.generatedAt,
      scanner: graph.scanner,
      path: path.relative(repoRoot, engineeringGraphPath),
    },
    summary: {
      repositories: repositories.length,
      modules: sum(repositories, 'modules'),
      packages: sum(repositories, 'packages'),
      applications: sum(repositories, 'applications'),
      services: sum(repositories, 'services'),
      libraries: sum(repositories, 'libraries'),
      documentation: sum(repositories, 'documentation'),
      migrations: sum(repositories, 'migrations'),
      configuration: sum(repositories, 'configuration'),
      scripts: sum(repositories, 'scripts'),
      dependencyEdges: dependencyGraph.edges.length,
      circularDependencies: dependencyGraph.circularDependencies.length,
      orphanedModules: dependencyGraph.orphanedModules.length,
      engineeringHealthScore: health.engineeringHealthScore,
      repositoryRisk: health.repositoryRisk,
      documentationCompleteness: health.documentationCompleteness,
      dependencyHealth: health.dependencyHealth,
      validationTrend: health.validationTrend,
      registeredProjects: projectRegistry.summary.registeredProjects,
      indexedProjects: projectRegistry.summary.indexedProjects,
      blockedProjects: projectRegistry.summary.blockedProjects,
      releaseReadinessStatus: projectRegistry.releaseReadiness.summary.releaseReadinessStatus,
    },
    projectRegistry: {
      summary: projectRegistry.summary,
      projects: projectRegistry.projects.map((project) => ({
        id: project.id,
        projectName: project.projectName,
        repoName: project.repoName,
        localPath: project.localPath,
        branch: project.branch,
        projectType: project.projectType,
        owningAgent: project.owningAgent,
        status: project.status,
        validationStatus: project.validation.validationStatus,
        healthScore: project.health.healthScore,
        riskLevel: project.health.riskLevel,
        releaseReadiness: project.health.releaseReadiness,
        issues: project.health.issues,
      })),
      releaseReadiness: projectRegistry.releaseReadiness,
    },
    repositories,
    dependencyGraph,
    ownership,
    health,
    knowledgeGraph,
    safety: safetySummary(),
  };
}

export function getRepositoryStatus() {
  const intelligence = buildRepositoryIntelligence();
  return {
    status: 'ready',
    generatedAt: intelligence.generatedAt,
    summary: intelligence.summary,
    projectRegistry: intelligence.projectRegistry,
    repositories: intelligence.repositories.map((repo) => ({
      name: repo.name,
      owner: repo.ownership.owningAgent,
      team: repo.ownership.responsibleTeam,
      healthScore: repo.health.healthScore,
      riskLevel: repo.health.riskLevel,
      dependencyHealth: repo.health.dependencyHealth,
    })),
    safety: intelligence.safety,
  };
}

export function getRepositoryGraph() {
  const intelligence = buildRepositoryIntelligence();
  const payload = {
    title: 'Repository Graph',
    generatedAt: intelligence.generatedAt,
    graph: intelligence.knowledgeGraph,
    dependencyGraph: intelligence.dependencyGraph,
    safety: intelligence.safety,
  };
  writeReport(repoRuntimeReportRoot, 'repository-graph', payload);
  return payload;
}

export function getRepositoryHealth() {
  const intelligence = buildRepositoryIntelligence();
  const payload = {
    title: 'Engineering Health Report',
    generatedAt: intelligence.generatedAt,
    summary: intelligence.summary,
    health: intelligence.health,
    projectRegistry: intelligence.projectRegistry,
    repositories: intelligence.repositories.map((repo) => ({ name: repo.name, health: repo.health })),
    safety: intelligence.safety,
  };
  writeReport(repoIntelligenceReportRoot, 'engineering-health-report', payload);
  return payload;
}

export function getRepositoryOwners() {
  const intelligence = buildRepositoryIntelligence();
  const payload = {
    title: 'Repository Ownership Report',
    generatedAt: intelligence.generatedAt,
    ownership: intelligence.ownership,
    repositories: intelligence.repositories.map((repo) => ({ name: repo.name, ownership: repo.ownership })),
    safety: intelligence.safety,
  };
  writeReport(repoIntelligenceReportRoot, 'repository-ownership-report', payload);
  return payload;
}

export function validateRepositoryIntelligence() {
  const errors = [];
  if (!existsSync(engineeringGraphPath)) errors.push('engineering graph is missing; run npm run repo:scan.');
  let intelligence = null;
  try {
    intelligence = buildRepositoryIntelligence();
  } catch (error) {
    errors.push(error.message);
  }
  if (intelligence && intelligence.summary.repositories < 1) errors.push('at least one repository is required.');
  if (intelligence && intelligence.projectRegistry.summary.registeredProjects < 5) errors.push('project registry must include required projects.');
  if (intelligence && !Array.isArray(intelligence.dependencyGraph.edges)) errors.push('dependency graph edges must be an array.');
  if (intelligence && !Array.isArray(intelligence.knowledgeGraph.nodes)) errors.push('knowledge graph nodes must be an array.');
  return {
    status: errors.length === 0 ? 'pass' : 'fail',
    generatedAt: new Date().toISOString(),
    commands: repoIntelligenceCommands,
    errors,
    summary: intelligence?.summary ?? null,
    safety: safetySummary(),
  };
}

export function writeRepositoryReports(intelligence = buildRepositoryIntelligence()) {
  return [
    writeReport(repoIntelligenceReportRoot, 'repository-intelligence-report', intelligence),
    writeReport(repoRuntimeReportRoot, 'repository-graph', {
      title: 'Repository Graph',
      generatedAt: intelligence.generatedAt,
      graph: intelligence.knowledgeGraph,
      dependencyGraph: intelligence.dependencyGraph,
      safety: intelligence.safety,
      projectRegistry: intelligence.projectRegistry,
    }),
    writeReport(repoIntelligenceReportRoot, 'engineering-health-report', {
      title: 'Engineering Health Report',
      generatedAt: intelligence.generatedAt,
      summary: intelligence.summary,
      health: intelligence.health,
      projectRegistry: intelligence.projectRegistry,
      repositories: intelligence.repositories.map((repo) => ({ name: repo.name, health: repo.health })),
      safety: intelligence.safety,
    }),
    writeReport(repoIntelligenceReportRoot, 'dependency-report', {
      title: 'Dependency Report',
      generatedAt: intelligence.generatedAt,
      dependencyGraph: intelligence.dependencyGraph,
      safety: intelligence.safety,
    }),
  ].flat();
}

function loadEngineeringGraph() {
  if (!existsSync(engineeringGraphPath)) {
    throw new Error('engineering graph missing; run npm run repo:scan.');
  }
  return JSON.parse(readFileSync(engineeringGraphPath, 'utf8'));
}

function buildRepositoryModel(repo, graph, sharedTasks, githubPlanning) {
  const nodes = graph.nodes.filter((node) => node.repo === repo.name);
  const docs = nodes.filter((node) => node.type === 'document');
  const repoTasks = taskMatches(sharedTasks, repo.name);
  const repoPlans = planMatches(githubPlanning, repo.name);
  const relatedDocs = docs.slice(0, 10).map((node) => node.path);
  return {
    id: `repository:${slugify(repo.name)}`,
    name: repo.name,
    path: repo.path,
    status: repo.status,
    remote: repo.gitRemote,
    branch: repo.branch,
    latestCommit: repo.latestCommit,
    dirty: repo.dirty,
    packageManager: repo.packageManager,
    projectId: repo.projectId,
    projectName: repo.projectName ?? repo.name,
    projectType: repo.projectType,
    repoOwner: repo.repoOwner,
    repoName: repo.repoName,
    modules: nodes.filter((node) => ['file', 'folder', 'component', 'hook', 'route', 'screen'].includes(node.type)).length,
    packages: nodes.filter((node) => node.type === 'package_dependency').length,
    applications: nodes.filter((node) => ['route', 'screen'].includes(node.type)).length,
    services: nodes.filter((node) => ['service', 'api_endpoint', 'supabase_function'].includes(node.type)).length,
    libraries: nodes.filter((node) => ['component', 'hook'].includes(node.type)).length,
    documentation: docs.length,
    migrations: nodes.filter((node) => node.type === 'migration').length,
    configuration: nodes.filter((node) => isConfigNode(node)).length,
    scripts: nodes.filter((node) => node.type === 'npm_script').length,
    ownership: {
      owningAgent: repo.owningAgent ? `${repo.owningAgent} Agent` : 'Engineering Agent',
      responsibleTeam: repo.owner || ownerForRepo(repo.name),
      relatedDocumentation: relatedDocs,
      relatedTasks: repoTasks.map((task) => task.id),
      relatedGitHubPlans: repoPlans.map((plan) => plan.id),
      relatedExecutivePriorities: repoPlans.map((plan) => plan.linkedExecutivePriority?.id).filter(Boolean),
    },
    health: {
      buildStatus: repo.status === 'indexed' ? 'not run by repo intelligence' : 'missing',
      lintStatus: repo.status === 'indexed' ? 'not run by repo intelligence' : 'missing',
      validationStatus: repo.status === 'indexed' ? 'graph indexed' : 'missing',
      documentationCoverage: percent(docs.length, Math.max(1, nodes.filter((node) => ['file', 'route', 'screen', 'component', 'service'].includes(node.type)).length)),
      dependencyHealth: dependencyHealthForRepo(repo, graph),
      technicalDebtMarkers: (repo.highRiskNodes ?? 0) + (repo.orphanCandidates ?? 0) + (repo.brokenRelationshipWarnings ?? 0),
      engineeringWarnings: graph.warnings.filter((warning) => warning.includes(`${repo.name}:`) || warning.includes(repo.name)).slice(0, 10),
      healthScore: repo.healthScore ?? 0,
      riskLevel: repo.riskLevel ?? 'unknown',
    },
  };
}

function buildDependencyGraph(graph) {
  const relevantTypes = new Set(['imports', 'uses', 'renders', 'depends_on', 'calls_function', 'references_table', 'reads_table', 'writes_table']);
  const edges = graph.edges.filter((edge) => relevantTypes.has(edge.type));
  const adjacency = new Map();
  edges.forEach((edge) => {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    adjacency.get(edge.from).push(edge.to);
  });
  const circularDependencies = findCycles(adjacency).slice(0, 20);
  const connected = new Set(edges.flatMap((edge) => [edge.from, edge.to]));
  const orphanedModules = graph.nodes
    .filter((node) => ['file', 'component', 'service', 'hook'].includes(node.type))
    .filter((node) => !connected.has(node.id) || node.orphanStatus === 'orphan_candidate')
    .slice(0, 100)
    .map((node) => ({ id: node.id, label: node.label, repo: node.repo, path: node.path, type: node.type }));
  const sharedComponents = graph.nodes
    .filter((node) => ['component', 'hook'].includes(node.type))
    .filter((node) => graph.edges.filter((edge) => edge.to === node.id).length > 1)
    .slice(0, 50)
    .map((node) => ({ id: node.id, label: node.label, repo: node.repo, inboundReferences: graph.edges.filter((edge) => edge.to === node.id).length }));
  return {
    edgeCount: edges.length,
    edges: edges.slice(0, 2000).map((edge) => ({ from: edge.from, to: edge.to, type: edge.type })),
    imports: edges.filter((edge) => edge.type === 'imports').length,
    packageDependencies: graph.nodes.filter((node) => node.type === 'package_dependency').length,
    moduleRelationships: edges.filter((edge) => ['imports', 'uses', 'renders'].includes(edge.type)).length,
    runtimeRelationships: edges.filter((edge) => ['calls_function', 'reads_table', 'writes_table', 'references_table'].includes(edge.type)).length,
    sharedComponents,
    circularDependencies,
    orphanedModules,
  };
}

function buildOwnershipModel(repositories, graph, sharedTasks, githubPlanning) {
  const ownerMap = new Map();
  repositories.forEach((repo) => {
    const owner = repo.ownership.responsibleTeam;
    if (!ownerMap.has(owner)) ownerMap.set(owner, { owner, repositories: [], healthScores: [], relatedTasks: 0, relatedGitHubPlans: 0, relatedDocs: 0 });
    const row = ownerMap.get(owner);
    row.repositories.push(repo.name);
    row.healthScores.push(repo.health.healthScore);
    row.relatedTasks += repo.ownership.relatedTasks.length;
    row.relatedGitHubPlans += repo.ownership.relatedGitHubPlans.length;
    row.relatedDocs += repo.ownership.relatedDocumentation.length;
  });
  return {
    owners: [...ownerMap.values()].map((row) => ({
      ...row,
      averageHealthScore: Math.round(row.healthScores.reduce((total, score) => total + score, 0) / Math.max(1, row.healthScores.length)),
    })),
    taskLinks: sharedTasks.totalTasks ?? 0,
    githubPlanLinks: githubPlanning.totalPlans ?? 0,
    executivePriorityLinks: repositories.reduce((total, repo) => total + repo.ownership.relatedExecutivePriorities.length, 0),
    documentationLinks: graph.nodes.filter((node) => node.type === 'document').length,
  };
}

function buildHealthAnalysis(repositories, graph, dependencyGraph) {
  const scores = repositories.map((repo) => repo.health.healthScore);
  const engineeringHealthScore = Math.round(scores.reduce((total, score) => total + score, 0) / Math.max(1, scores.length));
  const docCoverageValues = repositories.map((repo) => repo.health.documentationCoverage);
  const documentationCompleteness = Math.round(docCoverageValues.reduce((total, score) => total + score, 0) / Math.max(1, docCoverageValues.length));
  const dependencyHealth = dependencyGraph.circularDependencies.length > 0 ? 'Watch' : dependencyGraph.orphanedModules.length > 25 ? 'Watch' : 'Ready';
  return {
    engineeringHealthScore,
    repositoryRisk: repositories.some((repo) => repo.health.riskLevel === 'high') ? 'High' : repositories.some((repo) => repo.health.riskLevel === 'medium') ? 'Medium' : 'Low',
    documentationCompleteness,
    dependencyHealth,
    validationTrend: graph.generatedAt ? 'Latest local scan available' : 'Scan unavailable',
    buildStatus: 'Read-only intelligence does not execute repo builds.',
    lintStatus: 'Read-only intelligence does not execute repo lint commands.',
    validationStatus: 'Repository intelligence validation available through npm run repo:validate.',
    technicalDebtMarkers: repositories.reduce((total, repo) => total + repo.health.technicalDebtMarkers, 0),
    engineeringWarnings: graph.warnings.slice(0, 50),
  };
}

function buildKnowledgeGraph(repositories, dependencyGraph, ownership) {
  const nodes = [
    { id: 'repository-intelligence', type: 'knowledge_source', label: 'Repository Intelligence Engine' },
    ...repositories.map((repo) => ({
      id: repo.id,
      type: 'repository',
      label: repo.name,
      healthScore: repo.health.healthScore,
      riskLevel: repo.health.riskLevel,
    })),
    ...ownership.owners.map((owner) => ({ id: `owner:${slugify(owner.owner)}`, type: 'owner', label: owner.owner })),
  ];
  const edges = [
    ...repositories.map((repo) => ({ from: 'repository-intelligence', to: repo.id, relationship: 'indexes_repository' })),
    ...repositories.map((repo) => ({ from: repo.id, to: `owner:${slugify(repo.ownership.responsibleTeam)}`, relationship: 'owned_by' })),
    ...dependencyGraph.edges.slice(0, 500).map((edge) => ({ from: edge.from, to: edge.to, relationship: edge.type })),
  ];
  return {
    localOnly: true,
    nodes,
    edges,
    relationshipTypes: ['indexes_repository', 'owned_by', 'imports', 'uses', 'renders', 'depends_on', 'calls_function', 'references_table', 'reads_table', 'writes_table'],
  };
}

function writeReport(directory, slug, payload) {
  mkdirSync(directory, { recursive: true });
  const stamp = compactStamp(payload.generatedAt || new Date().toISOString());
  const base = `${stamp}-${slug}`;
  const jsonPath = path.join(directory, `${base}.json`);
  const mdPath = path.join(directory, `${base}.md`);
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(mdPath, toMarkdown(payload));
  return [jsonPath, mdPath];
}

function taskMatches(sharedTasks, repoName) {
  const tasks = [...(sharedTasks.activeWorkQueue ?? []), ...(sharedTasks.blockedWork ?? []), ...(sharedTasks.newestAssignments ?? [])];
  return tasks.filter((task) => JSON.stringify(task).toLowerCase().includes(repoName.toLowerCase()));
}

function planMatches(githubPlanning, repoName) {
  return (githubPlanning.plans ?? []).filter((plan) => JSON.stringify(plan).toLowerCase().includes(repoName.toLowerCase()));
}

function dependencyHealthForRepo(repo, graph) {
  const dependencyCount = graph.nodes.filter((node) => node.repo === repo.name && node.type === 'package_dependency').length;
  if ((repo.brokenRelationshipWarnings ?? 0) > 0 || dependencyCount > 150) return 'Watch';
  return 'Ready';
}

function isConfigNode(node) {
  return node.type === 'env_variable_name' || /\.(json|toml|ya?ml|config\.[cm]?[jt]s)$/i.test(node.path || node.label || '');
}

function findCycles(adjacency) {
  const cycles = [];
  const visited = new Set();
  const stack = new Set();
  const pathStack = [];
  const visit = (node) => {
    if (stack.has(node)) {
      const start = pathStack.indexOf(node);
      if (start >= 0) cycles.push(pathStack.slice(start).concat(node));
      return;
    }
    if (visited.has(node) || cycles.length >= 20) return;
    visited.add(node);
    stack.add(node);
    pathStack.push(node);
    (adjacency.get(node) ?? []).slice(0, 50).forEach(visit);
    pathStack.pop();
    stack.delete(node);
  };
  [...adjacency.keys()].slice(0, 2000).forEach(visit);
  return cycles;
}

function ownerForRepo(repoName) {
  if (repoName === 'vyra-agents') return 'Agent Platform';
  if (repoName === 'Vyra-Part-1') return 'Mobile App';
  if (repoName === 'Vyra-Software') return 'Desktop Software';
  if (repoName === 'vyra-website') return 'Website';
  return 'Engineering';
}

function percent(value, total) {
  return Math.round((value / Math.max(1, total)) * 100);
}

function sum(items, key) {
  return items.reduce((total, item) => total + Number(item[key] ?? 0), 0);
}

function safetySummary() {
  return {
    localOnly: true,
    repositoryModifications: false,
    githubWrites: false,
    externalServiceWrites: false,
    secretsPrinted: false,
  };
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title || 'Repository Intelligence Report'}`, ''];
  Object.entries(payload)
    .filter(([key]) => key !== 'title')
    .forEach(([key, value]) => appendMarkdownValue(lines, labelize(key), value, 2));
  return `${lines.join('\n').trim()}\n`;
}

function appendMarkdownValue(lines, title, value, level) {
  lines.push(`${'#'.repeat(level)} ${title}`, '');
  if (Array.isArray(value)) {
    value.forEach((item) => lines.push(`- ${formatValue(item)}`));
  } else if (typeof value === 'object' && value !== null) {
    Object.entries(value).forEach(([key, child]) => lines.push(`- ${labelize(key)}: ${formatValue(child)}`));
  } else {
    lines.push(String(value ?? ''));
  }
  lines.push('');
}

function compactStamp(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function labelize(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function slugify(value) {
  return String(value || 'item')
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}
