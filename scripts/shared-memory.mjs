#!/usr/bin/env node
import {
  addMemoryFact,
  addMemoryRelationship,
  buildMemoryReports,
  getMemoryAgentView,
  getMemoryAudit,
  getMemoryEntity,
  getMemoryGraph,
  listMemoryConflicts,
  listMemoryEntities,
  listMemoryFacts,
  listMemoryRelationships,
  reviewMemoryConflict,
  supersedeMemoryFact,
  updateMemoryFact,
  validateSharedMemory,
} from './shared-memory-runtime.mjs';

const [command = 'entities'] = process.argv.slice(2);

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

const commands = {
  entities: listMemoryEntities,
  entity: getMemoryEntity,
  facts: listMemoryFacts,
  'add-fact': addMemoryFact,
  'update-fact': updateMemoryFact,
  'supersede-fact': supersedeMemoryFact,
  relationships: listMemoryRelationships,
  'add-relationship': addMemoryRelationship,
  conflicts: listMemoryConflicts,
  'review-conflict': reviewMemoryConflict,
  'agent-view': getMemoryAgentView,
  graph: getMemoryGraph,
  audit: getMemoryAudit,
  report: buildMemoryReports,
  validate: validateSharedMemory,
};

if (!commands[command]) {
  process.stderr.write(`Unknown shared memory command: ${command}\n`);
  process.exitCode = 1;
} else {
  const payload = commands[command]();
  outputJson(payload);
  if (payload.status === 'fail') process.exitCode = 1;
}
