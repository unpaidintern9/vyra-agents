#!/usr/bin/env node
import {
  buildExecutiveRunSummary,
  buildOperatorSnapshot,
  buildSafetyCheck,
  ensureReportDirectories,
  parseArgs,
  writeReport,
  writeReportSet,
} from './agent-operator-runtime.mjs';

const [command = 'status', ...rest] = process.argv.slice(2);
const options = parseArgs(rest);

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'status': {
    const snapshot = buildOperatorSnapshot(options);
    outputJson({
      operator: snapshot.operator,
      runtime: snapshot.runtime,
      safety: snapshot.safety.status,
      threadBridge: snapshot.threadBridge,
      communicationDrafts: snapshot.communicationDrafts,
      communicationProviders: snapshot.communicationProviders,
      sharedTasks: snapshot.sharedTasks,
      activeAgents: snapshot.runtime.agentsReady,
      plannedAgents: snapshot.runtime.agentsPlanned,
    });
    break;
  }
  case 'run': {
    const snapshot = buildOperatorSnapshot(options);
    const files = writeReportSet(snapshot);
    outputJson({ operator: snapshot.operator, reports: files, status: snapshot.safety.status });
    break;
  }
  case 'executive-summary': {
    const snapshot = buildOperatorSnapshot(options);
    const files = writeReport('executive', 'executive-run-summary', buildExecutiveRunSummary(snapshot));
    outputJson({ operator: snapshot.operator, reports: files, summary: buildExecutiveRunSummary(snapshot).summary });
    break;
  }
  case 'report': {
    const snapshot = buildOperatorSnapshot(options);
    const group = typeof options.agent === 'string' ? options.agent : 'runtime';
    const payloads = {
      executive: buildExecutiveRunSummary(snapshot),
      engineering: { title: 'Engineering Operator Summary', operator: snapshot.operator, summary: snapshot.engineering },
      sales: { title: 'Sales Operator Summary', operator: snapshot.operator, summary: snapshot.sales },
      migration: { title: 'Migration Operator Summary', operator: snapshot.operator, summary: snapshot.migration },
      runtime: { title: 'Runtime Operator Status', operator: snapshot.operator, summary: snapshot.runtime },
    };
    const safeGroup = Object.hasOwn(payloads, group) ? group : 'runtime';
    const files = writeReport(safeGroup, `${safeGroup}-operator-report`, payloads[safeGroup]);
    outputJson({ operator: snapshot.operator, reports: files });
    break;
  }
  case 'safety-check': {
    outputJson(buildSafetyCheck(buildOperatorSnapshot(options).operator));
    break;
  }
  case 'graph': {
    const snapshot = buildOperatorSnapshot(options);
    const files = writeReport('runtime', 'cross-agent-operator-graph', snapshot.graph);
    outputJson({ operator: snapshot.operator, reports: files, graph: snapshot.graph });
    break;
  }
  case 'validate': {
    ensureReportDirectories();
    const snapshot = buildOperatorSnapshot(options);
    const requiredCommands = ['status', 'run', 'executive-summary', 'report', 'safety-check', 'graph', 'validate'];
    outputJson({
      operator: snapshot.operator,
      status: snapshot.safety.status,
      requiredCommands,
      reportsDirectoryReady: true,
      safetyChecks: snapshot.safety.checks,
    });
    process.exitCode = snapshot.safety.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown agent operator command: ${command}\n`);
    process.exitCode = 1;
}
