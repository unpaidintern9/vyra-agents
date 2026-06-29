import { analyzeEngineeringImpact, migrationHistory, routeImpact, tableImpact } from './engineeringImpact';
import type { EngineeringGraph, EngineeringNode } from './engineeringTypes';

export type EngineeringReportFormat = 'json' | 'markdown';

export function downloadEngineeringGraph(graph: EngineeringGraph): void {
  downloadBlob('vyra-engineering-knowledge-graph.json', JSON.stringify(graph, null, 2), 'application/json');
}

export function downloadEngineeringReport(graph: EngineeringGraph): void {
  downloadBlob('vyra-engineering-knowledge-graph-report.md', buildEngineeringReportMarkdown(graph), 'text/markdown');
}

export function downloadNodeDetailReport(graph: EngineeringGraph, node: EngineeringNode, format: EngineeringReportFormat): void {
  const impact = analyzeEngineeringImpact(graph, node);
  const payload = {
    title: 'Engineering Node Detail Report',
    generatedAt: new Date().toISOString(),
    node,
    incomingRelationships: impact.directDependents.length,
    outgoingRelationships: impact.directDependencies.length,
    directDependencies: impact.directDependencies.map((item) => relationRow(item.node.label, item.node.type, item.edge.type)),
    directDependents: impact.directDependents.map((item) => relationRow(item.node.label, item.node.type, item.edge.type)),
  };
  downloadReport(`vyra-engineering-node-detail-${slug(node.label)}`, payload, format);
}

export function downloadNodeImpactReport(graph: EngineeringGraph, node: EngineeringNode, format: EngineeringReportFormat): void {
  const impact = analyzeEngineeringImpact(graph, node);
  const payload = {
    title: 'Engineering Node Impact Report',
    generatedAt: new Date().toISOString(),
    selectedNode: node,
    riskLevel: impact.riskLevel,
    riskReasons: impact.riskReasons,
    affectedRepos: impact.affectedRepos,
    affectedRoutes: impact.affectedRoutes.map(nodeSummary),
    affectedComponents: impact.affectedComponents.map(nodeSummary),
    affectedSupabaseFunctions: impact.affectedSupabaseFunctions.map(nodeSummary),
    affectedTables: impact.affectedTables.map(nodeSummary),
    affectedMigrations: impact.affectedMigrations.map(nodeSummary),
    directDependents: impact.directDependents.map((item) => relationRow(item.node.label, item.node.type, item.edge.type)),
    directDependencies: impact.directDependencies.map((item) => relationRow(item.node.label, item.node.type, item.edge.type)),
  };
  downloadReport(`vyra-engineering-impact-${slug(node.label)}`, payload, format);
}

export function downloadFullImpactSummary(graph: EngineeringGraph, format: EngineeringReportFormat): void {
  const highRiskNodes = graph.nodes
    .filter((node) => analyzeEngineeringImpact(graph, node).riskLevel === 'high')
    .slice(0, 120)
    .map(nodeSummary);
  const payload = {
    title: 'Engineering Impact Summary',
    generatedAt: new Date().toISOString(),
    summary: graph.summary,
    highRiskNodes,
    repositories: graph.repositories,
  };
  downloadReport('vyra-engineering-impact-summary', payload, format);
}

export function downloadTableImpactReport(graph: EngineeringGraph, node: EngineeringNode, format: EngineeringReportFormat): void {
  const impact = tableImpact(graph, node);
  const payload = {
    title: 'Engineering Table Impact Report',
    generatedAt: new Date().toISOString(),
    table: node,
    migrations: impact.migrations.map(nodeSummary),
    policies: impact.policies.map(nodeSummary),
    functions: impact.functions.map(nodeSummary),
    files: impact.files.map(nodeSummary),
    services: impact.services.map(nodeSummary),
    routes: impact.routes.map(nodeSummary),
  };
  downloadReport(`vyra-engineering-table-impact-${slug(node.label)}`, payload, format);
}

export function downloadRouteImpactReport(graph: EngineeringGraph, node: EngineeringNode, format: EngineeringReportFormat): void {
  const impact = routeImpact(graph, node);
  const payload = {
    title: 'Engineering Route Screen Impact Report',
    generatedAt: new Date().toISOString(),
    routeOrScreen: node,
    ownerFiles: impact.ownerFiles.map(nodeSummary),
    components: impact.components.map(nodeSummary),
    hooks: impact.hooks.map(nodeSummary),
    services: impact.services.map(nodeSummary),
    tables: impact.tables.map(nodeSummary),
    functions: impact.functions.map(nodeSummary),
  };
  downloadReport(`vyra-engineering-route-impact-${slug(node.label)}`, payload, format);
}

export function downloadMigrationHistoryReport(graph: EngineeringGraph, node: EngineeringNode, format: EngineeringReportFormat): void {
  const history = migrationHistory(graph, node);
  const payload = {
    title: 'Engineering Migration History Report',
    generatedAt: new Date().toISOString(),
    selectedNode: node,
    migrations: history.migrations.map(nodeSummary),
    createdTables: history.createdTables.map(nodeSummary),
    alteredTables: history.alteredTables.map(nodeSummary),
    policies: history.policies.map(nodeSummary),
    relatedFiles: history.relatedFiles.map(nodeSummary),
  };
  downloadReport(`vyra-engineering-migration-history-${slug(node.label)}`, payload, format);
}

export function buildEngineeringReportMarkdown(graph: EngineeringGraph): string {
  return toMarkdown({
    title: 'Engineering Agent Knowledge Graph Report',
    generatedAt: new Date().toISOString(),
    summary: graph.summary,
    repositories: graph.repositories,
    warnings: graph.warnings,
  });
}

function downloadReport(slugBase: string, payload: object, format: EngineeringReportFormat): void {
  const content = format === 'json' ? JSON.stringify(payload, null, 2) : toMarkdown(payload);
  downloadBlob(`${slugBase}.${format === 'json' ? 'json' : 'md'}`, content, format === 'json' ? 'application/json' : 'text/markdown');
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

function toMarkdown(payload: object): string {
  const lines: string[] = [];
  appendValue(lines, payload, 1, 'Engineering Report');
  return `${lines.join('\n').trim()}\n`;
}

function appendValue(lines: string[], value: unknown, level: number, title?: string): void {
  if (title) lines.push(`${'#'.repeat(Math.min(level, 6))} ${title}`, '');
  if (Array.isArray(value)) {
    if (!value.length) {
      lines.push('- None', '');
      return;
    }
    value.forEach((item, index) => appendValue(lines, item, Math.min(level + 1, 6), `Item ${index + 1}`));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, nested]) => {
      if (Array.isArray(nested) || (nested && typeof nested === 'object')) {
        appendValue(lines, nested, Math.min(level + 1, 6), labelize(key));
      } else {
        lines.push(`- ${labelize(key)}: ${String(nested ?? '')}`);
      }
    });
    lines.push('');
  }
}

function nodeSummary(node: EngineeringNode) {
  return {
    id: node.id,
    label: node.label,
    type: node.type,
    repo: node.repo,
    path: node.path,
    status: node.status,
  };
}

function relationRow(label: string, type: string, relationship: string) {
  return { label, type, relationship };
}

function labelize(value: string): string {
  return value.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'node';
}
