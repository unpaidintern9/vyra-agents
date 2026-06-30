#!/usr/bin/env node
import {
  archiveThreadOutbox,
  buildThreadBridgeStatus,
  ingestThreadOutbox,
  summarizeThreadOutbox,
  validateThreadBridge,
} from './thread-bridge-runtime.mjs';

const [command = 'status'] = process.argv.slice(2);

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
