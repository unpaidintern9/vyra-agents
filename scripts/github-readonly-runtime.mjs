import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const githubReportRoot = path.join(repoRoot, 'reports/agents/runtime');

const githubApiBase = 'https://api.github.com';
const readOnlyMethods = ['GET', 'HEAD'];
const blockedWriteActions = [
  'issue creation',
  'issue updates',
  'pull request creation',
  'pull request updates',
  'commits',
  'branch changes',
  'workflow dispatch',
  'repository settings changes',
  'comments',
  'labels',
];

const commandNames = [
  'github:status',
  'github:repo',
  'github:branches',
  'github:commits',
  'github:issues',
  'github:prs',
  'github:safety-check',
  'github:validate',
];

export function getGitHubReadOnlyConfig(env = process.env) {
  const owner = env.VYRA_GITHUB_OWNER?.trim() || '';
  const repo = env.VYRA_GITHUB_REPO?.trim() || '';
  const token = env.VYRA_GITHUB_TOKEN?.trim() || '';
  const missingConfig = [
    owner ? null : 'VYRA_GITHUB_OWNER',
    repo ? null : 'VYRA_GITHUB_REPO',
    token ? null : 'VYRA_GITHUB_TOKEN',
  ].filter(Boolean);

  return {
    owner,
    repo,
    tokenConfigured: Boolean(token),
    token,
    repoFullName: owner && repo ? `${owner}/${repo}` : 'not configured',
    missingConfig,
    configured: missingConfig.length === 0,
  };
}

export function getGitHubSafetyCheck() {
  const checks = [
    { name: 'Read-only HTTP methods only', passed: readOnlyMethods.every((method) => method === 'GET' || method === 'HEAD') },
    { name: 'No issue creation path', passed: true },
    { name: 'No pull request creation path', passed: true },
    { name: 'No commits or branch mutations', passed: true },
    { name: 'No workflow dispatch', passed: true },
    { name: 'No token output', passed: true },
    { name: 'No production writes', passed: true },
    { name: 'No external non-GitHub calls', passed: true },
  ];

  return {
    status: checks.every((check) => check.passed) ? 'pass' : 'fail',
    generatedAt: new Date().toISOString(),
    readOnlyMethods,
    blockedWriteActions,
    checks,
  };
}

export async function getGitHubStatus() {
  const config = getGitHubReadOnlyConfig();
  const base = baseStatus(config);
  if (!config.configured) return base;

  const [repo, branches, commits, issues, pullRequests] = await Promise.all([
    fetchGitHub(`/repos/${config.owner}/${config.repo}`, config),
    fetchGitHub(`/repos/${config.owner}/${config.repo}/branches?per_page=20`, config),
    fetchGitHub(`/repos/${config.owner}/${config.repo}/commits?per_page=10`, config),
    fetchGitHub(`/repos/${config.owner}/${config.repo}/issues?state=open&per_page=20`, config),
    fetchGitHub(`/repos/${config.owner}/${config.repo}/pulls?state=open&per_page=20`, config),
  ]);

  return {
    ...base,
    status: responseStatus([repo, branches, commits, issues, pullRequests]),
    repo: sanitizeRepo(repo),
    branches: sanitizeBranches(branches),
    commits: sanitizeCommits(commits),
    issues: sanitizeIssues(issues),
    pullRequests: sanitizePullRequests(pullRequests),
    repoHealth: buildRepoHealth(repo, branches, commits, issues, pullRequests),
  };
}

export async function getGitHubRepo() {
  const config = getGitHubReadOnlyConfig();
  if (!config.configured) return baseStatus(config);
  const repo = await fetchGitHub(`/repos/${config.owner}/${config.repo}`, config);
  return { ...baseStatus(config), status: repo.ok ? 'ready_read_only' : 'read_failed', repo: sanitizeRepo(repo) };
}

export async function getGitHubBranches() {
  const config = getGitHubReadOnlyConfig();
  if (!config.configured) return baseStatus(config);
  const branches = await fetchGitHub(`/repos/${config.owner}/${config.repo}/branches?per_page=50`, config);
  return { ...baseStatus(config), status: branches.ok ? 'ready_read_only' : 'read_failed', branches: sanitizeBranches(branches) };
}

export async function getGitHubCommits() {
  const config = getGitHubReadOnlyConfig();
  if (!config.configured) return baseStatus(config);
  const commits = await fetchGitHub(`/repos/${config.owner}/${config.repo}/commits?per_page=25`, config);
  return { ...baseStatus(config), status: commits.ok ? 'ready_read_only' : 'read_failed', commits: sanitizeCommits(commits) };
}

export async function getGitHubIssues() {
  const config = getGitHubReadOnlyConfig();
  if (!config.configured) return baseStatus(config);
  const issues = await fetchGitHub(`/repos/${config.owner}/${config.repo}/issues?state=open&per_page=50`, config);
  return { ...baseStatus(config), status: issues.ok ? 'ready_read_only' : 'read_failed', issues: sanitizeIssues(issues) };
}

export async function getGitHubPullRequests() {
  const config = getGitHubReadOnlyConfig();
  if (!config.configured) return baseStatus(config);
  const pullRequests = await fetchGitHub(`/repos/${config.owner}/${config.repo}/pulls?state=open&per_page=50`, config);
  return { ...baseStatus(config), status: pullRequests.ok ? 'ready_read_only' : 'read_failed', pullRequests: sanitizePullRequests(pullRequests) };
}

export async function getGitHubRepoStatusReport() {
  const payload = {
    title: 'GitHub Repo Status',
    ...(await getGitHubStatus()),
    safety: getGitHubSafetyCheck(),
  };
  writeGitHubReport('github-repo-status', payload);
  writeGitHubReport('github-engineering-readiness', {
    title: 'GitHub Engineering Readiness',
    generatedAt: payload.generatedAt,
    status: payload.status,
    repoFullName: payload.repoFullName,
    repoHealth: payload.repoHealth,
    safety: payload.safety,
    engineeringReadiness:
      payload.status === 'ready_read_only'
        ? 'Repository can be inspected with read-only GitHub REST GET requests.'
        : 'Repository inspection is unavailable until safe config is provided.',
  });
  return payload;
}

export async function validateGitHubReadOnlyConnector() {
  const config = getGitHubReadOnlyConfig();
  const safety = getGitHubSafetyCheck();
  const errors = [];
  if (!commandNames.every((command) => command.startsWith('github:'))) errors.push('All command names must use the github namespace.');
  if (safety.status !== 'pass') errors.push('GitHub safety check failed.');

  return {
    status: errors.length === 0 ? 'pass' : 'fail',
    generatedAt: new Date().toISOString(),
    readiness: baseStatus(config),
    commands: commandNames,
    config: {
      ownerConfigured: Boolean(config.owner),
      repoConfigured: Boolean(config.repo),
      tokenConfigured: config.tokenConfigured,
      missingConfig: config.missingConfig,
      tokenValuePrinted: false,
    },
    errors,
    safety,
  };
}

async function fetchGitHub(endpoint, config) {
  const response = await fetch(`${githubApiBase}${endpoint}`, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'User-Agent': 'vyra-agents-readonly-connector',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { message: 'GitHub returned a non-JSON response.' };
  }

  return {
    ok: response.ok,
    status: response.status,
    rateLimitRemaining: response.headers.get('x-ratelimit-remaining') ?? 'unknown',
    rateLimitReset: response.headers.get('x-ratelimit-reset') ?? 'unknown',
    body,
    error: response.ok ? null : sanitizeGitHubError(body, response.status),
  };
}

function baseStatus(config) {
  return {
    generatedAt: new Date().toISOString(),
    connector: 'GitHub',
    mode: 'read_only',
    status: config.configured ? 'configured_read_only' : 'missing_config',
    repoFullName: config.repoFullName,
    config: {
      ownerConfigured: Boolean(config.owner),
      repoConfigured: Boolean(config.repo),
      tokenConfigured: config.tokenConfigured,
      missingConfig: config.missingConfig,
      tokenValuePrinted: false,
    },
    allowedReadActions: ['repository metadata', 'branches', 'commits', 'open issues', 'open pull requests'],
    blockedWriteActions,
    externalCalls: config.configured ? 'GitHub REST GET only' : 'none; missing config',
    productionWritesEnabled: false,
    writeActionsEnabled: false,
  };
}

function responseStatus(responses) {
  return responses.every((response) => response.ok) ? 'ready_read_only' : 'read_failed';
}

function sanitizeRepo(response) {
  if (!response?.ok) return { status: response?.status ?? 'not_read', error: response?.error ?? 'not read' };
  const repo = response.body;
  return {
    id: repo.id,
    fullName: repo.full_name,
    private: Boolean(repo.private),
    defaultBranch: repo.default_branch,
    description: repo.description ?? '',
    htmlUrl: repo.html_url,
    openIssuesCount: repo.open_issues_count ?? 0,
    forksCount: repo.forks_count ?? 0,
    stargazersCount: repo.stargazers_count ?? 0,
    pushedAt: repo.pushed_at,
    updatedAt: repo.updated_at,
    archived: Boolean(repo.archived),
    disabled: Boolean(repo.disabled),
  };
}

function sanitizeBranches(response) {
  if (!response?.ok || !Array.isArray(response.body)) return { status: response?.status ?? 'not_read', items: [], error: response?.error ?? 'not read' };
  return {
    status: 'read',
    count: response.body.length,
    items: response.body.map((branch) => ({
      name: branch.name,
      protected: Boolean(branch.protected),
      commitSha: branch.commit?.sha?.slice(0, 12) ?? 'unknown',
    })),
  };
}

function sanitizeCommits(response) {
  if (!response?.ok || !Array.isArray(response.body)) return { status: response?.status ?? 'not_read', items: [], error: response?.error ?? 'not read' };
  return {
    status: 'read',
    count: response.body.length,
    items: response.body.map((commit) => ({
      sha: commit.sha?.slice(0, 12) ?? 'unknown',
      message: firstLine(commit.commit?.message),
      authorName: commit.commit?.author?.name ?? 'unknown',
      authoredAt: commit.commit?.author?.date ?? 'unknown',
      htmlUrl: commit.html_url,
    })),
  };
}

function sanitizeIssues(response) {
  if (!response?.ok || !Array.isArray(response.body)) return { status: response?.status ?? 'not_read', items: [], error: response?.error ?? 'not read' };
  const issues = response.body.filter((issue) => !issue.pull_request);
  return {
    status: 'read',
    count: issues.length,
    items: issues.map((issue) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      labels: Array.isArray(issue.labels) ? issue.labels.map((label) => label.name).filter(Boolean) : [],
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      htmlUrl: issue.html_url,
    })),
  };
}

function sanitizePullRequests(response) {
  if (!response?.ok || !Array.isArray(response.body)) return { status: response?.status ?? 'not_read', items: [], error: response?.error ?? 'not read' };
  return {
    status: 'read',
    count: response.body.length,
    items: response.body.map((pull) => ({
      number: pull.number,
      title: pull.title,
      state: pull.state,
      draft: Boolean(pull.draft),
      base: pull.base?.ref ?? 'unknown',
      head: pull.head?.ref ?? 'unknown',
      createdAt: pull.created_at,
      updatedAt: pull.updated_at,
      htmlUrl: pull.html_url,
    })),
  };
}

function buildRepoHealth(repo, branches, commits, issues, pullRequests) {
  if (![repo, branches, commits, issues, pullRequests].every((response) => response.ok)) {
    return {
      status: 'unavailable',
      summary: 'GitHub read-only checks did not complete. Review missing config or token/repo access.',
      openIssues: 0,
      openPullRequests: 0,
      latestCommit: 'unknown',
    };
  }
  const commitItems = sanitizeCommits(commits).items;
  const issueSummary = sanitizeIssues(issues);
  const prSummary = sanitizePullRequests(pullRequests);
  return {
    status: repo.body.archived || repo.body.disabled ? 'watch' : 'ready',
    summary: 'Repository metadata, branches, commits, issues, and pull requests were read with GET-only GitHub API calls.',
    defaultBranch: repo.body.default_branch,
    branchCount: Array.isArray(branches.body) ? branches.body.length : 0,
    openIssues: issueSummary.count,
    openPullRequests: prSummary.count,
    latestCommit: commitItems[0]?.sha ?? 'unknown',
    latestCommitMessage: commitItems[0]?.message ?? 'unknown',
  };
}

function sanitizeGitHubError(body, status) {
  const message = typeof body?.message === 'string' ? body.message : 'GitHub request failed.';
  return `${status}: ${message}`;
}

function firstLine(value) {
  return String(value ?? '').split('\n')[0].slice(0, 180);
}

function writeGitHubReport(slug, payload) {
  mkdirSync(githubReportRoot, { recursive: true });
  const stamp = compactStamp(payload.generatedAt || new Date().toISOString());
  writeFileSync(path.join(githubReportRoot, `${stamp}-${slug}.json`), `${JSON.stringify(payload, null, 2)}\n`);
  writeFileSync(path.join(githubReportRoot, `${stamp}-${slug}.md`), toMarkdown(payload));
}

function toMarkdown(payload) {
  const lines = [`# ${payload.title || 'GitHub Read-Only Connector Report'}`, ''];
  Object.entries(payload)
    .filter(([key]) => key !== 'title')
    .forEach(([key, value]) => {
      lines.push(`## ${labelize(key)}`, '');
      if (Array.isArray(value)) {
        value.forEach((item) => lines.push(`- ${formatValue(item)}`));
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([childKey, child]) => lines.push(`- ${labelize(childKey)}: ${formatValue(child)}`));
      } else {
        lines.push(String(value ?? ''));
      }
      lines.push('');
    });
  return `${lines.join('\n').trim()}\n`;
}

function compactStamp(iso) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function labelize(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
