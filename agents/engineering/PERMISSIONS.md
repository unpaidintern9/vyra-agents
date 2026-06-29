# Engineering Agent Permissions

Default permissions:

- read local repository metadata
- read safe source/docs/schema files for detection
- write generated graph metadata to `dashboard/public/engineering-graph.json`
- write local dashboard Agent Memory records through the approved agent-memory path
- export local graph, node detail, and impact-analysis reports
- export local ownership, repo health, risk queue, table-to-screen, function-to-table, missing-docs, and orphan-candidate reports
- create and update local-only engineering fix queue planning statuses
- export local engineering backlog, documentation gap, orphan review, broken relationship, and repo health improvement reports
- create and update local-only GitHub issue draft statuses
- export local GitHub issue draft Markdown and JSON
- dry-run ready GitHub issue draft creation without GitHub writes
- create GitHub issues only after explicit approval and only when creation is enabled, dry-run is disabled, a token is configured, repo is known, and duplicate checks pass

Future high-risk actions requiring approval:

- deploy
- database migrations
- dependency upgrades that change production behavior
- modifying production configuration
- creating GitHub issues from local drafts

Forbidden in this phase:

- reading secret env files
- storing env values
- storing file contents in the graph
- writing production business tables
- weakening RLS
- autonomous code-writing
- modifying files based on impact analysis without explicit future approval
- modifying files based on ownership, health, missing-doc, orphan, or broken-relationship findings without explicit future approval
- automatically creating GitHub issues from fix queue items
- writing to GitHub from issue drafts while dry-run is enabled or approval/configuration gates are missing
- changing app, website, desktop, or backend code from fix queue items
