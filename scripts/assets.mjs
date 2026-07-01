#!/usr/bin/env node
import {
  addAsset,
  approveAsset,
  archiveAsset,
  buildAssetReports,
  getAssetUsage,
  getAssetVersions,
  getKnowledgeLibrary,
  listAssets,
  searchAssets,
  updateAsset,
  validateAssets,
} from './asset-library-runtime.mjs';

const command = process.argv[2] ?? 'list';

const commands = {
  list: listAssets,
  add: addAsset,
  update: updateAsset,
  search: searchAssets,
  approve: approveAsset,
  archive: archiveAsset,
  versions: getAssetVersions,
  usage: getAssetUsage,
  knowledge: getKnowledgeLibrary,
  report: buildAssetReports,
  validate: validateAssets,
};

if (!commands[command]) {
  process.stderr.write(`Unknown assets command: ${command}\n`);
  process.stderr.write(`Available commands: ${Object.keys(commands).join(', ')}\n`);
  process.exit(1);
}

const result = commands[command]();
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result?.status === 'fail') process.exit(1);
