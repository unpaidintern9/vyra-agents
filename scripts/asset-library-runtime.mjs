import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSharedMemoryStore } from './shared-memory-runtime.mjs';
import { listSharedTasks } from './shared-task-runtime.mjs';
import { getExecutivePlanningSummary } from './executive-planning-runtime.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
export const assetRoot = path.join(repoRoot, 'codex-agent-threads/shared/assets');
const reportsRoot = path.join(assetRoot, 'reports');
const files = {
  assets: path.join(assetRoot, 'assets.json'),
  knowledge: path.join(assetRoot, 'knowledge.json'),
  versions: path.join(assetRoot, 'versions.json'),
  approvals: path.join(assetRoot, 'approvals.json'),
  usage: path.join(assetRoot, 'usage.json'),
};

const safety = {
  localOnly: true,
  autonomousPublishing: false,
  externalFileUploads: false,
  automaticAssetReplacement: false,
  automaticApprovals: false,
  cloudSynchronization: false,
  externalStorageProviders: false,
  autonomousDistribution: false,
  versionHistoryPreserved: true,
  auditHistoryPreserved: true,
};

export function listAssets() {
  const store = readAssetStore();
  return { title: 'Asset Library', generatedAt: stamp(), assets: store.assets, summary: summarizeAssets(store), safety };
}

export function addAsset(options = {}) {
  const store = readAssetStore();
  const now = stamp();
  const title = process.env.ASSET_TITLE ?? options.title ?? 'Local Asset Reference';
  const asset = assetRecord({
    id: slug(`asset-${title}`),
    title,
    description: process.env.ASSET_DESCRIPTION ?? options.description ?? 'Operator-created local asset metadata record.',
    category: process.env.ASSET_CATEGORY ?? options.category ?? 'Operations',
    assetType: process.env.ASSET_TYPE ?? options.assetType ?? 'internal documentation',
    owner: process.env.ASSET_OWNER ?? options.owner ?? 'Operator',
    status: 'Draft',
    approvalStatus: 'Draft',
    localFileReference: process.env.ASSET_FILE ?? options.localFileReference ?? 'docs/ASSET_LIBRARY.md',
    tags: csv(process.env.ASSET_TAGS ?? options.tags ?? 'local,asset-library'),
    keywords: csv(process.env.ASSET_KEYWORDS ?? options.keywords ?? 'asset,library'),
    products: csv(process.env.ASSET_PRODUCTS ?? options.products ?? ''),
    audiences: csv(process.env.ASSET_AUDIENCES ?? options.audiences ?? 'internal operators'),
    campaigns: csv(process.env.ASSET_CAMPAIGNS ?? options.campaigns ?? ''),
    organizations: csv(process.env.ASSET_ORGANIZATIONS ?? options.organizations ?? 'Vyra internal operations'),
    createdDate: now,
    updatedDate: now,
  });
  const version = versionRecord(asset, '1.0.0', 'Created local asset metadata record.', now, null);
  const approval = approvalRecord(asset, 'Draft', 'Created locally; human review required before approval.', now);
  const usage = usageRecord(asset.assetId, ['Operator'], ['manual asset library entry'], now);
  writeAssetStore({
    ...store,
    assets: [asset, ...store.assets.filter((item) => item.assetId !== asset.assetId)],
    versions: [version, ...store.versions],
    approvals: [approval, ...store.approvals],
    usage: [usage, ...store.usage.filter((item) => item.assetId !== asset.assetId)],
  });
  return { title: 'Asset Added', generatedAt: now, asset, version, approval, safety };
}

export function updateAsset() {
  return transitionAsset('Under Review', 'asset_updated', 'Asset metadata updated locally and moved under review.');
}

export function searchAssets(options = {}) {
  const store = readAssetStore();
  const query = String(process.env.ASSET_SEARCH ?? options.query ?? '').trim().toLowerCase();
  const results = query
    ? store.assets.filter((asset) => searchableAssetText(asset).includes(query))
    : store.assets;
  return {
    title: 'Asset Search',
    generatedAt: stamp(),
    query: query || 'all',
    results,
    relatedSuggestions: relatedAssetSuggestions(store, results[0]?.assetId),
    safety,
  };
}

export function approveAsset() {
  return transitionAsset('Approved', 'asset_approved', 'Asset approved locally for internal reference only.');
}

export function archiveAsset() {
  return transitionAsset('Archived', 'asset_archived', 'Asset archived locally; history preserved.');
}

export function getAssetVersions() {
  const store = readAssetStore();
  return { title: 'Asset Version History', generatedAt: stamp(), versions: store.versions, safety };
}

export function getAssetUsage() {
  const store = readAssetStore();
  return { title: 'Asset Usage Overview', generatedAt: stamp(), usage: store.usage, safety };
}

export function getKnowledgeLibrary() {
  const store = readAssetStore();
  return { title: 'Knowledge Library', generatedAt: stamp(), knowledge: store.knowledge, summary: summarizeKnowledge(store), safety };
}

export function buildAssetReports() {
  const store = readAssetStore();
  const reports = {
    'asset-inventory-report': { title: 'Asset Inventory Report', generatedAt: stamp(), summary: summarizeAssets(store), assets: store.assets, safety },
    'knowledge-library-report': { title: 'Knowledge Library Report', generatedAt: stamp(), summary: summarizeKnowledge(store), knowledge: store.knowledge, safety },
    'asset-usage-report': { title: 'Asset Usage Report', generatedAt: stamp(), usage: store.usage, safety },
    'approval-status-report': { title: 'Approval Status Report', generatedAt: stamp(), approvals: store.approvals, safety },
    'version-history-report': { title: 'Version History Report', generatedAt: stamp(), versions: store.versions, safety },
    'product-asset-coverage': { title: 'Product Asset Coverage', generatedAt: stamp(), rows: coverageBy(store.assets, 'products'), safety },
    'marketing-asset-summary': { title: 'Marketing Asset Summary', generatedAt: stamp(), rows: store.assets.filter((asset) => asset.category === 'Marketing' || asset.usageReferences.includes('Marketing')), safety },
    'sales-resource-summary': { title: 'Sales Resource Summary', generatedAt: stamp(), rows: store.assets.filter((asset) => asset.category === 'Sales' || asset.usageReferences.includes('Sales')), safety },
    'executive-knowledge-summary': { title: 'Executive Knowledge Summary', generatedAt: stamp(), rows: store.knowledge.filter((item) => item.category === 'Executive' || item.usageReferences.includes('Executive')), safety },
  };
  return {
    title: 'Asset Library Reports Generated',
    generatedAt: stamp(),
    written: Object.entries(reports).map(([slugName, payload]) => writeReport(slugName, payload)),
    safety,
  };
}

export function validateAssets() {
  const store = readAssetStore();
  const errors = [];
  const requiredCommands = ['assets:list', 'assets:add', 'assets:update', 'assets:search', 'assets:approve', 'assets:archive', 'assets:versions', 'assets:usage', 'assets:knowledge', 'assets:report', 'assets:validate'];
  const requiredReports = ['asset-inventory-report', 'knowledge-library-report', 'asset-usage-report', 'approval-status-report', 'version-history-report', 'product-asset-coverage', 'marketing-asset-summary', 'sales-resource-summary', 'executive-knowledge-summary'];
  if (!store.assets.length) errors.push('asset records missing');
  if (!store.knowledge.length) errors.push('knowledge records missing');
  if (!store.versions.length) errors.push('version history missing');
  if (!store.approvals.length) errors.push('approval records missing');
  if (!store.usage.length) errors.push('usage records missing');
  if (store.assets.some((asset) => !asset.localFileReference || asset.duplicatedAsset === true)) errors.push('assets must reference local files without duplication');
  if (store.assets.some((asset) => !Array.isArray(asset.auditHistory) || !asset.auditHistory.length)) errors.push('asset audit history missing');
  if (store.knowledge.some((item) => !Array.isArray(item.auditHistory) || !item.auditHistory.length)) errors.push('knowledge audit history missing');
  buildAssetReports();
  for (const report of requiredReports) {
    if (!existsSync(path.join(reportsRoot, `${report}.json`)) || !existsSync(path.join(reportsRoot, `${report}.md`))) errors.push(`report missing: ${report}`);
  }
  return {
    title: 'Asset Library Validation',
    generatedAt: stamp(),
    status: errors.length ? 'fail' : 'pass',
    errors,
    commands: requiredCommands,
    storageRoot: 'codex-agent-threads/shared/assets',
    summary: summarizeAssets(store),
    knowledgeSummary: summarizeKnowledge(store),
    reportCount: requiredReports.length,
    integrations: ['Shared Memory', 'Universal Task Engine', 'Executive Planning', 'Marketing', 'Marketing Content Studio', 'Sales'],
    safety,
  };
}

export function readAssetStore() {
  ensureAssetStorage();
  return {
    assets: readJson(files.assets, []),
    knowledge: readJson(files.knowledge, []),
    versions: readJson(files.versions, []),
    approvals: readJson(files.approvals, []),
    usage: readJson(files.usage, []),
  };
}

function writeAssetStore(store) {
  ensureAssetStorage(false);
  writeJson(files.assets, store.assets);
  writeJson(files.knowledge, store.knowledge);
  writeJson(files.versions, store.versions);
  writeJson(files.approvals, store.approvals);
  writeJson(files.usage, store.usage);
}

function ensureAssetStorage(seed = true) {
  mkdirSync(assetRoot, { recursive: true });
  mkdirSync(reportsRoot, { recursive: true });
  if (seed && Object.values(files).some((file) => !existsSync(file))) seedAssetStore();
}

function seedAssetStore() {
  const now = stamp();
  const memory = buildSharedMemoryStore();
  const tasks = listSharedTasks();
  const planning = getExecutivePlanningSummary();
  const taskIds = tasks.tasks?.slice(0, 4).map((task) => task.taskId ?? task.id).filter(Boolean) ?? [];
  const goalIds = planning.goals?.slice(0, 3).map((goal) => goal.goalId).filter(Boolean) ?? [];
  const assets = [
    assetRecord({ id: 'asset-brand-dashboard-mark', title: 'Vyra Dashboard Brand Mark', description: 'Confirmed local V brand mark used by the dashboard.', category: 'Brand', assetType: 'logo mark', owner: 'Marketing', status: 'Approved', approvalStatus: 'Approved', localFileReference: 'dashboard/src/styles.css', relativeProjectPath: 'dashboard/src/styles.css', previewReference: '.brand-mark', fileType: 'css reference', tags: ['brand', 'logo', 'dashboard'], keywords: ['vyra', 'brand mark', 'logo'], products: ['Vyra Performance'], audiences: ['internal operators'], campaigns: ['camp-athlete-app-foundation'], organizations: ['Vyra internal operations'], linkedTasks: taskIds.slice(0, 1), linkedGoals: goalIds.slice(0, 1), usageReferences: ['Marketing', 'Executive', 'Sales'], createdDate: now, updatedDate: now }),
    assetRecord({ id: 'asset-brand-design-tokens', title: 'Dashboard Design Tokens', description: 'Local color, typography, radius, and surface references for consistent dashboard UI.', category: 'Brand', assetType: 'design tokens', owner: 'Marketing', status: 'Approved', approvalStatus: 'Approved', localFileReference: 'dashboard/src/styles.css', relativeProjectPath: 'dashboard/src/styles.css', previewReference: ':root and dashboard classes', fileType: 'css reference', tags: ['brand', 'colors', 'typography'], keywords: ['tokens', 'accent', 'surface'], products: ['Vyra Performance'], audiences: ['internal operators'], campaigns: ['camp-athlete-app-foundation'], organizations: ['Vyra internal operations'], linkedTasks: taskIds.slice(0, 1), linkedGoals: goalIds.slice(0, 1), usageReferences: ['Marketing', 'Engineering'], createdDate: now, updatedDate: now }),
    assetRecord({ id: 'asset-marketing-content-studio-doc', title: 'Marketing Content Studio Guide', description: 'Phase 56 guide for local draft generation and approval-safe marketing workflows.', category: 'Marketing', assetType: 'internal guide', owner: 'Marketing', status: 'Approved', approvalStatus: 'Approved', localFileReference: 'docs/MARKETING_CONTENT_STUDIO.md', relativeProjectPath: 'docs/MARKETING_CONTENT_STUDIO.md', fileType: 'markdown', tags: ['marketing', 'content studio', 'drafts'], keywords: ['draft generation', 'brand checks'], products: ['Vyra Performance'], audiences: ['marketing operators', 'sales'], campaigns: ['camp-gym-growth-readiness'], organizations: ['Vyra internal operations'], relatedDocuments: ['docs/BRAND_CONSISTENCY_CHECKS.md', 'docs/MARKETING_DRAFT_APPROVALS.md'], linkedTasks: taskIds.slice(0, 2), linkedGoals: goalIds.slice(0, 1), usageReferences: ['Marketing', 'Sales', 'Executive'], createdDate: now, updatedDate: now }),
    assetRecord({ id: 'asset-sales-agent-guide', title: 'Sales Agent Guide', description: 'Local Sales Agent operating guide with CRM, intelligence, and workflow references.', category: 'Sales', assetType: 'playbook', owner: 'Sales', status: 'Approved', approvalStatus: 'Approved', localFileReference: 'docs/SALES_AGENT.md', relativeProjectPath: 'docs/SALES_AGENT.md', fileType: 'markdown', tags: ['sales', 'playbook', 'local crm'], keywords: ['sales', 'opportunities', 'workflow'], products: ['Sales/CRM tools'], audiences: ['sales operators'], campaigns: ['camp-gym-growth-readiness'], organizations: ['Louisville fitness prospects'], linkedTasks: taskIds, linkedGoals: goalIds.slice(0, 2), usageReferences: ['Sales', 'Operator', 'Executive'], createdDate: now, updatedDate: now }),
    assetRecord({ id: 'asset-executive-planning-doc', title: 'Executive Planning Guide', description: 'Local Executive planning and goal-management reference.', category: 'Executive', assetType: 'planning doc', owner: 'Executive', status: 'Approved', approvalStatus: 'Approved', localFileReference: 'docs/EXECUTIVE_AGENT.md', relativeProjectPath: 'docs/EXECUTIVE_AGENT.md', fileType: 'markdown', tags: ['executive', 'planning', 'goals'], keywords: ['kpi', 'roadmap', 'approval'], products: ['Vyra Performance'], audiences: ['executive operators'], campaigns: [], organizations: ['Vyra internal operations'], linkedTasks: taskIds.slice(0, 1), linkedGoals: goalIds, usageReferences: ['Executive', 'Operator'], createdDate: now, updatedDate: now }),
    assetRecord({ id: 'asset-operator-runtime-docs', title: 'Operator Runtime Documentation', description: 'Internal documentation and SOP references for local operator workflows.', category: 'Operations', assetType: 'SOP', owner: 'Operator', status: 'Under Review', approvalStatus: 'Under Review', localFileReference: 'docs/OPERATOR_AGENT.md', relativeProjectPath: 'docs/OPERATOR_AGENT.md', fileType: 'markdown', tags: ['operator', 'sop', 'internal documentation'], keywords: ['operator', 'local only', 'queue'], products: ['Vyra Agent Platform'], audiences: ['operators'], campaigns: [], organizations: ['Vyra internal operations'], linkedTasks: taskIds.slice(0, 2), linkedGoals: goalIds.slice(0, 1), usageReferences: ['Operator', 'Shared Memory'], createdDate: now, updatedDate: now }),
    assetRecord({ id: 'asset-architecture-local-runtime', title: 'Local Runtime Architecture Reference', description: 'Engineering reference for local deterministic agent runtime structure.', category: 'Engineering', assetType: 'architecture doc', owner: 'Engineering', status: 'Approved', approvalStatus: 'Approved', localFileReference: 'docs/PHASE_PLAN.md', relativeProjectPath: 'docs/PHASE_PLAN.md', fileType: 'markdown', tags: ['engineering', 'architecture', 'local runtime'], keywords: ['phase plan', 'runtime', 'agents'], products: ['Vyra Agent Platform'], audiences: ['engineering operators'], campaigns: [], organizations: ['Vyra internal operations'], linkedTasks: taskIds.slice(0, 2), linkedGoals: goalIds.slice(0, 1), usageReferences: ['Engineering', 'Executive'], createdDate: now, updatedDate: now }),
    assetRecord({ id: 'asset-knowledge-graph-doc', title: 'Cross-Agent Memory Guide', description: 'Shared memory and knowledge graph reference for asset relationship integration.', category: 'Operations', assetType: 'internal documentation', owner: 'Memory', status: 'Approved', approvalStatus: 'Approved', localFileReference: 'docs/CROSS_AGENT_MEMORY.md', relativeProjectPath: 'docs/CROSS_AGENT_MEMORY.md', fileType: 'markdown', tags: ['memory', 'knowledge graph', 'relationships'], keywords: ['entities', 'facts', 'relationships'], products: ['Vyra Agent Platform'], audiences: ['operators', 'executive'], campaigns: [], organizations: ['Vyra internal operations'], relatedAssets: ['asset-executive-planning-doc'], linkedTasks: taskIds.slice(0, 1), linkedGoals: goalIds.slice(0, 1), usageReferences: ['Shared Memory', 'Executive', 'Operator'], createdDate: now, updatedDate: now }),
    assetRecord({ id: 'asset-marketing-template-report', title: 'Draft Library Report Reference', description: 'Generated local content-studio draft library report for template discovery.', category: 'Marketing', assetType: 'template library', owner: 'Marketing', status: 'Under Review', approvalStatus: 'Under Review', localFileReference: 'codex-agent-threads/shared/marketing/reports/draft-library-report.md', relativeProjectPath: 'codex-agent-threads/shared/marketing/reports/draft-library-report.md', fileType: 'markdown report', tags: ['marketing templates', 'draft library'], keywords: ['templates', 'drafts', 'campaign'], products: ['Vyra Performance'], audiences: ['marketing operators', 'sales'], campaigns: ['camp-athlete-app-foundation', 'camp-gym-growth-readiness'], organizations: ['Vyra internal operations'], linkedTasks: taskIds.slice(0, 2), linkedGoals: goalIds.slice(0, 1), usageReferences: ['Marketing', 'Sales'], createdDate: now, updatedDate: now }),
  ];
  const knowledge = knowledgeSeeds(now, assets, memory, taskIds, goalIds);
  const versions = assets.map((asset) => versionRecord(asset, asset.version, 'Seeded metadata reference without copying asset contents.', now, null));
  const approvals = assets.map((asset) => approvalRecord(asset, asset.approvalStatus, 'Seeded approval status from existing local phase documentation.', now));
  const usage = assets.map((asset) => usageRecord(asset.assetId, asset.usageReferences, asset.campaigns.concat(asset.products, asset.organizations).filter(Boolean), now));
  writeAssetStore({ assets, knowledge, versions, approvals, usage });
}

function knowledgeSeeds(now, assets, memory, taskIds, goalIds) {
  const mk = (id, title, type, category, summary, linkedAssets, usageReferences) => ({
    knowledgeId: id,
    title,
    summary,
    category,
    recordType: type,
    linkedAssets,
    linkedProducts: assets.filter((asset) => linkedAssets.includes(asset.assetId)).flatMap((asset) => asset.products),
    linkedAudiences: assets.filter((asset) => linkedAssets.includes(asset.assetId)).flatMap((asset) => asset.audiences),
    linkedTasks: taskIds.slice(0, 2),
    linkedWorkflows: ['asset-library-review', 'local-approval-gate'],
    linkedGoals: goalIds.slice(0, 2),
    confidence: 86,
    approvalStatus: 'Approved',
    version: '1.0.0',
    usageReferences,
    sourceEntityIds: memory.entities?.slice(0, 3).map((entity) => entity.entityId) ?? [],
    auditHistory: [auditEvent(null, 'Approved', 'Asset Library', 'Seeded structured knowledge reference.', now)],
  });
  return [
    mk('knowledge-brand-asset-usage', 'Brand Asset Usage FAQ', 'FAQ', 'Brand', 'Explains which local brand assets are approved and where operators should reference them.', ['asset-brand-dashboard-mark', 'asset-brand-design-tokens'], ['Marketing', 'Sales', 'Executive']),
    mk('knowledge-content-draft-process', 'Marketing Draft Approval Process', 'Process', 'Marketing', 'Outlines local draft creation, brand checks, review, approval, and archive steps without publishing.', ['asset-marketing-content-studio-doc'], ['Marketing', 'Operator', 'Executive']),
    mk('knowledge-sales-resource-playbook', 'Sales Resource Playbook', 'Playbook', 'Sales', 'Shows how Sales should use approved pitch, product, and campaign resources from the shared library.', ['asset-sales-agent-guide', 'asset-marketing-template-report'], ['Sales', 'Marketing']),
    mk('knowledge-executive-policy-library', 'Executive Policy Library', 'Internal Guide', 'Executive', 'Summarizes strategic documents, roadmaps, KPI references, and approval-safe policy resources.', ['asset-executive-planning-doc'], ['Executive', 'Operator']),
    mk('knowledge-operator-sop-library', 'Operator SOP Library', 'SOP', 'Operations', 'Central operational SOP index for local-only work queues, review queues, and documentation references.', ['asset-operator-runtime-docs', 'asset-knowledge-graph-doc'], ['Operator', 'Shared Memory']),
    mk('knowledge-engineering-runtime-guide', 'Engineering Runtime Guide', 'Product Documentation', 'Engineering', 'Documents the local runtime architecture reference used by Engineering and future agents.', ['asset-architecture-local-runtime'], ['Engineering', 'Executive']),
  ];
}

function assetRecord(input) {
  const localFileReference = input.localFileReference ?? '';
  const fullPath = localFileReference ? path.join(repoRoot, localFileReference) : '';
  const stats = existsSync(fullPath) ? statSync(fullPath) : null;
  return {
    assetId: input.id,
    title: input.title,
    description: input.description,
    category: input.category,
    assetType: input.assetType,
    version: input.version ?? '1.0.0',
    status: input.status ?? 'Draft',
    owner: input.owner,
    createdDate: input.createdDate,
    updatedDate: input.updatedDate,
    archivedDate: input.archivedDate ?? null,
    localFileReference,
    relativeProjectPath: input.relativeProjectPath ?? localFileReference,
    previewReference: input.previewReference ?? '',
    fileType: input.fileType ?? fileTypeFor(localFileReference),
    size: stats?.size ?? 0,
    tags: input.tags ?? [],
    keywords: input.keywords ?? [],
    products: input.products ?? [],
    audiences: input.audiences ?? [],
    campaigns: input.campaigns ?? [],
    organizations: input.organizations ?? [],
    relatedAssets: input.relatedAssets ?? [],
    relatedDocuments: input.relatedDocuments ?? [],
    linkedTasks: input.linkedTasks ?? [],
    linkedGoals: input.linkedGoals ?? [],
    approvalStatus: input.approvalStatus ?? 'Draft',
    reviewer: input.reviewer ?? (input.approvalStatus === 'Approved' ? 'Robert' : ''),
    approvalDate: input.approvalDate ?? (input.approvalStatus === 'Approved' ? input.updatedDate : null),
    approvalNotes: input.approvalNotes ?? 'Local metadata approval only. No publication or external distribution.',
    usageReferences: input.usageReferences ?? [],
    duplicatedAsset: false,
    auditHistory: [auditEvent(null, input.status ?? 'Draft', input.owner, 'Asset metadata created as a local reference.', input.createdDate)],
  };
}

function versionRecord(asset, version, changeSummary, now, supersededVersion) {
  return {
    versionId: `${asset.assetId}-v-${version.replace(/\./g, '-')}`,
    assetId: asset.assetId,
    title: asset.title,
    versionNumber: version,
    changeSummary,
    supersededVersion,
    approvalStatus: asset.approvalStatus,
    author: asset.owner,
    reviewer: asset.reviewer || 'Pending human review',
    releaseDate: asset.approvalStatus === 'Approved' ? now : null,
    createdDate: now,
  };
}

function approvalRecord(asset, status, notes, now) {
  return {
    approvalId: `${asset.assetId}-approval-${slug(status)}`,
    assetId: asset.assetId,
    title: asset.title,
    status,
    reviewer: status === 'Approved' ? 'Robert' : 'Pending reviewer',
    approvalDate: status === 'Approved' ? now : null,
    notes,
    auditHistory: [auditEvent(null, status, 'Asset Library', notes, now)],
  };
}

function usageRecord(assetId, usedBy, references, now) {
  return {
    usageId: `${assetId}-usage`,
    assetId,
    usedBy,
    references,
    usageCount: usedBy.length + references.length,
    lastUsed: now,
    notes: 'Local reference tracking only. No external distribution.',
  };
}

function transitionAsset(nextStatus, action, reason) {
  const store = readAssetStore();
  const assetId = process.env.ASSET_ID ?? store.assets[0]?.assetId;
  const now = stamp();
  const asset = store.assets.find((item) => item.assetId === assetId);
  if (!asset) return { title: 'Asset Transition Failed', generatedAt: now, status: 'fail', errors: [`Asset not found: ${assetId}`], safety };
  const nextAsset = {
    ...asset,
    status: nextStatus,
    approvalStatus: nextStatus,
    updatedDate: now,
    archivedDate: nextStatus === 'Archived' ? now : asset.archivedDate,
    reviewer: nextStatus === 'Approved' ? 'Robert' : asset.reviewer,
    approvalDate: nextStatus === 'Approved' ? now : asset.approvalDate,
    auditHistory: [auditEvent(asset.status, nextStatus, 'Asset Library', reason, now), ...asset.auditHistory],
  };
  const version = versionRecord(nextAsset, bumpPatch(asset.version), reason, now, asset.version);
  const approval = approvalRecord(nextAsset, nextStatus, reason, now);
  writeAssetStore({
    ...store,
    assets: store.assets.map((item) => (item.assetId === assetId ? nextAsset : item)),
    versions: [version, ...store.versions],
    approvals: [approval, ...store.approvals],
  });
  return { title: 'Asset Transitioned', generatedAt: now, action, asset: nextAsset, version, approval, safety };
}

function summarizeAssets(store) {
  const approved = store.assets.filter((asset) => asset.approvalStatus === 'Approved').length;
  return {
    totalAssets: store.assets.length,
    approvedAssets: approved,
    underReview: store.assets.filter((asset) => asset.approvalStatus === 'Under Review').length,
    draftAssets: store.assets.filter((asset) => asset.approvalStatus === 'Draft').length,
    archivedAssets: store.assets.filter((asset) => asset.approvalStatus === 'Archived').length,
    recentlyUpdated: store.assets.filter((asset) => asset.updatedDate).length,
    categories: countBy(store.assets, 'category'),
    approvalQueue: store.approvals.filter((approval) => approval.status !== 'Approved').length,
    usageReferences: store.usage.reduce((sum, item) => sum + item.usageCount, 0),
  };
}

function summarizeKnowledge(store) {
  return {
    totalKnowledgeRecords: store.knowledge.length,
    approvedKnowledge: store.knowledge.filter((item) => item.approvalStatus === 'Approved').length,
    averageConfidence: Math.round(store.knowledge.reduce((sum, item) => sum + item.confidence, 0) / Math.max(store.knowledge.length, 1)),
    categories: countBy(store.knowledge, 'category'),
    recordTypes: countBy(store.knowledge, 'recordType'),
  };
}

function relatedAssetSuggestions(store, assetId) {
  const asset = store.assets.find((item) => item.assetId === assetId);
  if (!asset) return [];
  return store.assets
    .filter((item) => item.assetId !== asset.assetId)
    .map((item) => ({
      assetId: item.assetId,
      title: item.title,
      reason: intersection(asset.tags, item.tags)[0] || intersection(asset.products, item.products)[0] || intersection(asset.usageReferences, item.usageReferences)[0] || '',
      score: intersection(asset.tags.concat(asset.products, asset.audiences, asset.usageReferences), item.tags.concat(item.products, item.audiences, item.usageReferences)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function searchableAssetText(asset) {
  return [asset.title, asset.description, asset.category, asset.assetType, asset.owner, asset.approvalStatus, ...asset.tags, ...asset.keywords, ...asset.products, ...asset.audiences, ...asset.campaigns].join(' ').toLowerCase();
}

function coverageBy(assets, field) {
  const map = new Map();
  for (const asset of assets) {
    for (const value of asset[field] ?? []) {
      if (!map.has(value)) map.set(value, []);
      map.get(value).push(asset.title);
    }
  }
  return Array.from(map.entries()).map(([name, assetTitles]) => ({ name, assets: assetTitles, count: assetTitles.length }));
}

function writeReport(slugName, payload) {
  mkdirSync(reportsRoot, { recursive: true });
  const jsonPath = path.join(reportsRoot, `${slugName}.json`);
  const mdPath = path.join(reportsRoot, `${slugName}.md`);
  writeJson(jsonPath, payload);
  writeFileSync(mdPath, `# ${payload.title}\n\nGenerated: ${payload.generatedAt}\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n\nLocal-only asset library safety: no publishing, uploads, external storage, autonomous distribution, automatic replacement, or automatic approval.\n`);
  return { slug: slugName, jsonPath: path.relative(repoRoot, jsonPath), markdownPath: path.relative(repoRoot, mdPath) };
}

function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function auditEvent(previousValue, newValue, actor, reason, timestamp = stamp()) {
  return { timestamp, actor, previousValue, newValue, reason };
}

function countBy(items, field) {
  return items.reduce((acc, item) => {
    const value = item[field] ?? 'unknown';
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function intersection(a, b) {
  const other = new Set(b);
  return a.filter((item) => other.has(item));
}

function fileTypeFor(file) {
  const ext = path.extname(file).replace('.', '');
  return ext || 'local reference';
}

function bumpPatch(version) {
  const parts = String(version || '1.0.0').split('.').map((part) => Number(part) || 0);
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}

function csv(value) {
  if (Array.isArray(value)) return value;
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function stamp() {
  return new Date().toISOString();
}
