import { workflowMockData } from './workflowMockData';
import type { WorkflowDefinition } from './workflowTypes';

export function getWorkflowRegistry(): WorkflowDefinition[] {
  return workflowMockData;
}

