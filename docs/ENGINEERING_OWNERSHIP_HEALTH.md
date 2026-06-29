# Engineering Ownership + Health

Phase 11 adds local ownership and health mapping to the Engineering Agent knowledge graph.

## What It Answers

- Who owns this node?
- What product area does it belong to?
- What screens or routes touch a table?
- What functions read, write, or reference a table?
- Which repos carry the most advisory risk?
- Which nodes are orphan candidates?
- Which important nodes appear to be missing docs?
- Which relationships look broken?

## Owner Heuristics

Owners are inferred from repo, path, label, and node type:

- `vyra-agents`: Agent Platform.
- `Vyra-Software`: Desktop Software.
- `vyra-website`: Website, with keyword overrides.
- `supabase/functions`, `supabase/migrations`, and table nodes: Backend / Supabase.
- `sales`, `crm`, `lead`, `commission`: Sales / CRM.
- `stripe`, `billing`, `subscription`, `payment`, `invoice`, `revenue`: Billing / Revenue.
- `gym`, `organization`, `member`, `class`, `attendance`: Gym OS.
- `coach`: Coach Platform.
- `athlete`, `workout`, `training`, `nutrition`: Athlete Experience.
- `migration`: Migration System.
- `oura`, `whoop`, `health`, `apple-health`: Health Integrations.
- `support`, `operation`, `audit`, `queue`: Support / Operations.

## Feature Area Heuristics

Feature areas use keyword matching for billing, sales CRM, memberships, gym operations, coach platform, athlete experience, migration, health integrations, auth/security, agent memory, and core platform.

## Health Score

Repo health starts at 100 and is reduced by ratio-based advisory signals:

- high-risk node density
- missing-doc density
- orphan-candidate density
- broken relationship warning count

The score is comparative, not authoritative.

## Advisory Findings

Orphan detection is advisory only. It flags components, services, documents, tables, and functions that appear disconnected from the detected graph.

Missing-doc detection is advisory only. It flags Supabase functions without README files, high-impact tables without obvious docs, and routes/screens/services without nearby docs.

Broken relationship warnings are advisory only. They flag missing imported files, env variables referenced outside example env files, referenced functions without indexed function folders, and migration-created tables with no detected app references.

## Phase 12 Planning Layer

The Fix Queue consumes ownership and health metadata to create local planning tasks. It does not create GitHub issues, modify source repos, or perform fixes. It only helps Robert sort advisory graph findings by severity, effort, owner, feature area, repo, and status.

## Safety

- No AI is implemented.
- No autonomous code-writing agents are implemented.
- No production business data is modified.
- No production app tables are written.
- No file contents are stored in the graph.
- No secret values are recorded.
