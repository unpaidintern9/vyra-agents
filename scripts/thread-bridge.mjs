#!/usr/bin/env node
import {
  archiveThreadOutbox,
  buildThreadBridgeStatus,
  decideApprovalQueueItem,
  getApprovalQueueReport,
  getThreadSchedules,
  ingestThreadOutbox,
  runDueThreadSchedules,
  summarizeThreadOutbox,
  validateThreadBridge,
} from './thread-bridge-runtime.mjs';

const [command = 'status'] = process.argv.slice(2);
const args = parseArgs(process.argv.slice(3));

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'status':
    outputJson(buildThreadBridgeStatus());
    break;
  case 'ingest':
    outputJson(ingestThreadOutbox());
    break;
  case 'summary':
    outputJson(summarizeThreadOutbox());
    break;
  case 'archive':
    outputJson(archiveThreadOutbox());
    break;
  case 'schedules':
    outputJson(getThreadSchedules());
    break;
  case 'run-due':
    outputJson(runDueThreadSchedules());
    break;
  case 'approval-queue':
    outputJson(getApprovalQueueReport());
    break;
  case 'approve':
    outputJson(
      decideApprovalQueueItem({
        id: args.id ?? args.item ?? '',
        decision: 'approved',
        operator: args.operator ?? args.operatorName ?? 'local operator',
        reason: args.reason ?? 'Approved locally for review. External action remains blocked.',
      }),
    );
    break;
  case 'reject':
    outputJson(
      decideApprovalQueueItem({
        id: args.id ?? args.item ?? '',
        decision: 'rejected',
        operator: args.operator ?? args.operatorName ?? 'local operator',
        reason: args.reason ?? 'Rejected locally. External action remains blocked.',
      }),
    );
    break;
  case 'validate': {
    const result = validateThreadBridge();
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown thread bridge command: ${command}\n`);
    process.exitCode = 1;
}

function parseArgs(rawArgs) {
  return rawArgs.reduce((result, arg, index) => {
    if (!arg.startsWith('--')) return result;
    const [key, inlineValue] = arg.slice(2).split('=');
    result[key] = inlineValue ?? rawArgs[index + 1] ?? true;
    return result;
  }, {});
}
