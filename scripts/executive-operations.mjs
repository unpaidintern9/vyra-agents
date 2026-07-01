#!/usr/bin/env node
import { parseArgs } from './agent-operator-runtime.mjs';
import {
  addDecision,
  createGoal,
  createInitiative,
  createKpi,
  getGoalReport,
  getKpiReport,
  getPlanningReport,
  listBlockers,
  listDecisions,
  listGoals,
  listInitiatives,
  listKpis,
  updateGoal,
  updateKpi,
  validateExecutivePlanning,
} from './executive-planning-runtime.mjs';
import {
  getExecutiveBriefing,
  getExecutiveHealth,
  getExecutiveKpis,
  getExecutiveOperations,
  getExecutiveOperationsReport,
  validateExecutiveOperations,
} from './executive-operations-runtime.mjs';

const [command = 'operations', ...args] = process.argv.slice(2);
const options = parseArgs(args);

const outputJson = (payload) => {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
};

switch (command) {
  case 'briefing':
    outputJson(getExecutiveBriefing(options));
    break;
  case 'kpis':
    outputJson(options.operations ? getExecutiveKpis(options) : listKpis(options));
    break;
  case 'goals':
    outputJson(listGoals(options));
    break;
  case 'create-goal':
    outputJson(createGoal(options));
    break;
  case 'update-goal':
    outputJson(updateGoal(options));
    break;
  case 'create-kpi':
    outputJson(createKpi(options));
    break;
  case 'update-kpi':
    outputJson(updateKpi(options));
    break;
  case 'initiatives':
    outputJson(listInitiatives(options));
    break;
  case 'create-initiative':
    outputJson(createInitiative(options));
    break;
  case 'decision-log':
    outputJson(listDecisions(options));
    break;
  case 'add-decision':
    outputJson(addDecision(options));
    break;
  case 'blockers':
    outputJson(listBlockers(options));
    break;
  case 'goal-report':
    outputJson(getGoalReport(options));
    break;
  case 'kpi-report':
    outputJson(getKpiReport(options));
    break;
  case 'planning-report':
    outputJson(getPlanningReport(options));
    break;
  case 'operations':
    outputJson(getExecutiveOperations(options));
    break;
  case 'health':
    outputJson(getExecutiveHealth(options));
    break;
  case 'report':
    outputJson(getExecutiveOperationsReport(options));
    break;
  case 'validate': {
    const operations = validateExecutiveOperations(options);
    const planning = validateExecutivePlanning(options);
    const result = {
      ...operations,
      status: operations.status === 'pass' && planning.status === 'pass' ? 'pass' : 'fail',
      planning,
      commands: [...new Set([...(operations.commands || []), ...(planning.commands || [])])],
      errors: [...(operations.errors || []), ...(planning.errors || [])],
    };
    outputJson(result);
    process.exitCode = result.status === 'pass' ? 0 : 1;
    break;
  }
  default:
    process.stderr.write(`Unknown executive operations command: ${command}\n`);
    process.exitCode = 1;
}
