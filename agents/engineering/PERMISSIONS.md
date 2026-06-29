# Engineering Agent Permissions

Default permissions:

- read local repository metadata
- read safe source/docs/schema files for detection
- write generated graph metadata to `dashboard/public/engineering-graph.json`
- write local dashboard Agent Memory records through the approved agent-memory path
- export local graph, node detail, and impact-analysis reports

Future high-risk actions requiring approval:

- deploy
- database migrations
- dependency upgrades that change production behavior
- modifying production configuration

Forbidden in this phase:

- reading secret env files
- storing env values
- storing file contents in the graph
- writing production business tables
- weakening RLS
- autonomous code-writing
- modifying files based on impact analysis without explicit future approval
