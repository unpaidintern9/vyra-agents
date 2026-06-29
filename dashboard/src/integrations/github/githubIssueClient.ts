import type {
  GitHubIssueCreationConfig,
  GitHubIssueCreationResult,
  GitHubIssueDraftPayload,
} from './githubIssueTypes';

const githubApiBase = 'https://api.github.com';

interface GitHubIssueResponse {
  body?: string | null;
  html_url: string;
  number: number;
  title: string;
}

export const createdGitHubIssuesStorageKey = 'vyra-agents:engineering-created-github-issues';

export function githubIssueCreationConfigFromEnv(): GitHubIssueCreationConfig {
  return {
    dryRun: import.meta.env.VITE_GITHUB_ISSUE_CREATION_DRY_RUN !== 'false',
    enabled: import.meta.env.VITE_GITHUB_ISSUE_CREATION_ENABLED === 'true',
    owner: import.meta.env.VITE_GITHUB_OWNER || 'unpaidintern9',
    token: import.meta.env.VITE_GITHUB_TOKEN || '',
  };
}

export function githubIssueDraftBodyWithMarkers(draft: GitHubIssueDraftPayload): string {
  return `${draft.bodyMarkdown.trim()}

<!-- vyra-agent-draft-id: ${draft.id} -->
<!-- vyra-agent-source: engineering-agent -->
`;
}

export async function createGitHubIssueFromDraft(
  draft: GitHubIssueDraftPayload,
  config: GitHubIssueCreationConfig,
  mode: 'dry-run' | 'live',
): Promise<GitHubIssueCreationResult> {
  const createdAt = new Date().toISOString();
  const base = {
    createdAt,
    draftId: draft.id,
    repo: draft.repo,
    title: draft.title,
  };

  if (!draft.readyForGitHub) {
    return {
      ...base,
      dryRun: mode === 'dry-run',
      message: 'Draft is not marked ready for GitHub.',
      status: 'blocked',
    };
  }

  if (!config.owner || !draft.repo) {
    return {
      ...base,
      dryRun: mode === 'dry-run',
      message: 'GitHub owner or repo is missing.',
      status: 'blocked',
    };
  }

  if (mode === 'dry-run' || config.dryRun) {
    return {
      ...base,
      dryRun: true,
      message: 'Dry run completed without a GitHub write.',
      status: 'dry_run',
    };
  }

  if (!config.enabled) {
    return {
      ...base,
      dryRun: false,
      message: 'GitHub issue creation is disabled.',
      status: 'blocked',
    };
  }

  if (!config.token) {
    return {
      ...base,
      dryRun: false,
      message: 'GitHub token is not configured.',
      status: 'blocked',
    };
  }

  const duplicate = await findDuplicateIssue(draft, config);
  if (duplicate) {
    return {
      ...base,
      dryRun: false,
      existingIssueUrl: duplicate.html_url,
      issueNumber: duplicate.number,
      message: 'Duplicate GitHub issue found; creation skipped.',
      status: 'duplicate_skipped',
    };
  }

  const response = await githubRequest<GitHubIssueResponse>(`/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(draft.repo)}/issues`, {
    body: JSON.stringify({
      body: githubIssueDraftBodyWithMarkers(draft),
      labels: draft.labels,
      title: draft.title,
    }),
    method: 'POST',
    token: config.token,
  });

  return {
    ...base,
    dryRun: false,
    issueNumber: response.number,
    issueUrl: response.html_url,
    message: 'GitHub issue created after explicit approval.',
    status: 'created',
  };
}

async function findDuplicateIssue(draft: GitHubIssueDraftPayload, config: GitHubIssueCreationConfig): Promise<GitHubIssueResponse | null> {
  const marker = `<!-- vyra-agent-draft-id: ${draft.id} -->`;
  const issues = await githubRequest<GitHubIssueResponse[]>(
    `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(draft.repo)}/issues?state=open&per_page=100`,
    {
      method: 'GET',
      token: config.token,
    },
  );

  return issues.find((issue) => issue.title === draft.title || Boolean(issue.body?.includes(marker))) ?? null;
}

async function githubRequest<T>(
  path: string,
  options: {
    body?: string;
    method: 'GET' | 'POST';
    token: string;
  },
): Promise<T> {
  const response = await fetch(`${githubApiBase}${path}`, {
    body: options.body,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${options.token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    method: options.method,
  });

  if (!response.ok) {
    throw new Error(githubErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

function githubErrorMessage(response: Response): string {
  if (response.status === 401) return 'GitHub permission error: token was rejected.';
  if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') return 'GitHub rate limit reached.';
  if (response.status === 403) return 'GitHub permission error: token cannot create issues for this repo.';
  if (response.status === 404) return 'GitHub repo not found or token lacks access.';
  return `GitHub issue request failed with status ${response.status}.`;
}
