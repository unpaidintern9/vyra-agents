#!/usr/bin/env node
import {
  archiveSharedTask,
  assignSharedTask,
  buildSharedTaskStatus,
  claimSharedTask,
  completeSharedTask,
  createSharedTask,
  escalateSharedTask,
  getSharedTaskReport,
  listSharedTasks,
  validateSharedTaskLayer,
} from './shared-task-runtime.mjs';

const [command = 'status'] = process.argv.slice(2);
const args = parseArgs(process.argv.slice(3));

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'status':
    outputJson(buildSharedTaskStatus());
    break;
  case 'list':
    outputJson({
      title: 'Shared Task List',
      tasks: listSharedTasks().map((item) => item.parsed),
      summary: buildSharedTaskStatus(),
    });
    break;
  case 'create':
    outputJson(createSharedTask(args));
    break;
  case 'assign':
    outputJson(
      args.escalate
        ? escalateSharedTask({ id: args.id ?? args.task ?? '', operator: args.operator ?? 'local operator', notes: args.notes })
        : assignSharedTask({
            id: args.id ?? args.task ?? '',
            assignedAgent: args.assignedAgent ?? args.agent,
            operator: args.operator ?? 'local operator',
            notes: args.notes,
            priority: args.priority,
          }),
    );
    break;
  case 'claim':
    outputJson(
      claimSharedTask({
        id: args.id ?? args.task ?? '',
        agent: args.agent ?? args.assignedAgent,
        operator: args.operator ?? 'local operator',
        notes: args.notes,
      }),
    );
    break;
  case 'complete':
    outputJson(completeSharedTask({ id: args.id ?? args.task ?? '', operator: args.operator ?? 'local operator', notes: args.notes }));
    break;
  case 'archive':
    outputJson(archiveSharedTask({ id: args.id ?? args.task ?? '', operator: args.operator ?? 'local operator', notes: args.notes }));
    break;
  case 'report':
    outputJson(getSharedTaskReport());
    break;
  case 'validate': {
    const result = validateSharedTaskLayer();
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown shared task command: ${command}\n`);
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
