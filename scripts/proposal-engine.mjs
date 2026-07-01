#!/usr/bin/env node
import { parseArgs } from './agent-operator-runtime.mjs';
import {
  buildProposalReports,
  createProposal,
  getProposalHealth,
  listComplianceMatrix,
  listEvidenceLibrary,
  listProposalReadiness,
  listProposalReviews,
  listProposalSections,
  listProposalTimeline,
  listProposals,
  updateProposal,
  validateProposalEngine,
} from './proposal-engine-runtime.mjs';

const [command = 'list', ...args] = process.argv.slice(2);
const options = parseArgs(args);

const commands = {
  list: listProposals,
  create: createProposal,
  update: updateProposal,
  sections: listProposalSections,
  compliance: listComplianceMatrix,
  evidence: listEvidenceLibrary,
  review: listProposalReviews,
  timeline: listProposalTimeline,
  readiness: listProposalReadiness,
  health: getProposalHealth,
  report: buildProposalReports,
  validate: validateProposalEngine,
};

if (!commands[command]) {
  process.stderr.write(`Unknown proposal command: ${command}\n`);
  process.stderr.write(`Available commands: ${Object.keys(commands).join(', ')}\n`);
  process.exit(1);
}

const result = commands[command](options);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result?.status === 'fail') process.exit(1);
