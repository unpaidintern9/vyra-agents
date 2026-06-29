export interface GitHubRepoConfig {
  name: string;
  owner: string;
  fullName: string;
}

const defaultOwner = 'unpaidintern9';
const defaultRepos = [
  'unpaidintern9/vyra-agents',
  'Matthewalbin1/Vyra-Part-1',
  'unpaidintern9/Vyra-Software',
  'unpaidintern9/vyra-website',
];

export function defaultGitHubOwner(): string {
  return import.meta.env.VITE_GITHUB_OWNER || defaultOwner;
}

export function parseGitHubRepos(value?: string, fallbackOwner = defaultGitHubOwner()): GitHubRepoConfig[] {
  const entries = value
    ? value
        .split(',')
        .map((repo) => repo.trim())
        .filter(Boolean)
    : defaultRepos;

  return entries.map((entry) => normalizeGitHubRepo(entry, fallbackOwner));
}

export function resolveGitHubRepo(repo: string, fallbackOwner = defaultGitHubOwner()): GitHubRepoConfig {
  const configured = parseGitHubRepos(import.meta.env.VITE_GITHUB_REPOS, fallbackOwner);
  return configured.find((candidate) => candidate.name === repo || candidate.fullName === repo) ?? normalizeGitHubRepo(repo, fallbackOwner);
}

function normalizeGitHubRepo(value: string, fallbackOwner: string): GitHubRepoConfig {
  const [ownerPart, repoPart] = value.includes('/') ? value.split('/', 2) : [fallbackOwner, value];
  const owner = ownerPart.trim() || fallbackOwner;
  const name = repoPart.trim();
  return {
    fullName: `${owner}/${name}`,
    name,
    owner,
  };
}
