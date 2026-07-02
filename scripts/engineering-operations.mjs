#!/usr/bin/env node
import {
  getEngineeringHealth,
  getFeatures,
  getFeedback,
  getIssues,
  getProducts,
  getReleaseReport,
  getReleases,
  getRoadmapReport,
  getRoadmaps,
  validateEngineeringOperations,
} from './engineering-operations-runtime.mjs';

const command = process.argv[2] ?? 'products';
const commands = {
  products: getProducts,
  features: getFeatures,
  roadmaps: getRoadmaps,
  issues: getIssues,
  releases: getReleases,
  feedback: getFeedback,
  health: getEngineeringHealth,
  'roadmap-report': getRoadmapReport,
  'release-report': getReleaseReport,
  validate: validateEngineeringOperations,
};

if (!commands[command]) {
  process.stderr.write(`Unknown engineering command: ${command}\n`);
  process.stderr.write(`Available commands: ${Object.keys(commands).join(', ')}\n`);
  process.exit(1);
}

const result = commands[command]();
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result?.status === 'fail') process.exit(1);
