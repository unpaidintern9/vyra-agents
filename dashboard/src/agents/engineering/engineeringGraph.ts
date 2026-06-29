import { engineeringMockGraph } from './engineeringMockData';
import type { EngineeringGraph, EngineeringScanResult } from './engineeringTypes';

export async function loadEngineeringGraph(): Promise<EngineeringScanResult> {
  try {
    const response = await fetch('/engineering-graph.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`graph_http_${response.status}`);
    }
    const graph = (await response.json()) as EngineeringGraph;
    if (!isEngineeringGraph(graph)) {
      throw new Error('graph_invalid');
    }
    return {
      graph,
      loadedAt: new Date().toISOString(),
      source: 'generated-json',
    };
  } catch {
    return {
      graph: engineeringMockGraph,
      loadedAt: new Date().toISOString(),
      source: 'mock-fallback',
    };
  }
}

export function buildEngineeringReportMarkdown(graph: EngineeringGraph): string {
  const lines = [
    '# Engineering Agent Knowledge Graph Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    'Safety note: read-only scan, metadata only, no production writes.',
    '',
    '## Summary',
    '',
    `- Repositories indexed: ${graph.summary.repositoriesIndexed}`,
    `- Missing repositories: ${graph.summary.repositoriesMissing}`,
    `- Files indexed: ${graph.summary.filesIndexed}`,
    `- Routes found: ${graph.summary.routes}`,
    `- Components found: ${graph.summary.components}`,
    `- Supabase functions: ${graph.summary.supabaseFunctions}`,
    `- Migrations: ${graph.summary.migrations}`,
    `- Tables: ${graph.summary.tables}`,
    `- Dependencies: ${graph.summary.dependencies}`,
    `- Env variable names: ${graph.summary.envVariableNames}`,
    `- Docs: ${graph.summary.docs}`,
    '',
    '## Repositories',
    '',
  ];

  graph.repositories.forEach((repo) => {
    lines.push(
      `### ${repo.name}`,
      '',
      `- Status: ${repo.status}`,
      `- Branch: ${repo.branch}`,
      `- Latest commit: ${repo.latestCommit}`,
      `- Dirty: ${repo.dirty ? 'Yes' : 'No'}`,
      `- Files indexed: ${repo.filesIndexed}`,
      `- Functions: ${repo.functions}`,
      `- Migrations: ${repo.migrations}`,
      `- Tables: ${repo.tables}`,
      '',
    );
  });

  if (graph.warnings.length) {
    lines.push('## Warnings', '');
    graph.warnings.forEach((warning) => lines.push(`- ${warning}`));
    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

export function downloadEngineeringGraph(graph: EngineeringGraph): void {
  downloadBlob('vyra-engineering-knowledge-graph.json', JSON.stringify(graph, null, 2), 'application/json');
}

export function downloadEngineeringReport(graph: EngineeringGraph): void {
  downloadBlob('vyra-engineering-knowledge-graph-report.md', buildEngineeringReportMarkdown(graph), 'text/markdown');
}

function downloadBlob(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function isEngineeringGraph(value: EngineeringGraph): value is EngineeringGraph {
  return Boolean(value?.schemaVersion && Array.isArray(value.nodes) && Array.isArray(value.edges) && value.summary);
}
