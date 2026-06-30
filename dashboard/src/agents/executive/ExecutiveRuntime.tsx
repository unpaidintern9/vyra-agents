import { ListChecks } from 'lucide-react';
import type { ExecutiveRuntimeSummary } from './executiveTypes';

export function ExecutiveRuntime({ runtime }: { runtime: ExecutiveRuntimeSummary }) {
  const facts = [
    ['Runtime Version', runtime.runtimeVersion],
    ['Registered Agents', String(runtime.registeredAgents)],
    ['Registered Workflows', String(runtime.registeredWorkflows)],
    ['Runtime Memory', runtime.runtimeMemory],
    ['Sync Engine', runtime.syncEngine],
    ['Audit Engine', runtime.auditEngine],
    ['Approval Engine', runtime.approvalEngine],
    ['Permission Engine', runtime.permissionEngine],
    ['Registry Health', runtime.registryHealth],
  ];

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <ListChecks size={18} />
          <h2>Runtime Summary</h2>
        </div>
        <span>Phase 18 shared runtime</span>
      </div>
      <div className="batch-grid">
        {facts.map(([label, value]) => (
          <div className="fact" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
