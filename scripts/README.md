# Scripts

Utility scripts live here. They must not touch production systems.

## engineering-scan.mjs

Read-only Engineering Agent scanner.

```bash
node scripts/engineering-scan.mjs
```

Outputs metadata only to:

```text
dashboard/public/engineering-graph.json
```

The scanner ignores dependency folders, build output, binary/media files, and secret env files. It records env variable names only, never values.
