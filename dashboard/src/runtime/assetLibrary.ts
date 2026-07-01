export interface AssetLibraryRecord {
  assetId: string;
  title: string;
  description: string;
  category: string;
  assetType: string;
  version: string;
  status: string;
  owner: string;
  updatedDate: string;
  localFileReference: string;
  fileType: string;
  tags: string[];
  keywords: string[];
  products: string[];
  audiences: string[];
  campaigns: string[];
  organizations: string[];
  relatedAssets: string[];
  relatedDocuments: string[];
  linkedTasks: string[];
  linkedGoals: string[];
  approvalStatus: string;
  usageReferences: string[];
}

export interface KnowledgeRecord {
  knowledgeId: string;
  title: string;
  summary: string;
  category: string;
  recordType: string;
  linkedAssets: string[];
  linkedProducts: string[];
  linkedAudiences: string[];
  confidence: number;
  approvalStatus: string;
  version: string;
  usageReferences: string[];
}

export interface AssetVersionRecord {
  versionId: string;
  assetId: string;
  title: string;
  versionNumber: string;
  changeSummary: string;
  approvalStatus: string;
  author: string;
  reviewer: string;
  releaseDate: string | null;
}

export interface AssetApprovalRecord {
  approvalId: string;
  assetId: string;
  title: string;
  status: string;
  reviewer: string;
  approvalDate: string | null;
  notes: string;
}

export interface AssetUsageRecord {
  usageId: string;
  assetId: string;
  usedBy: string[];
  references: string[];
  usageCount: number;
  lastUsed: string;
  notes: string;
}

export interface AssetLibrarySummary {
  totalAssets: number;
  approvedAssets: number;
  underReview: number;
  approvalQueue: number;
  knowledgeRecords: number;
  usageReferences: number;
}

export interface AssetLibraryDashboardSummary {
  assets: AssetLibraryRecord[];
  knowledge: KnowledgeRecord[];
  versions: AssetVersionRecord[];
  approvals: AssetApprovalRecord[];
  usage: AssetUsageRecord[];
  relatedAssets: Array<{ asset: string; related: string; reason: string }>;
  summary: AssetLibrarySummary;
  safety: {
    localOnly: boolean;
    externalUploads: boolean;
    cloudSync: boolean;
    autonomousPublishing: boolean;
    automaticApprovals: boolean;
  };
}

const now = '2026-07-01T21:02:00.000Z';

export function buildDashboardAssetLibrarySummary(): AssetLibraryDashboardSummary {
  const assets: AssetLibraryRecord[] = [
    asset('asset-brand-dashboard-mark', 'Vyra Dashboard Brand Mark', 'Brand', 'logo mark', 'Marketing', 'Approved', 'dashboard/src/styles.css', ['brand', 'logo', 'dashboard'], ['Vyra Performance'], ['internal operators'], ['camp-athlete-app-foundation'], ['Marketing', 'Executive', 'Sales']),
    asset('asset-brand-design-tokens', 'Dashboard Design Tokens', 'Brand', 'design tokens', 'Marketing', 'Approved', 'dashboard/src/styles.css', ['brand', 'colors', 'typography'], ['Vyra Performance'], ['internal operators'], ['camp-athlete-app-foundation'], ['Marketing', 'Engineering']),
    asset('asset-marketing-content-studio-doc', 'Marketing Content Studio Guide', 'Marketing', 'internal guide', 'Marketing', 'Approved', 'docs/MARKETING_CONTENT_STUDIO.md', ['marketing', 'content studio', 'drafts'], ['Vyra Performance'], ['marketing operators', 'sales'], ['camp-gym-growth-readiness'], ['Marketing', 'Sales', 'Executive']),
    asset('asset-sales-agent-guide', 'Sales Agent Guide', 'Sales', 'playbook', 'Sales', 'Approved', 'docs/SALES_AGENT.md', ['sales', 'playbook', 'local crm'], ['Sales/CRM tools'], ['sales operators'], ['camp-gym-growth-readiness'], ['Sales', 'Operator', 'Executive']),
    asset('asset-executive-planning-doc', 'Executive Planning Guide', 'Executive', 'planning doc', 'Executive', 'Approved', 'docs/EXECUTIVE_AGENT.md', ['executive', 'planning', 'goals'], ['Vyra Performance'], ['executive operators'], [], ['Executive', 'Operator']),
    asset('asset-operator-runtime-docs', 'Operator Runtime Documentation', 'Operations', 'SOP', 'Operator', 'Under Review', 'docs/OPERATOR_AGENT.md', ['operator', 'sop', 'internal documentation'], ['Vyra Agent Platform'], ['operators'], [], ['Operator', 'Shared Memory']),
    asset('asset-architecture-local-runtime', 'Local Runtime Architecture Reference', 'Engineering', 'architecture doc', 'Engineering', 'Approved', 'docs/PHASE_PLAN.md', ['engineering', 'architecture', 'local runtime'], ['Vyra Agent Platform'], ['engineering operators'], [], ['Engineering', 'Executive']),
    asset('asset-knowledge-graph-doc', 'Cross-Agent Memory Guide', 'Operations', 'internal documentation', 'Memory', 'Approved', 'docs/CROSS_AGENT_MEMORY.md', ['memory', 'knowledge graph', 'relationships'], ['Vyra Agent Platform'], ['operators', 'executive'], [], ['Shared Memory', 'Executive', 'Operator']),
    asset('asset-marketing-template-report', 'Draft Library Report Reference', 'Marketing', 'template library', 'Marketing', 'Under Review', 'codex-agent-threads/shared/marketing/reports/draft-library-report.md', ['marketing templates', 'draft library'], ['Vyra Performance'], ['marketing operators', 'sales'], ['camp-athlete-app-foundation', 'camp-gym-growth-readiness'], ['Marketing', 'Sales']),
  ];
  const knowledge: KnowledgeRecord[] = [
    knowledgeRecord('knowledge-brand-asset-usage', 'Brand Asset Usage FAQ', 'FAQ', 'Brand', 'Explains which local brand assets are approved and where operators should reference them.', ['asset-brand-dashboard-mark', 'asset-brand-design-tokens'], ['Marketing', 'Sales', 'Executive']),
    knowledgeRecord('knowledge-content-draft-process', 'Marketing Draft Approval Process', 'Process', 'Marketing', 'Outlines local draft creation, brand checks, review, approval, and archive steps without publishing.', ['asset-marketing-content-studio-doc'], ['Marketing', 'Operator', 'Executive']),
    knowledgeRecord('knowledge-sales-resource-playbook', 'Sales Resource Playbook', 'Playbook', 'Sales', 'Shows how Sales should use approved pitch, product, and campaign resources from the shared library.', ['asset-sales-agent-guide', 'asset-marketing-template-report'], ['Sales', 'Marketing']),
    knowledgeRecord('knowledge-executive-policy-library', 'Executive Policy Library', 'Internal Guide', 'Executive', 'Summarizes strategic documents, roadmaps, KPI references, and approval-safe policy resources.', ['asset-executive-planning-doc'], ['Executive', 'Operator']),
    knowledgeRecord('knowledge-operator-sop-library', 'Operator SOP Library', 'SOP', 'Operations', 'Central operational SOP index for local-only work queues, review queues, and documentation references.', ['asset-operator-runtime-docs', 'asset-knowledge-graph-doc'], ['Operator', 'Shared Memory']),
    knowledgeRecord('knowledge-engineering-runtime-guide', 'Engineering Runtime Guide', 'Product Documentation', 'Engineering', 'Documents the local runtime architecture reference used by Engineering and future agents.', ['asset-architecture-local-runtime'], ['Engineering', 'Executive']),
  ];
  const versions = assets.map((item) => ({
    versionId: `${item.assetId}-v-1-0-0`,
    assetId: item.assetId,
    title: item.title,
    versionNumber: item.version,
    changeSummary: 'Seeded metadata reference without copying asset contents.',
    approvalStatus: item.approvalStatus,
    author: item.owner,
    reviewer: item.approvalStatus === 'Approved' ? 'Robert' : 'Pending human review',
    releaseDate: item.approvalStatus === 'Approved' ? now : null,
  }));
  const approvals = assets.map((item) => ({
    approvalId: `${item.assetId}-approval`,
    assetId: item.assetId,
    title: item.title,
    status: item.approvalStatus,
    reviewer: item.approvalStatus === 'Approved' ? 'Robert' : 'Pending reviewer',
    approvalDate: item.approvalStatus === 'Approved' ? now : null,
    notes: 'Local metadata approval only. No publication or external distribution.',
  }));
  const usage = assets.map((item) => ({
    usageId: `${item.assetId}-usage`,
    assetId: item.assetId,
    usedBy: item.usageReferences,
    references: item.products.concat(item.campaigns, item.organizations).filter(Boolean),
    usageCount: item.usageReferences.length + item.products.length + item.campaigns.length,
    lastUsed: now,
    notes: 'Local reference tracking only. No external distribution.',
  }));
  return {
    assets,
    knowledge,
    versions,
    approvals,
    usage,
    relatedAssets: relatedAssets(assets),
    summary: {
      totalAssets: assets.length,
      approvedAssets: assets.filter((item) => item.approvalStatus === 'Approved').length,
      underReview: assets.filter((item) => item.approvalStatus === 'Under Review').length,
      approvalQueue: approvals.filter((item) => item.status !== 'Approved').length,
      knowledgeRecords: knowledge.length,
      usageReferences: usage.reduce((sum, item) => sum + item.usageCount, 0),
    },
    safety: {
      localOnly: true,
      externalUploads: false,
      cloudSync: false,
      autonomousPublishing: false,
      automaticApprovals: false,
    },
  };
}

function asset(assetId: string, title: string, category: string, assetType: string, owner: string, approvalStatus: string, localFileReference: string, tags: string[], products: string[], audiences: string[], campaigns: string[], usageReferences: string[]): AssetLibraryRecord {
  return {
    assetId,
    title,
    description: `${title} metadata reference in the shared local asset library.`,
    category,
    assetType,
    version: '1.0.0',
    status: approvalStatus,
    owner,
    updatedDate: now,
    localFileReference,
    fileType: localFileReference.split('.').pop() ?? 'reference',
    tags,
    keywords: tags,
    products,
    audiences,
    campaigns,
    organizations: ['Vyra internal operations'],
    relatedAssets: [],
    relatedDocuments: [],
    linkedTasks: [],
    linkedGoals: [],
    approvalStatus,
    usageReferences,
  };
}

function knowledgeRecord(knowledgeId: string, title: string, recordType: string, category: string, summary: string, linkedAssets: string[], usageReferences: string[]): KnowledgeRecord {
  return {
    knowledgeId,
    title,
    summary,
    category,
    recordType,
    linkedAssets,
    linkedProducts: ['Vyra Performance'],
    linkedAudiences: ['internal operators'],
    confidence: 86,
    approvalStatus: 'Approved',
    version: '1.0.0',
    usageReferences,
  };
}

function relatedAssets(assets: AssetLibraryRecord[]) {
  return assets.flatMap((item) =>
    assets
      .filter((candidate) => candidate.assetId !== item.assetId && candidate.usageReferences.some((usage) => item.usageReferences.includes(usage)))
      .slice(0, 2)
      .map((candidate) => ({ asset: item.title, related: candidate.title, reason: `Shared ${item.usageReferences.find((usage) => candidate.usageReferences.includes(usage))} usage` })),
  ).slice(0, 12);
}
