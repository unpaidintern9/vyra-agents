export interface GitHubReadOnlyDashboardSummary {
  allowedReadActions: string[];
  blockedWriteActions: string[];
  commands: string[];
  configNames: string[];
  connector: string;
  engineeringReadiness: string;
  externalCalls: string;
  issueCreationEnabled: boolean;
  mode: string;
  prCreationEnabled: boolean;
  productionWritesEnabled: boolean;
  repoHealth: string;
  safetyStatus: string;
  status: string;
  tokenDisplayed: boolean;
  workflowDispatchEnabled: boolean;
  writeActionsEnabled: boolean;
}

export function buildDashboardGitHubReadOnlySummary(): GitHubReadOnlyDashboardSummary {
  return {
    allowedReadActions: ['repository metadata', 'branches', 'commits', 'open issues', 'open pull requests'],
    blockedWriteActions: [
      'issue creation',
      'pull request creation',
      'commits',
      'branch changes',
      'workflow dispatch',
      'repository writes',
    ],
    commands: [
      'npm run github:status',
      'npm run github:repo',
      'npm run github:branches',
      'npm run github:commits',
      'npm run github:issues',
      'npm run github:prs',
      'npm run github:safety-check',
      'npm run github:validate',
    ],
    configNames: ['VYRA_GITHUB_OWNER', 'VYRA_GITHUB_REPO', 'VYRA_GITHUB_TOKEN'],
    connector: 'GitHub',
    engineeringReadiness: 'CLI can inspect configured repositories with GitHub REST GET requests only.',
    externalCalls: 'CLI GitHub GET-only when config is present; dashboard makes no GitHub calls.',
    issueCreationEnabled: false,
    mode: 'read_only',
    prCreationEnabled: false,
    productionWritesEnabled: false,
    repoHealth: 'Available after CLI read-only status check',
    safetyStatus: 'No write endpoints available',
    status: 'read_only_ready_when_configured',
    tokenDisplayed: false,
    workflowDispatchEnabled: false,
    writeActionsEnabled: false,
  };
}
