import type { EngineeringGraph } from '../agents/engineering/engineeringTypes';

export interface ProjectRegistryEntry {
  branch: string;
  healthScore: number;
  id: string;
  lastScan: string;
  localPath: string;
  notes: string[];
  owningAgent: string;
  projectName: string;
  projectType: string;
  releaseReadiness: string;
  repoName: string;
  repoOwner: string;
  status: string;
  validationCommands: string[];
  validationStatus: string;
}

export interface ProjectRegistryDashboardSummary {
  blockedProjects: number;
  commands: string[];
  generatedReports: string[];
  highPriorityProjectIssues: string[];
  indexedProjects: number;
  lastScan: string;
  missingConfig: number;
  missingPaths: number;
  projects: ProjectRegistryEntry[];
  registeredProjects: number;
  releaseReadinessStatus: string;
  safetyStatus: string;
  validationStatus: string;
}

export const projectRegistryCommands = [
  'npm run projects:status',
  'npm run projects:list',
  'npm run projects:scan',
  'npm run projects:health',
  'npm run projects:report',
  'npm run projects:validate',
];

export function buildDashboardProjectRegistrySummary(graph?: EngineeringGraph): ProjectRegistryDashboardSummary {
  const graphProjects = graph?.repositories.map((repo) => ({
    branch: repo.branch || 'unknown',
    healthScore: repo.healthScore ?? 0,
    id: repo.projectId || repo.name,
    lastScan: graph.generatedAt,
    localPath: repo.path,
    notes: repo.dirty ? ['Working tree had local changes during latest scan.'] : [],
    owningAgent: repo.owningAgent || 'Engineering',
    projectName: repo.projectName || repo.name,
    projectType: repo.projectType || 'future_project',
    releaseReadiness: repo.dirty || repo.riskLevel === 'high' ? 'blocked' : repo.riskLevel === 'medium' ? 'watch' : 'ready',
    repoName: repo.repoName || repo.name,
    repoOwner: repo.repoOwner || 'unknown',
    status: repo.status,
    validationCommands: repo.validationCommands || [],
    validationStatus: repo.status === 'indexed' ? 'graph indexed' : 'missing',
  })) ?? [];

  const projects = mergeProjectTemplates(graphProjects);
  const blocked = projects.filter((project) => project.releaseReadiness === 'blocked' || project.status !== 'indexed');
  const missingPaths = projects.filter((project) => ['missing_path', 'missing_git'].includes(project.status)).length;
  const indexedProjects = projects.filter((project) => project.status === 'indexed').length;

  return {
    blockedProjects: blocked.length,
    commands: projectRegistryCommands,
    generatedReports: ['Project Registry Report Markdown', 'Project Registry JSON', 'Multi-Project Health Report Markdown', 'Release Readiness Report Markdown'],
    highPriorityProjectIssues: blocked.slice(0, 4).map((project) => `${project.projectName}: ${project.releaseReadiness}`),
    indexedProjects,
    lastScan: graph?.generatedAt ?? 'Run npm run projects:scan',
    missingConfig: 0,
    missingPaths,
    projects,
    registeredProjects: projects.length,
    releaseReadinessStatus: blocked.length > 0 ? 'Blocked' : indexedProjects > 0 ? 'Ready' : 'Needs scan',
    safetyStatus: 'Local scans only; no project writes; no GitHub writes',
    validationStatus: missingPaths > 0 ? 'watch' : 'pass',
  };
}

function mergeProjectTemplates(scannedProjects: ProjectRegistryEntry[]): ProjectRegistryEntry[] {
  const byId = new Map(scannedProjects.map((project) => [project.id, project]));
  return defaultProjects.map((project) => byId.get(project.id) ?? project);
}

const defaultProjects: ProjectRegistryEntry[] = [
  project('vyra-agents', 'Vyra Agents', 'agent_runtime', 'Executive', 'vyra-agents', '/Volumes/Install macOS Sequoia/Vyra Agents'),
  project('vyra-mobile-backend', 'Vyra mobile app / backend', 'mobile_app_backend', 'Engineering', 'Vyra-Part-1', '/Users/vyra/Documents/Vyra-Part-1'),
  project('vyra-desktop-software', 'Vyra desktop software', 'desktop_software', 'Engineering', 'Vyra-Part-1-Desktop-App', '/Users/vyra/Documents/Vyra-Software/Vyra-Part-1-Desktop-App'),
  project('vyra-website', 'Vyra website', 'website', 'Sales', 'vyra-website', '/Users/vyra/Documents/Vyra-website'),
  project('valor-solutions-website', 'Valor Solutions website', 'client_website', 'Sales', 'Valor-Solutions-Website', '/Volumes/Install macOS Sequoia/Valor-Solutions-Website'),
  {
    ...project('future-projects', 'Future projects', 'future_project', 'Executive', 'future-projects', 'Add local path in ignored project config'),
    branch: 'tbd',
    healthScore: 0,
    releaseReadiness: 'planned',
    status: 'planned',
    validationStatus: 'planned',
  },
];

function project(id: string, projectName: string, projectType: string, owningAgent: string, repoName: string, localPath: string): ProjectRegistryEntry {
  return {
    branch: 'main',
    healthScore: 0,
    id,
    lastScan: 'Run npm run projects:scan',
    localPath,
    notes: [],
    owningAgent,
    projectName,
    projectType,
    releaseReadiness: 'Needs scan',
    repoName,
    repoOwner: 'unpaidintern9',
    status: 'configured',
    validationCommands: [],
    validationStatus: 'not run',
  };
}
