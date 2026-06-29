import { githubRepositoryStatuses } from './githubMockData';
import { getLiveGitHubStatus } from './githubLiveStatus';
import type { GitHubRepositoryStatus, GitHubStatusResult, IntegrationHealth } from './githubTypes';

export function getGitHubRepositoryStatuses(): GitHubRepositoryStatus[] {
  return githubRepositoryStatuses;
}

export function getMockGitHubStatus(warnings: string[] = []): GitHubStatusResult {
  return {
    repositories: githubRepositoryStatuses,
    warnings,
    usedFallback: warnings.length > 0,
    lastChecked: 'Mock readiness only',
  };
}

export async function getGitHubStatus(mode: 'mock' | 'live'): Promise<GitHubStatusResult> {
  if (mode === 'mock') {
    return getMockGitHubStatus();
  }

  try {
    return await getLiveGitHubStatus();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub live check failed.';
    return getMockGitHubStatus([`GitHub live check failed; using mock fallback. ${message}`]);
  }
}

export function getGitHubHealthStatus(): IntegrationHealth {
  if (githubRepositoryStatuses.some((repository) => repository.healthStatus === 'critical')) {
    return 'critical';
  }

  if (githubRepositoryStatuses.some((repository) => repository.healthStatus === 'warning')) {
    return 'warning';
  }

  return 'healthy';
}
