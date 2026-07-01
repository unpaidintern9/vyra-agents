#!/usr/bin/env node
import {
  buildExecutiveEmailBriefing,
  getExecutiveEmailPreview,
  getExecutiveEmailStatus,
  sendExecutiveEmailBriefing,
  validateExecutiveEmailBriefing,
} from './executive-email-briefing-runtime.mjs';

const [command = 'briefing'] = process.argv.slice(2);
const args = parseArgs(process.argv.slice(3));

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'briefing':
    outputJson(buildExecutiveEmailBriefing(args));
    break;
  case 'preview':
    outputJson(getExecutiveEmailPreview(args));
    break;
  case 'send':
    outputJson(await sendExecutiveEmailBriefing(args));
    break;
  case 'status':
    outputJson(getExecutiveEmailStatus(args));
    break;
  case 'validate': {
    const result = validateExecutiveEmailBriefing(args);
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown executive email briefing command: ${command}\n`);
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
