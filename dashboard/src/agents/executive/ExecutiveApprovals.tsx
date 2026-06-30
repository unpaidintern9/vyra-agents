import { ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { RiskBadge } from '../../components/RiskBadge';
import { StatusBadge } from '../../components/StatusBadge';
import type { RuntimeApproval } from '../../runtime/runtimeTypes';

export function ExecutiveApprovals({ approvals }: { approvals: RuntimeApproval[] }) {
  const [agent, setAgent] = useState('all');
  const [risk, setRisk] = useState('all');
  const [workflow, setWorkflow] = useState('all');
  const [status, setStatus] = useState('all');

  const filtered = approvals.filter((approval) => {
    const agentMatch = agent === 'all' || approval.agent === agent;
    const riskMatch = risk === 'all' || approval.risk === risk;
    const workflowMatch = workflow === 'all' || approval.workflow === workflow;
    const statusMatch = status === 'all' || approval.status === status;
    return agentMatch && riskMatch && workflowMatch && statusMatch;
  });

  const options = useMemo(
    () => ({
      agents: unique(approvals.map((approval) => approval.agent)),
      workflows: unique(approvals.map((approval) => approval.workflow)),
      statuses: unique(approvals.map((approval) => approval.status)),
    }),
    [approvals],
  );

  return (
    <section className="panel wide-panel">
      <div className="panel-header">
        <div>
          <ShieldCheck size={18} />
          <h2>Executive Approvals</h2>
        </div>
        <span>{filtered.length} visible</span>
      </div>
      <div className="filter-grid executive-filter-grid">
        <label>
          Agent
          <select value={agent} onChange={(event) => setAgent(event.target.value)}>
            <option value="all">All agents</option>
            {options.agents.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Risk
          <select value={risk} onChange={(event) => setRisk(event.target.value)}>
            <option value="all">All risks</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label>
          Workflow
          <select value={workflow} onChange={(event) => setWorkflow(event.target.value)}>
            <option value="all">All workflows</option>
            {options.workflows.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            {options.statuses.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      {filtered.length ? (
        <div className="approval-grid">
          {filtered.map((approval) => (
            <article className="approval-item" key={approval.approvalId}>
              <div>
                <strong>{approval.title}</strong>
                <span>
                  {approval.agent} · {approval.workflow} · Required by {approval.requiredBy}
                </span>
              </div>
              <div className="button-row compact-row">
                <RiskBadge risk={approval.risk} />
                <StatusBadge value={approval.status} tone={approval.status === 'mock approved' ? 'good' : 'neutral'} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState message="No approvals match the selected filters." />
      )}
    </section>
  );
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}
