import { githubGet } from './githubClient';
import type { GitHubRepositoryStatus, GitHubStatusResult } from './githubTypes';

interface GitHubRepoResponse {
  default_branch: string;
  html_url: string;
  name: string;
}

interface GitHubCommitResponse {
  sha: string;
  commit: {
    message: string;
    committer?: {
      date?: string;
    };
  };
}

interface GitHubSearchResponse {
  total_count: number;
}

interface GitHubWorkflowRunsResponse {
  workflow_runs?: Array<{
    conclusion: string | null;
    status: string;
  }>;
}

export async function getLiveGitHubStatus(): Promise<GitHubStatusResult> {
  const owner = import.meta.env.VITE_GITHUB_OWNER || 'unpaidintern9';
  const repos = parseRepos(import.meta.env.VITE_GITHUB_REPOS);
  const token = import.meta.env.VITE_GITHUB_TOKEN || undefined;
  const warnings: string[] = [];

  if (!token) {
    warnings.push('GitHub token missing; attempting public read-only GitHub API requests.');
  }

  const repositories = await Promise.all(repos.map((repo) => readRepository(owner, repo, token, warnings)));

  return {
    repositories,
    warnings,
    usedFallback: false,
    lastChecked: new Date().toISOString(),
  };
}

function parseRepos(value?: string): string[] {
  const fallback = ['vyra-agents', 'Vyra-Part-1', 'Vyra-Software', 'vyra-website'];
  return value
    ? value
        .split(',')
        .map((repo) => repo.trim())
        .filter(Boolean)
    : fallback;
}

async function readRepository(
  owner: string,
  repositoryName: string,
  token: string | undefined,
  warnings: string[],
): Promise<GitHubRepositoryStatus> {
  const lastUpdated = new Date().toISOString();

  try {
    const repo = await githubGet<GitHubRepoResponse>(`/repos/${owner}/${repositoryName}`, { token });
    const [commit, pulls, issues, runs] = await Promise.all([
      githubGet<GitHubCommitResponse>(`/repos/${owner}/${repositoryName}/commits/${repo.default_branch}`, { token }),
      githubGet<GitHubSearchResponse>(
        `/search/issues?q=repo:${owner}/${repositoryName}+type:pr+state:open&per_page=1`,
        { token },
      ),
      githubGet<GitHubSearchResponse>(
        `/search/issues?q=repo:${owner}/${repositoryName}+type:issue+state:open&per_page=1`,
        { token },
      ),
      githubGet<GitHubWorkflowRunsResponse>(`/repos/${owner}/${repositoryName}/actions/runs?per_page=1`, { token }).catch(
        () => ({ workflow_runs: [] }),
      ),
    ]);
    const latestRun = runs.workflow_runs?.[0];
    const workflowConclusion = latestRun?.conclusion || latestRun?.status || 'not available';
    const healthStatus = workflowConclusion === 'failure' ? 'warning' : 'healthy';

    return {
      repositoryName: repo.name,
      remoteUrl: repo.html_url,
      defaultBranch: repo.default_branch,
      latestCommit: commit.sha,
      latestCommitMessage: firstLine(commit.commit.message),
      latestCommitDate: commit.commit.committer?.date || 'unknown',
      openPullRequests: pulls.total_count,
      issueCount: issues.total_count,
      workflowStatus: workflowConclusion,
      workflowConclusion,
      lastUpdated,
      healthStatus,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown GitHub read failure';
    warnings.push(`${repositoryName}: ${message}`);

    return {
      repositoryName,
      remoteUrl: `https://github.com/${owner}/${repositoryName}`,
      defaultBranch: 'unknown',
      latestCommit: 'unknown',
      latestCommitMessage: 'Repository could not be read.',
      latestCommitDate: 'unknown',
      openPullRequests: 0,
      issueCount: 0,
      workflowStatus: 'not accessible',
      workflowConclusion: 'unknown',
      lastUpdated,
      healthStatus: 'warning',
      warning: message,
    };
  }
}

function firstLine(value: string): string {
  return value.split('\n')[0] || 'No commit message';
}
