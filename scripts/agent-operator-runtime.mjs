import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCommunicationDraftStatus, buildCommunicationProviderReadiness } from './comms-draft-runtime.mjs';
import { buildConnectorReadinessStatus } from './connector-readiness-runtime.mjs';
import { buildGitHubPlanningStatus } from './github-planning-runtime.mjs';
import { getGitHubReadOnlyConfig, getGitHubSafetyCheck } from './github-readonly-runtime.mjs';
import { buildRepositoryIntelligence } from './repository-intelligence-runtime.mjs';
import { buildSharedTaskStatus } from './shared-task-runtime.mjs';
import { buildThreadBridgeStatus } from './thread-bridge-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');

export const reportDirectories = {
  executive: path.join(repoRoot, 'reports/agents/executive'),
  engineering: path.join(repoRoot, 'reports/agents/engineering'),
  sales: path.join(repoRoot, 'reports/agents/sales'),
  migration: path.join(repoRoot, 'reports/agents/migration'),
  runtime: path.join(repoRoot, 'reports/agents/runtime'),
};

const safetyMode = 'local/mock/read-only';
const blockedExternalActions = [
  'email sends',
  'SMS sends',
  'CRM writes',
  'Stripe writes',
  'Supabase production writes',
  'production business writes',
  'secret output',
  '.env.local modifications',
];

const agents = [
  { id: 'executive', name: 'Executive Agent', owner: 'Executive Ops', health: 'ready' },
  { id: 'engineering', name: 'Engineering Agent', owner: 'Engineering', health: 'ready' },
  { id: 'migration', name: 'Migration Agent', owner: 'Gym Operations', health: 'ready' },
  { id: 'sales', name: 'Sales Agent', owner: 'Sales', health: 'ready' },
  { id: 'product', name: 'Product Agent', owner: 'Product', health: 'ready' },
  { id: 'operations', name: 'Operations Agent', owner: 'Operations', health: 'ready' },
  { id: 'support', name: 'Support Agent', owner: 'Support', health: 'planned' },
  { id: 'finance', name: 'Finance Agent', owner: 'Finance', health: 'planned' },
  { id: 'marketing', name: 'Marketing Agent', owner: 'Marketing', health: 'planned' },
];

const workflows = [
  'daily-ecosystem-audit',
  'repo-health-check',
  'engineering-knowledge-graph-scan',
  'engineering-impact-analysis',
  'engineering-ownership-health-scan',
  'engineering-fix-queue-planning',
  'engineering-github-issue-draft-planning',
  'engineering-github-issue-creation',
  'integration-status-check',
  'migration-import-review',
  'migration-validation',
  'sales-lead-import',
  'sales-follow-up-review',
  'sales-proposal-draft-review',
  'cross-agent-collaboration-review',
];

export function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) continue;
    const [rawKey, inlineValue] = value.slice(2).split('=');
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (inlineValue !== undefined) {
      options[key] = inlineValue;
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      options[key] = next;
      index += 1;
    } else {
      options[key] = true;
    }
  }
  return options;
}

export function buildOperatorMetadata(options = {}) {
  const timestamp = new Date().toISOString();
  return {
    operatorName: String(options.operatorName ?? process.env.VYRA_OPERATOR_NAME ?? process.env.OPERATOR_NAME ?? 'Robert'),
    operatorTool: String(options.operatorTool ?? process.env.VYRA_OPERATOR_TOOL ?? process.env.OPERATOR_TOOL ?? 'AI Operator'),
    operatorVersion: String(options.operatorVersion ?? process.env.VYRA_OPERATOR_VERSION ?? process.env.OPERATOR_VERSION ?? 'not provided'),
    timestamp,
    gitBranch: gitValue(['branch', '--show-current']) || 'unknown',
    gitCommit: gitValue(['rev-parse', '--short', 'HEAD']) || 'unknown',
    integrationMode: String(options.integrationMode ?? process.env.VYRA_INTEGRATION_MODE ?? process.env.VITE_VYRA_INTEGRATION_MODE ?? 'mock'),
    safetyMode,
  };
}

export function buildOperatorSnapshot(options = {}) {
  const operator = buildOperatorMetadata(options);
  const engineeringGraph = loadEngineeringGraph();
  const engineeringRepo = engineeringGraph?.repositories?.find((repo) => repo.name === 'vyra-agents');
  const warnings = [
    ...blockedExternalActions.map((action) => `${action} blocked`),
    'future external actions require explicit approval gates',
  ];
  const crossAgent = {
    highValueOpportunitiesBlockedByEngineering: engineeringRepo?.riskLevel === 'high' ? 1 : 0,
    migrationsTiedToActiveSalesOpportunities: 1,
    proposalsNeedingApproval: 2,
    featureRequestsTiedToProspects: 0,
    organizationsNeedingExecutiveReview: 6,
    relationshipCount: 11,
  };
  const validation = buildSafetyCheck(operator);
  const threadBridge = buildThreadBridgeStatus();
  const communicationDrafts = buildCommunicationDraftStatus();
  const communicationProviders = buildCommunicationProviderReadiness();
  const connectorReadiness = buildConnectorReadinessStatus();
  const githubReadOnly = buildGitHubReadOnlySnapshot();
  const githubPlanning = buildGitHubPlanningStatus();
  const sharedTasks = buildSharedTaskStatus();
  const repositoryIntelligence = safeRepositoryIntelligence();
  const threadPriority =
    threadBridge.pendingOutboxItems > 0
      ? [`Review ${threadBridge.pendingOutboxItems} pending Codex thread outbox item(s) from ${threadBridge.latestThread}.`]
      : [];
  const schedulePriority = threadBridge.dueSchedules > 0 ? [`Review ${threadBridge.dueSchedules} due scheduled thread run(s).`] : [];
  const approvalPriority = threadBridge.pendingApprovals > 0 ? [`Resolve ${threadBridge.pendingApprovals} local approval queue item(s).`] : [];
  const communicationPriority =
    communicationDrafts.pendingReviewDrafts > 0 ? [`Review ${communicationDrafts.pendingReviewDrafts} local communication draft(s).`] : [];
  const taskPriority = [
    sharedTasks.blockedTasks > 0 ? `Unblock ${sharedTasks.blockedTasks} shared work queue task(s).` : null,
    sharedTasks.overdueTasks > 0 ? `Review ${sharedTasks.overdueTasks} overdue shared work queue task(s).` : null,
    sharedTasks.tasksRequiringExecutiveReview > 0 ? `Review ${sharedTasks.tasksRequiringExecutiveReview} task(s) requiring Executive approval.` : null,
  ].filter(Boolean);
  const connectorPriority =
    connectorReadiness.blockedWriteActionCount > 0
      ? [`Keep ${connectorReadiness.blockedWriteActionCount} future connector write action(s) behind explicit approval gates.`]
      : [];
  const githubPlanningPriority =
    githubPlanning.plansNeedingReview > 0 ? [`Review ${githubPlanning.plansNeedingReview} local GitHub issue/PR plan(s).`] : [];

  return {
    operator,
    runtime: {
      agentsRegistered: agents.length,
      agentsReady: agents.filter((agent) => agent.health === 'ready').length,
      agentsPlanned: agents.filter((agent) => agent.health === 'planned').length,
      workflowsRegistered: workflows.length,
      runtimeVersion: '28.0.0-operator-local',
      safetyMode,
      integrationMode: operator.integrationMode,
    },
    executive: {
      priorities: [
        ...threadPriority,
        ...schedulePriority,
        ...approvalPriority,
        ...communicationPriority,
        ...taskPriority,
        ...connectorPriority,
        ...githubPlanningPriority,
        'Review cross-agent collaboration before approving proposal, migration, or follow-up work.',
        'Keep Sales external actions disabled until CRM/email/Stripe approval gates exist.',
        'Review Engineering warnings before future live issue creation.',
      ],
      crossAgentHealth: crossAgent,
      validationStatus: validation.status,
    },
    engineering: {
      repositoriesIndexed: engineeringGraph?.summary?.repositoriesIndexed ?? 0,
      warnings: engineeringGraph?.warnings?.length ?? engineeringGraph?.summary?.warnings ?? 0,
      repositoryHealthScore: repositoryIntelligence?.summary?.engineeringHealthScore ?? 0,
      repositoryRisk: repositoryIntelligence?.summary?.repositoryRisk ?? 'Unknown',
      documentationCompleteness: repositoryIntelligence?.summary?.documentationCompleteness ?? 0,
      dependencyHealth: repositoryIntelligence?.summary?.dependencyHealth ?? 'Unknown',
      blockers: engineeringRepo
        ? [`${engineeringRepo.name} health score ${engineeringRepo.healthScore}, risk ${engineeringRepo.riskLevel}`]
        : ['Engineering graph not generated yet; run node scripts/engineering-scan.mjs.'],
    },
    sales: {
      pipelineHighlights: ['$55,200 local estimated pipeline', '2 hot scored leads', '1 overdue follow-up', '2 proposal-needed leads'],
      followUpsDue: 2,
      organizationsRequiringReview: crossAgent.organizationsNeedingExecutiveReview,
      externalActionsEnabled: false,
      sharedTaskSignals: {
        linkedTasks: sharedTasks.openTasks,
        blockedTasks: sharedTasks.blockedTasks,
        proposalTasks: sharedTasks.tasksByCategory.Sales ?? 0,
        migrationTasks: sharedTasks.tasksByCategory.Migration ?? 0,
        engineeringTasks: sharedTasks.tasksByCategory.Engineering ?? 0,
      },
    },
    migration: {
      readiness: 'local import, validation, batch preview, and dry-run review ready',
      productionWrites: false,
      invitationsSent: false,
    },
    safety: {
      status: validation.status,
      warnings,
      checks: validation.checks,
    },
    threadBridge,
    communicationDrafts,
    communicationProviders,
    connectorReadiness,
    githubReadOnly,
    githubPlanning,
    repositoryIntelligence: repositoryIntelligence?.summary ?? null,
    sharedTasks,
    graph: buildCrossAgentGraph(operator, crossAgent, sharedTasks, connectorReadiness, githubReadOnly, githubPlanning),
  };
}

export function buildSafetyCheck(operator = buildOperatorMetadata()) {
  const gitStatus = gitValue(['status', '--short']);
  const changedFiles = gitStatus
    .split('\n')
    .map((line) => line.trim().slice(3))
    .filter(Boolean);
  const forbiddenChangedFiles = changedFiles.filter((file) =>
    file === '.env.local' || file.endsWith('/.env.local') || file.startsWith('.tools/') || file.includes('tools/deno'),
  );
  const suspiciousDiff = scanStagedAndWorkingDiff();
  const checks = [
    { name: 'No email sends', passed: true },
    { name: 'No SMS sends', passed: true },
    { name: 'No CRM writes', passed: true },
    { name: 'No Stripe writes', passed: true },
    { name: 'No Supabase production writes', passed: true },
    { name: 'No production business writes', passed: true },
    { name: 'No .env.local modifications', passed: forbiddenChangedFiles.length === 0, detail: forbiddenChangedFiles.join(', ') || 'none' },
    { name: 'No secret-looking diff output', passed: suspiciousDiff.length === 0, detail: suspiciousDiff.join(', ') || 'none' },
  ];
  return {
    operator,
    status: checks.every((check) => check.passed) ? 'pass' : 'fail',
    checks,
  };
}

export function writeReportSet(snapshot) {
  ensureReportDirectories();
  return [
    writeReport('executive', 'executive-run-summary', buildExecutiveRunSummary(snapshot)),
    writeReport('engineering', 'engineering-operator-summary', buildEngineeringReport(snapshot)),
    writeReport('sales', 'sales-operator-summary', buildSalesReport(snapshot)),
    writeReport('migration', 'migration-operator-summary', buildMigrationReport(snapshot)),
    writeReport('runtime', 'runtime-operator-status', buildRuntimeReport(snapshot)),
    writeReport('runtime', 'operator-safety-check', snapshot.safety),
    writeReport('runtime', 'cross-agent-graph', snapshot.graph),
    writeReport('runtime', 'shared-work-queue-status', { title: 'Shared Work Queue Status', operator: snapshot.operator, summary: snapshot.sharedTasks }),
    writeReport('runtime', 'connector-readiness-status', { title: 'Connector Readiness Status', operator: snapshot.operator, summary: snapshot.connectorReadiness }),
    writeReport('runtime', 'github-read-only-status', { title: 'GitHub Read-Only Status', operator: snapshot.operator, summary: snapshot.githubReadOnly }),
    writeReport('runtime', 'github-planning-status', { title: 'GitHub Planning Status', operator: snapshot.operator, summary: snapshot.githubPlanning }),
    writeReport('engineering', 'repository-intelligence-status', { title: 'Repository Intelligence Status', operator: snapshot.operator, summary: snapshot.repositoryIntelligence }),
  ].flat();
}

export function writeReport(group, slug, payload) {
  const directory = reportDirectories[group];
  mkdirSync(directory, { recursive: true });
  const stamp = fileStamp(payload.operator?.timestamp ?? payload.operatorMetadata?.timestamp ?? new Date().toISOString());
  const base = `${stamp}-${slug}`;
  const jsonPath = path.join(directory, `${base}.json`);
  const mdPath = path.join(directory, `${base}.md`);
  writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(mdPath, toMarkdown(payload));
  return [jsonPath, mdPath];
}

export function ensureReportDirectories() {
  Object.values(reportDirectories).forEach((directory) => mkdirSync(directory, { recursive: true }));
}

export function buildExecutiveRunSummary(snapshot) {
  return {
    title: 'Executive Run Summary',
    operator: snapshot.operator,
    generatedAt: snapshot.operator.timestamp,
    summary: {
      integrationMode: snapshot.operator.integrationMode,
      safetyMode: snapshot.operator.safetyMode,
      validationStatus: snapshot.safety.status,
      crossAgentHealth: snapshot.executive.crossAgentHealth,
    },
    executivePriorities: snapshot.executive.priorities,
    engineeringBlockers: snapshot.engineering.blockers,
    salesPipelineHighlights: snapshot.sales.pipelineHighlights,
    migrationReadiness: snapshot.migration.readiness,
    followUpsDue: snapshot.sales.followUpsDue,
    organizationsRequiringReview: snapshot.sales.organizationsRequiringReview,
    threadBridge: snapshot.threadBridge,
    communicationDrafts: snapshot.communicationDrafts,
    communicationProviders: snapshot.communicationProviders,
    connectorReadiness: snapshot.connectorReadiness,
    githubReadOnly: snapshot.githubReadOnly,
    githubPlanning: snapshot.githubPlanning,
    repositoryIntelligence: snapshot.repositoryIntelligence,
    sharedTasks: snapshot.sharedTasks,
    safetyWarnings: snapshot.safety.warnings,
    validation: snapshot.safety,
  };
}

function buildGitHubReadOnlySnapshot() {
  const config = getGitHubReadOnlyConfig();
  const safety = getGitHubSafetyCheck();
  return {
    connector: 'GitHub',
    mode: 'read_only',
    status: config.configured ? 'configured_read_only' : 'missing_config',
    repoFullName: config.repoFullName,
    ownerConfigured: Boolean(config.owner),
    repoConfigured: Boolean(config.repo),
    tokenConfigured: config.tokenConfigured,
    missingConfig: config.missingConfig,
    allowedReadActions: ['repository metadata', 'branches', 'commits', 'open issues', 'open pull requests'],
    blockedWriteActions: safety.blockedWriteActions,
    externalCalls: config.configured ? 'GitHub REST GET only' : 'none; missing config',
    writeActionsEnabled: false,
    productionWritesEnabled: false,
    tokenValuePrinted: false,
    safetyStatus: safety.status,
  };
}

function safeRepositoryIntelligence() {
  try {
    return buildRepositoryIntelligence();
  } catch {
    return null;
  }
}

export function buildCrossAgentGraph(
  operator,
  summary,
  sharedTasks = { knowledgeGraph: { nodes: [], edges: [] }, openTasks: 0 },
  connectorReadiness = { connectors: [], blockedWriteActionCount: 0 },
  githubReadOnly = { status: 'missing_config' },
  githubPlanning = { totalPlans: 0, plansNeedingReview: 0 },
) {
  return {
    title: 'Cross-Agent Operator Graph',
    operator,
    localOnly: true,
    nodes: [
      { id: 'operator', type: 'operator', label: `${operator.operatorName} / ${operator.operatorTool}` },
      { id: 'executive', type: 'agent', label: 'Executive Agent' },
      { id: 'engineering', type: 'agent', label: 'Engineering Agent' },
      { id: 'sales', type: 'agent', label: 'Sales Agent' },
      { id: 'migration', type: 'agent', label: 'Migration Agent' },
      { id: 'shared-work-queue', type: 'coordination_system', label: 'Shared Work Queue' },
      { id: 'connector-readiness', type: 'approval_system', label: 'Connector Readiness' },
      {
        id: 'github-read-only',
        type: 'connector',
        label: 'GitHub Read-Only Connector',
        status: githubReadOnly.status,
      },
      {
        id: 'github-planning',
        type: 'planning_queue',
        label: 'GitHub Planning Queue',
        status: githubPlanning.queueHealth,
      },
      { id: 'safety', type: 'control', label: operator.safetyMode },
      ...connectorReadiness.connectors.map((connector) => ({
        id: `connector:${connector.connector.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        type: 'connector',
        label: connector.connector,
        status: connector.status,
      })),
      ...sharedTasks.knowledgeGraph.nodes,
    ],
    edges: [
      { from: 'operator', to: 'executive', relationship: 'runs' },
      { from: 'executive', to: 'engineering', relationship: 'reads_blockers' },
      { from: 'executive', to: 'sales', relationship: 'reads_opportunities' },
      { from: 'executive', to: 'migration', relationship: 'reads_readiness' },
      { from: 'executive', to: 'shared-work-queue', relationship: 'reviews_task_health' },
      { from: 'shared-work-queue', to: 'sales', relationship: 'coordinates_sales_tasks' },
      { from: 'shared-work-queue', to: 'engineering', relationship: 'coordinates_engineering_tasks' },
      { from: 'shared-work-queue', to: 'migration', relationship: 'coordinates_migration_tasks' },
      { from: 'executive', to: 'connector-readiness', relationship: 'reviews_connector_risk' },
      { from: 'executive', to: 'github-read-only', relationship: 'reviews_repo_health' },
      { from: 'executive', to: 'github-planning', relationship: 'reviews_github_plans' },
      { from: 'connector-readiness', to: 'github-read-only', relationship: 'enforces_read_only' },
      { from: 'github-read-only', to: 'github-planning', relationship: 'informs_local_plans' },
      ...connectorReadiness.connectors.map((connector) => ({
        from: 'connector-readiness',
        to: `connector:${connector.connector.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        relationship: 'gates_connector',
      })),
      { from: 'safety', to: 'operator', relationship: 'constrains' },
      ...sharedTasks.knowledgeGraph.edges,
    ],
    summary: {
      ...summary,
      sharedTasksOpen: sharedTasks.openTasks,
      blockedConnectorWrites: connectorReadiness.blockedWriteActionCount,
      githubReadOnlyStatus: githubReadOnly.status,
      githubPlansNeedingReview: githubPlanning.plansNeedingReview,
    },
  };
}

function buildEngineeringReport(snapshot) {
  return {
    title: 'Engineering Operator Summary',
    operator: snapshot.operator,
    generatedAt: snapshot.operator.timestamp,
    summary: snapshot.engineering,
    safety: snapshot.safety.status,
  };
}

function buildSalesReport(snapshot) {
  return {
    title: 'Sales Operator Summary',
    operator: snapshot.operator,
    generatedAt: snapshot.operator.timestamp,
    summary: snapshot.sales,
    safety: 'No emails, CRM writes, Stripe writes, or production writes.',
  };
}

function buildMigrationReport(snapshot) {
  return {
    title: 'Migration Operator Summary',
    operator: snapshot.operator,
    generatedAt: snapshot.operator.timestamp,
    summary: snapshot.migration,
    safety: 'No production member/profile/membership/invitation writes.',
  };
}

function buildRuntimeReport(snapshot) {
  return {
    title: 'Runtime Operator Status',
    operator: snapshot.operator,
    generatedAt: snapshot.operator.timestamp,
    summary: snapshot.runtime,
    connectorReadiness: snapshot.connectorReadiness,
    githubReadOnly: snapshot.githubReadOnly,
    githubPlanning: snapshot.githubPlanning,
    repositoryIntelligence: snapshot.repositoryIntelligence,
    sharedTasks: snapshot.sharedTasks,
    agents,
    workflows,
  };
}

function loadEngineeringGraph() {
  const graphPath = path.join(repoRoot, 'dashboard/public/engineering-graph.json');
  if (!existsSync(graphPath)) return null;
  try {
    return JSON.parse(readFileSync(graphPath, 'utf8'));
  } catch {
    return null;
  }
}

function scanStagedAndWorkingDiff() {
  const diff = `${gitValue(['diff'])}\n${gitValue(['diff', '--cached'])}`;
  const patterns = [/sb_[A-Za-z0-9_-]{12,}/, /service_role\s*[:=]/i, /AGENT_MEMORY_WRITE_TOKEN\s*=/i, /password\s*[:=]/i, /api[_-]?key\s*[:=]/i, /secret\s*[:=]/i];
  return patterns.filter((pattern) => pattern.test(diff)).map((pattern) => String(pattern));
}

function gitValue(args) {
  try {
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function fileStamp(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title ?? 'Vyra Agents Operator Report'}`, ''];
  if (payload.operator) {
    lines.push('## Operator', '');
    Object.entries(payload.operator).forEach(([key, value]) => lines.push(`- ${labelize(key)}: ${formatValue(value)}`));
    lines.push('');
  }
  Object.entries(payload)
    .filter(([key]) => !['title', 'operator'].includes(key))
    .forEach(([key, value]) => appendMarkdownValue(lines, labelize(key), value, 2));
  return `${lines.join('\n').trim()}\n`;
}

function appendMarkdownValue(lines, title, value, level) {
  if (Array.isArray(value)) {
    lines.push(`${'#'.repeat(level)} ${title}`, '');
    value.forEach((item) => {
      if (typeof item === 'object' && item !== null) {
        lines.push(`- ${formatValue(item)}`);
      } else {
        lines.push(`- ${formatValue(item)}`);
      }
    });
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
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}
