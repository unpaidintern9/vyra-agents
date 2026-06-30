#!/usr/bin/env node
import {
  createEmailDraft,
  getEmailAuditReport,
  getEmailDraftsReport,
  getEmailSafetyCheck,
  getEmailStatus,
  sendEmailDraft,
  sendPendingEmails,
  validateEmailConnector,
} from './gmail-email-runtime.mjs';

const [command = 'status'] = process.argv.slice(2);
const args = parseArgs(process.argv.slice(3));

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'status':
    outputJson(getEmailStatus());
    break;
  case 'drafts':
    outputJson(getEmailDraftsReport());
    break;
  case 'create-draft':
    outputJson(createEmailDraft(args));
    break;
  case 'send':
    outputJson(await sendEmailDraft(args));
    break;
  case 'send-pending':
    outputJson(await sendPendingEmails(args));
    break;
  case 'audit':
    outputJson(getEmailAuditReport());
    break;
  case 'validate': {
    const result = validateEmailConnector();
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  case 'safety-check': {
    const result = getEmailSafetyCheck();
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown email command: ${command}\n`);
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
