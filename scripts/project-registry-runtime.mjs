import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const projectConfigRoot = path.join(repoRoot, 'codex-agent-threads/shared/projects');
export const projectReportRoot = path.join(repoRoot, 'reports/agents/runtime');
export const engineeringReportRoot = path.join(repoRoot, 'reports/agents/engineering');

export const projectCommands = ['projects:status', 'projects:list', 'projects:scan', 'projects:health', 'projects:report', 'projects:validate'];
export const projectTypes = ['agent_runtime', 'mobile_app_backend', 'desktop_software', 'website', 'client_website', 'future_project'];
export const projectStatuses = ['indexed', 'missing_path', 'missing_git', 'configured', 'planned'];

export function ensureProjectDirectories() {
  mkdirSync(projectConfigRoot, { recursive: true });
  mkdirSync(projectReportRoot, { recursive: true });
  mkdirSync(engineeringReportRoot, { recursive: true });
}

export function buildProjectRegistry(options = {}) {
  ensureProjectDirectories();
  const includeMissing = options.includeMissing !== false;
  const configured = [...defaultProjectDefinitions(), ...loadLocalProjectDefinitions()];
  const seen = new Set();
  const projects = configured
    .filter((project) => {
      if (seen.has(project.id)) return false;
      seen.add(project.id);
      return true;
    })
    .map(enrichProject)
    .filter((project) => includeMissing || project.pathExists);
  const summary = summarizeProjects(projects);
  return {
    title: 'Project Registry',
    generatedAt: new Date().toISOString(),
    schemaVersion: 1,
    configRoot: path.relative(repoRoot, projectConfigRoot),
    projects,
    summary,
    releaseReadiness: buildReleaseReadiness(projects),
    safety: safetySummary(),
  };
}

export function getProjectStatus() {
  const registry = buildProjectRegistry();
  return {
    title: 'Project Registry Status',
    generatedAt: registry.generatedAt,
    registeredProjects: registry.summary.registeredProjects,
    indexedProjects: registry.summary.indexedProjects,
    missingProjects: registry.summary.missingProjects,
    blockedProjects: registry.summary.blockedProjects,
    validationStatus: registry.summary.validationStatus,
    lastScan: registry.generatedAt,
    projects: registry.projects.map(projectStatusRow),
    releaseReadiness: registry.releaseReadiness.summary,
    safety: registry.safety,
  };
}

export function listProjects() {
  const registry = buildProjectRegistry();
  return {
    title: 'Registered Projects',
    generatedAt: registry.generatedAt,
    projects: registry.projects,
    summary: registry.summary,
    safety: registry.safety,
  };
}

export function scanProjects() {
  const registry = buildProjectRegistry();
  const reports = writeProjectReports(registry);
  return {
    title: 'Project Registry Scan',
    generatedAt: registry.generatedAt,
    status: registry.summary.validationStatus === 'fail' ? 'attention' : 'success',
    scannedProjects: registry.summary.indexedProjects,
    missingProjects: registry.summary.missingProjects,
    reports,
    summary: registry.summary,
    safety: registry.safety,
  };
}

export function getProjectHealth() {
  const registry = buildProjectRegistry();
  const payload = {
    title: 'Multi-Project Health Report',
    generatedAt: registry.generatedAt,
    summary: registry.summary,
    projects: registry.projects.map((project) => ({
      id: project.id,
      name: project.projectName,
      status: project.status,
      riskLevel: project.health.riskLevel,
      healthScore: project.health.healthScore,
      releaseReadiness: project.health.releaseReadiness,
      validationStatus: project.health.validationStatus,
      issues: project.health.issues,
    })),
    releaseReadiness: registry.releaseReadiness,
    safety: registry.safety,
  };
  writeReport(projectReportRoot, 'multi-project-health-report', payload);
  return payload;
}

export function getProjectReport() {
  const registry = buildProjectRegistry();
  return {
    reports: writeProjectReports(registry),
    ...registry,
  };
}

export function validateProjectRegistry() {
  ensureProjectDirectories();
  const registry = buildProjectRegistry();
  const errors = [];
  if (!existsSync(projectConfigRoot)) errors.push('project config directory is missing.');
  if (registry.projects.length < 5) errors.push('registry must include the required Vyra and Valor projects.');
  const validations = registry.projects.map(validateProject);
  errors.push(...validations.flatMap((item) => item.errors.map((error) => `${item.id}: ${error}`)));
  return {
    title: 'Project Registry Validation',
    generatedAt: registry.generatedAt,
    status: errors.length === 0 ? 'pass' : 'fail',
    commands: projectCommands,
    errors,
    validations,
    summary: registry.summary,
    releaseReadiness: registry.releaseReadiness.summary,
    safety: registry.safety,
  };
}

export function projectScanTargets() {
  return buildProjectRegistry({ includeMissing: true }).projects
    .map((project) => ({
      id: project.id,
      name: project.projectName,
      path: project.localPath,
      repoOwner: project.repoOwner,
      repoName: project.repoName,
      projectType: project.projectType,
      owningAgent: project.owningAgent,
      validationCommands: project.validationCommands,
    }))
    .filter((project) => project.projectType !== 'future_project' || project.path);
}

function defaultProjectDefinitions() {
  const home = process.env.HOME || '/Users/vyra';
  const volumeRoot = '/Volumes/Install macOS Sequoia';
  return [
    project({
      id: 'vyra-agents',
      projectName: 'Vyra Agents',
      candidatePaths: [repoRoot],
      repoOwner: 'unpaidintern9',
      repoName: 'vyra-agents',
      projectType: 'agent_runtime',
      owningAgent: 'Executive',
      validationCommands: ['npm run agents:validate', 'npm run executive:automation-validate'],
      notes: ['Agent orchestration and local operator runtime.'],
    }),
    project({
      id: 'vyra-mobile-backend',
      projectName: 'Vyra mobile app / backend',
      candidatePaths: [path.join(home, 'Documents/Vyra-Part-1')],
      repoOwner: 'unpaidintern9',
      repoName: 'Vyra-Part-1',
      projectType: 'mobile_app_backend',
      owningAgent: 'Engineering',
      validationCommands: ['npm run lint', 'npm run typecheck'],
      notes: ['Mobile app and backend integration surface.'],
    }),
    project({
      id: 'vyra-desktop-software',
      projectName: 'Vyra desktop software',
      candidatePaths: [path.join(home, 'Documents/Vyra-Software/Vyra-Part-1-Desktop-App'), path.join(home, 'Documents/Vyra-Software')],
      repoOwner: 'unpaidintern9',
      repoName: 'Vyra-Part-1-Desktop-App',
      projectType: 'desktop_software',
      owningAgent: 'Engineering',
      validationCommands: ['npm run lint', 'npm run build'],
      notes: ['Desktop software project; scanned read-only when local path exists.'],
    }),
    project({
      id: 'vyra-website',
      projectName: 'Vyra website',
      candidatePaths: [path.join(home, 'Documents/Vyra-website'), path.join(home, 'Documents/vyra-website')],
      repoOwner: 'unpaidintern9',
      repoName: 'Vyra-website',
      projectType: 'website',
      owningAgent: 'Marketing',
      validationCommands: ['npm run lint', 'npm run build'],
      notes: ['Public Vyra website.'],
    }),
    project({
      id: 'valor-solutions-website',
      projectName: 'Valor Solutions website',
      candidatePaths: [path.join(volumeRoot, 'Valor-Solutions-Website'), path.join(home, 'Documents/valor-solutions-website')],
      repoOwner: 'unpaidintern9',
      repoName: 'Valor-Solutions-Website',
      projectType: 'client_website',
      owningAgent: 'Engineering',
      validationCommands: ['npm run lint', 'npm run build'],
      notes: ['Valor Solutions website project.'],
    }),
    project({
      id: 'future-projects',
      projectName: 'Future projects',
      candidatePaths: [],
      repoOwner: 'unassigned',
      repoName: 'future-projects',
      projectType: 'future_project',
      owningAgent: 'Executive',
      status: 'planned',
      validationCommands: [],
      notes: ['Placeholder for future project registrations.'],
    }),
  ];
}

function loadLocalProjectDefinitions() {
  if (!existsSync(projectConfigRoot)) return [];
  return readdirSync(projectConfigRoot)
    .filter((fileName) => fileName.endsWith('.json'))
    .flatMap((fileName) => {
      try {
        const parsed = JSON.parse(readFileSync(path.join(projectConfigRoot, fileName), 'utf8'));
        return parsed?.exampleOnly === true ? [] : [project(parsed)];
      } catch {
        return [];
      }
    });
}

function project(definition) {
  return {
    id: String(definition.id),
    projectName: String(definition.projectName ?? definition.name ?? definition.id),
    candidatePaths: Array.isArray(definition.candidatePaths) ? definition.candidatePaths.map(String) : definition.localPath ? [String(definition.localPath)] : [],
    repoOwner: String(definition.repoOwner ?? 'unassigned'),
    repoName: String(definition.repoName ?? definition.id),
    projectType: normalizeType(definition.projectType),
    owningAgent: normalizeAgent(definition.owningAgent),
    status: definition.status ? String(definition.status) : 'configured',
    validationCommands: Array.isArray(definition.validationCommands) ? definition.validationCommands.map(String) : [],
    notes: Array.isArray(definition.notes) ? definition.notes.map(String) : [],
  };
}

function enrichProject(definition) {
  const localPath = resolveProjectPath(definition);
  const pathExists = Boolean(localPath && existsSync(localPath));
  const gitExists = pathExists && existsSync(path.join(localPath, '.git'));
  const packageJsonPath = pathExists ? path.join(localPath, 'package.json') : null;
  const packageJson = packageJsonPath && existsSync(packageJsonPath) ? safeJson(packageJsonPath) : null;
  const branch = gitExists ? git(localPath, ['branch', '--show-current']) || 'unknown' : 'missing';
  const dirty = gitExists ? git(localPath, ['status', '--short']) !== '' : false;
  const latestCommit = gitExists ? git(localPath, ['rev-parse', '--short', 'HEAD']) || 'unknown' : 'missing';
  const remote = gitExists ? git(localPath, ['config', '--get', 'remote.origin.url']) || 'unknown' : 'missing';
  const status = definition.status === 'planned' ? 'planned' : !pathExists ? 'missing_path' : !gitExists ? 'missing_git' : 'indexed';
  const availableValidationCommands = definition.validationCommands.filter((command) => commandAvailable(command, packageJson));
  const missingValidationCommands = definition.validationCommands.filter((command) => !commandAvailable(command, packageJson));
  const issues = [
    status !== 'planned' && !pathExists ? `Missing local path: ${definition.candidatePaths[0] ?? 'not configured'}` : null,
    pathExists && !gitExists ? 'Missing .git directory' : null,
    dirty ? 'Working tree has local changes' : null,
    missingValidationCommands.length ? `Missing validation scripts: ${missingValidationCommands.join(', ')}` : null,
  ].filter(Boolean);
  const healthScore = status === 'planned' ? 70 : Math.max(0, 100 - (pathExists ? 0 : 35) - (gitExists ? 0 : 25) - (dirty ? 15 : 0) - missingValidationCommands.length * 5);
  const riskLevel = healthScore < 55 ? 'High' : healthScore < 80 ? 'Medium' : 'Low';
  const releaseReadiness = status === 'indexed' && !dirty && missingValidationCommands.length === 0 ? 'Ready' : status === 'planned' ? 'Planned' : 'Blocked';
  return {
    ...definition,
    localPath: localPath || definition.candidatePaths[0] || '',
    pathExists,
    gitExists,
    branch,
    remote,
    latestCommit,
    dirty,
    packageManager: packageJson ? detectPackageManager(localPath) : 'unknown',
    status,
    validation: {
      configuredCommands: definition.validationCommands,
      availableCommands: availableValidationCommands,
      missingCommands: missingValidationCommands,
      validationStatus: status === 'planned' ? 'planned' : missingValidationCommands.length || !pathExists ? 'attention' : 'ready',
    },
    health: {
      healthScore,
      riskLevel,
      releaseReadiness,
      validationStatus: status === 'planned' ? 'planned' : missingValidationCommands.length || !pathExists ? 'attention' : 'ready',
      issues,
    },
    notes: definition.notes,
  };
}

function resolveProjectPath(definition) {
  return definition.candidatePaths.find((candidatePath) => candidatePath && existsSync(candidatePath)) ?? definition.candidatePaths[0] ?? '';
}

function summarizeProjects(projects) {
  const indexedProjects = projects.filter((project) => project.status === 'indexed').length;
  const missingProjects = projects.filter((project) => project.status === 'missing_path' || project.status === 'missing_git').length;
  const blockedProjects = projects.filter((project) => project.health.releaseReadiness === 'Blocked').length;
  const averageHealthScore = Math.round(projects.reduce((sum, project) => sum + project.health.healthScore, 0) / Math.max(1, projects.length));
  const highRiskProjects = projects.filter((project) => project.health.riskLevel === 'High').length;
  const validationStatus = highRiskProjects ? 'attention' : 'pass';
  return {
    registeredProjects: projects.length,
    indexedProjects,
    missingProjects,
    blockedProjects,
    highRiskProjects,
    averageHealthScore,
    validationStatus,
    projectsByType: countBy(projects, 'projectType'),
    projectsByAgent: countBy(projects, 'owningAgent'),
    projectsByStatus: countBy(projects, 'status'),
  };
}

function buildReleaseReadiness(projects) {
  const blocked = projects.filter((project) => project.health.releaseReadiness === 'Blocked');
  const ready = projects.filter((project) => project.health.releaseReadiness === 'Ready');
  const planned = projects.filter((project) => project.health.releaseReadiness === 'Planned');
  return {
    summary: {
      readyProjects: ready.length,
      blockedProjects: blocked.length,
      plannedProjects: planned.length,
      releaseReadinessStatus: blocked.length ? 'Blocked' : 'Ready',
    },
    blockedProjects: blocked.map(projectStatusRow),
    readyProjects: ready.map(projectStatusRow),
    highPriorityProjectIssues: projects
      .flatMap((project) => project.health.issues.map((issue) => ({ projectId: project.id, projectName: project.projectName, issue, riskLevel: project.health.riskLevel })))
      .filter((issue) => issue.riskLevel !== 'Low')
      .slice(0, 12),
  };
}

function writeProjectReports(registry) {
  return [
    writeReport(projectReportRoot, 'project-registry-report', registry),
    writeReport(projectReportRoot, 'multi-project-health-report', {
      title: 'Multi-Project Health Report',
      generatedAt: registry.generatedAt,
      summary: registry.summary,
      projects: registry.projects.map(projectStatusRow),
      releaseReadiness: registry.releaseReadiness,
      safety: registry.safety,
    }),
    writeReport(engineeringReportRoot, 'release-readiness-report', {
      title: 'Release Readiness Report',
      generatedAt: registry.generatedAt,
      summary: registry.releaseReadiness.summary,
      blockedProjects: registry.releaseReadiness.blockedProjects,
      highPriorityProjectIssues: registry.releaseReadiness.highPriorityProjectIssues,
      safety: registry.safety,
    }),
  ].flat();
}

function validateProject(project) {
  const errors = [];
  if (!project.id) errors.push('project id is required.');
  if (!project.projectName) errors.push('project name is required.');
  if (!projectTypes.includes(project.projectType)) errors.push(`project type must be one of: ${projectTypes.join(', ')}.`);
  if (!projectStatuses.includes(project.status)) errors.push(`status must be one of: ${projectStatuses.join(', ')}.`);
  if (!Array.isArray(project.validationCommands)) errors.push('validationCommands must be an array.');
  if (!Array.isArray(project.notes)) errors.push('notes must be an array.');
  return { id: project.id, valid: errors.length === 0, errors };
}

function projectStatusRow(project) {
  return {
    id: project.id,
    projectName: project.projectName,
    localPath: project.localPath,
    repoOwner: project.repoOwner,
    repoName: project.repoName,
    branch: project.branch,
    projectType: project.projectType,
    owningAgent: project.owningAgent,
    status: project.status,
    validationStatus: project.validation.validationStatus,
    healthScore: project.health.healthScore,
    riskLevel: project.health.riskLevel,
    releaseReadiness: project.health.releaseReadiness,
    issues: project.health.issues,
  };
}

function writeReport(directory, slug, payload) {
  mkdirSync(directory, { recursive: true });
  const stamp = payload.generatedAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const jsonPath = path.join(directory, `${stamp}-${slug}.json`);
  const mdPath = path.join(directory, `${stamp}-${slug}.md`);
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(mdPath, toMarkdown(payload));
  return [jsonPath, mdPath];
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title ?? 'Project Registry Report'}`, ''];
  Object.entries(payload)
    .filter(([key]) => key !== 'title')
    .forEach(([key, value]) => appendMarkdownValue(lines, labelize(key), value, 2));
  return `${lines.join('\n').trim()}\n`;
}

function appendMarkdownValue(lines, title, value, level) {
  if (Array.isArray(value)) {
    lines.push(`${'#'.repeat(level)} ${title}`, '');
    value.forEach((item) => lines.push(`- ${formatValue(item)}`));
    lines.push('');
    return;
  }
  if (typeof value === 'object' && value !== null) {
    lines.push(`${'#'.repeat(level)} ${title}`, '');
    Object.entries(value).forEach(([key, child]) => lines.push(`- ${labelize(key)}: ${formatValue(child)}`));
    lines.push('');
    return;
  }
  lines.push(`${'#'.repeat(level)} ${title}`, '', String(value ?? ''), '');
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function labelize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function countBy(items, key) {
  return items.reduce((result, item) => {
    const value = String(item[key]);
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});
}

function commandAvailable(command, packageJson) {
  if (!command.startsWith('npm run ')) return true;
  const scriptName = command.replace(/^npm run\s+/, '').split(/\s+/)[0];
  return Boolean(packageJson?.scripts?.[scriptName]);
}

function detectPackageManager(localPath) {
  if (existsSync(path.join(localPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(path.join(localPath, 'yarn.lock'))) return 'yarn';
  if (existsSync(path.join(localPath, 'package-lock.json'))) return 'npm';
  if (existsSync(path.join(localPath, 'package.json'))) return 'npm';
  return 'unknown';
}

function safeJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function git(cwd, args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function normalizeType(value) {
  return projectTypes.includes(value) ? value : 'future_project';
}

function normalizeAgent(value) {
  const allowed = ['Executive', 'Engineering', 'Sales', 'Migration', 'Operations', 'Marketing', 'Future agents'];
  return allowed.includes(value) ? value : 'Engineering';
}

function safetySummary() {
  return {
    localScansOnly: true,
    modifiesProjectFiles: false,
    destructiveCommands: false,
    commitsProjectLocalGeneratedData: false,
    githubWrites: false,
    productionWrites: false,
    secretsCommitted: false,
  };
}
