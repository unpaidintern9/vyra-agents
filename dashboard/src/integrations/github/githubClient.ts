const githubApiBase = 'https://api.github.com';

export interface GitHubRequestConfig {
  token?: string;
}

export async function githubGet<T>(path: string, config: GitHubRequestConfig): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }

  const response = await fetch(`${githubApiBase}${path}`, {
    headers,
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`GitHub GET ${path} failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

