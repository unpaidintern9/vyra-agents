# Agent Registry

Agents are registered in `dashboard/src/runtime/agentRegistry.ts`.

Registered agents:

- Executive Agent
- Engineering Agent
- Migration Agent
- Sales Agent
- Support Agent
- Finance Agent
- Operations Agent
- Marketing Agent
- Product Agent

Engineering and Migration are fully represented in the runtime and keep their existing pages. Sales, Support, Finance, Operations, Marketing, and Product are registered with placeholder workflows so future work can inherit the same runtime behavior.

Every registration includes:

- id
- name
- description
- owner
- permissions
- health
- current activity

Workflow ownership is attached from the shared workflow registry.
