import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CircleDot,
  GitBranch,
  Network,
  ShieldCheck,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
  agents,
  approvals,
  ecosystemNodes,
  integrations,
  migrationStatus,
  navItems,
  priorities,
  recentActivity,
  repositories,
  summaryStats,
  systemHealth,
  workflows,
} from './data';

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">V</div>
          <div>
            <p>Vyra</p>
            <span>Agent Platform</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button className={item.label === 'Overview' ? 'nav-item active' : 'nav-item'} key={item.label}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="main-content">
        <header className="hero">
          <div>
            <p className="eyebrow">Operations command center</p>
            <h1>Vyra Agents</h1>
            <p className="hero-copy">
              A local MVP for monitoring the Vyra ecosystem, preparing agent responsibilities, and staging future
              workflow automation without touching production systems.
            </p>
          </div>
          <div className="hero-status">
            <ShieldCheck size={22} />
            <span>Mock data only</span>
          </div>
        </header>

        <section className="summary-grid" aria-label="Command center summary">
          {summaryStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article className="metric-card" key={stat.label}>
                <Icon size={20} />
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </article>
            );
          })}
        </section>

        <section className="dashboard-grid">
          <Panel title="System Health" icon={<Activity size={18} />}>
            <div className="health-grid">
              {systemHealth.map((item) => (
                <div className={`health-tile ${item.tone}`} key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Active Agents" icon={<CircleDot size={18} />}>
            <div className="list-stack">
              {agents.slice(0, 6).map((agent) => (
                <div className="row-item" key={agent.name}>
                  <div>
                    <strong>{agent.name}</strong>
                    <span>{agent.detail}</span>
                  </div>
                  <Badge value={agent.status} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Repository Health" icon={<GitBranch size={18} />}>
            <div className="list-stack">
              {repositories.map((repo) => (
                <div className="row-item compact" key={repo.name}>
                  <div>
                    <strong>{repo.name}</strong>
                    <span>{repo.branch}</span>
                  </div>
                  <Badge value={repo.state} tone={repo.signal === 'warn' ? 'warn' : 'good'} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Integration Status" icon={<Network size={18} />}>
            <div className="integration-grid">
              {integrations.map(([name, status]) => (
                <div className="integration-pill" key={name}>
                  <span>{name}</span>
                  <small>{status}</small>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Workflow Activity" icon={<ArrowRight size={18} />}>
            <div className="workflow-list">
              {workflows.map((workflow) => (
                <div className="workflow-item" key={workflow.name}>
                  <span>{workflow.name}</span>
                  <small>{workflow.owner}</small>
                  <Badge value={workflow.status} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Top Priorities" icon={<AlertTriangle size={18} />}>
            <ol className="priority-list">
              {priorities.map((priority) => (
                <li key={priority}>{priority}</li>
              ))}
            </ol>
          </Panel>

          <Panel title="Recent Activity" icon={<Activity size={18} />}>
            <div className="activity-list">
              {recentActivity.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </Panel>

          <Panel title="Approvals Waiting" icon={<ShieldCheck size={18} />}>
            <div className="approval-grid">
              {approvals.map((approval) => {
                const Icon = approval.icon;
                return (
                  <div className="approval-item" key={approval.item}>
                    <Icon size={18} />
                    <div>
                      <strong>{approval.item}</strong>
                      <span>{approval.required}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Migration Status" icon={<CircleDot size={18} />}>
            <div className="migration-grid">
              {migrationStatus.map((item) => (
                <div className="migration-tile" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Ecosystem Map" icon={<Network size={18} />} wide>
            <div className="ecosystem-map" aria-label="Vyra ecosystem map">
              {ecosystemNodes.map((node, index) => (
                <div className={`node node-${index}`} key={node}>
                  {node}
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </main>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
  wide = false,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={wide ? 'panel wide-panel' : 'panel'}>
      <div className="panel-header">
        <div>
          {icon}
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function Badge({ value, tone = 'neutral' }: { value: string; tone?: 'neutral' | 'good' | 'warn' }) {
  return <span className={`badge ${tone}`}>{value}</span>;
}

export default App;
