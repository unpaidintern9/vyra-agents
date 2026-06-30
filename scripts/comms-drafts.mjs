#!/usr/bin/env node
import {
  archiveCommunicationDraft,
  createCommunicationDraft,
  getCommunicationDraftReport,
  reviewCommunicationDraft,
  validateCommunicationDraftLayer,
} from './comms-draft-runtime.mjs';

const [command = 'drafts'] = process.argv.slice(2);
const args = parseArgs(process.argv.slice(3));

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'drafts':
    outputJson(getCommunicationDraftReport());
    break;
  case 'create-draft':
    outputJson(
      createCommunicationDraft({
        type: args.type,
        channel: args.channel,
        title: args.title,
        recipientName: args.recipientName ?? args.recipient,
        recipientContact: args.recipientContact ?? args.contact,
        subject: args.subject,
        body: args.body,
        sourceApprovalId: args.sourceApprovalId ?? args.approval,
        createdBy: args.createdBy ?? args.agent,
      }),
    );
    break;
  case 'review':
    outputJson(
      reviewCommunicationDraft({
        id: args.id ?? args.item ?? '',
        decision: args.decision ?? 'approved_local',
        reviewer: args.reviewer ?? args.operator ?? 'local operator',
        notes: args.notes ?? 'Reviewed locally. Not sent.',
      }),
    );
    break;
  case 'archive':
    outputJson(archiveCommunicationDraft(args.id ?? args.item));
    break;
  case 'validate': {
    const result = validateCommunicationDraftLayer();
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown communication draft command: ${command}\n`);
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
