import { loadEngineeringGraph } from './engineeringGraph';
import type { EngineeringScanResult } from './engineeringTypes';

export async function runEngineeringScanFromDashboard(): Promise<EngineeringScanResult> {
  return loadEngineeringGraph();
}
