import type { GitHubRepositoryStatus } from './githubTypes';

export const githubRepositoryStatuses: GitHubRepositoryStatus[] = [
  {
    repositoryName: 'Vyra-Part-1',
    remoteUrl: 'https://github.com/Matthewalbin1/Vyra-Part-1',
    defaultBranch: 'main',
    latestCommit: 'remote synced through 20260628193000 migrations',
    openPullRequests: 0,
    issueCount: 4,
    workflowStatus: 'Read-only checks planned',
    lastUpdated: '2026-06-28 21:55 ET',
    healthStatus: 'warning',
  },
  {
    repositoryName: 'Vyra-Software',
    remoteUrl: 'pending local remote discovery',
    defaultBranch: 'main',
    latestCommit: 'mock status',
    openPullRequests: 0,
    issueCount: 1,
    workflowStatus: 'Not connected',
    lastUpdated: '2026-06-28 21:55 ET',
    healthStatus: 'prepared',
  },
  {
    repositoryName: 'vyra-website',
    remoteUrl: 'pending local remote discovery',
    defaultBranch: 'main',
    latestCommit: 'mock status',
    openPullRequests: 0,
    issueCount: 2,
    workflowStatus: 'Not connected',
    lastUpdated: '2026-06-28 21:55 ET',
    healthStatus: 'prepared',
  },
  {
    repositoryName: 'vyra-agents',
    remoteUrl: 'https://github.com/unpaidintern9/vyra-agents',
    defaultBranch: 'main',
    latestCommit: '317da0f',
    openPullRequests: 0,
    issueCount: 0,
    workflowStatus: 'Local validation passing',
    lastUpdated: '2026-06-28 21:55 ET',
    healthStatus: 'healthy',
  },
];

