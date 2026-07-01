# Asset Library

Phase 57 adds a local Asset & Knowledge Library under `codex-agent-threads/shared/assets/`.

The Asset Library stores structured metadata references for reusable business assets. It references existing local files instead of copying asset contents whenever practical.

Asset records include identity, location, file metadata, tags, products, audiences, campaigns, organizations, related assets, linked tasks, linked goals, approval status, version, usage references, and audit history.

Use:

- `npm run assets:list`
- `npm run assets:add`
- `npm run assets:update`
- `npm run assets:search`
- `npm run assets:approve`
- `npm run assets:archive`
- `npm run assets:usage`
- `npm run assets:report`
- `npm run assets:validate`

Safety: local metadata only. No cloud sync, external uploads, autonomous publishing, automatic replacement, automatic approval, or external distribution.
