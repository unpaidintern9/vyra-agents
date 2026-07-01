#!/usr/bin/env node
import {
  getReleaseBlockers,
  getReleaseReadiness,
  getReleaseReport,
  getReleaseStatus,
  scanReleaseReadiness,
  validateReleaseReadiness,
} from './release-readiness-runtime.mjs';

const [command = 'status'] = process.argv.slice(2);

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'status':
    outputJson(getReleaseStatus());
    break;
  case 'scan':
    outputJson(scanReleaseReadiness());
    break;
  case 'readiness':
    outputJson(getReleaseReadiness());
    break;
  case 'blockers':
    outputJson(getReleaseBlockers());
    break;
  case 'report':
    outputJson(getReleaseReport());
    break;
  case 'validate': {
    const result = validateReleaseReadiness();
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown release command: ${command}\n`);
    process.exitCode = 1;
}
