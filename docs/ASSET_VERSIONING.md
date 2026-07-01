# Asset Versioning

Asset versions are append-only local metadata records.

Each version stores version number, change summary, superseded version, approval status, author, reviewer, release date, and created date.

Asset updates create a new version record instead of overwriting history. Archived assets preserve their version and audit history.

Use `npm run assets:versions` to inspect local version history.

Safety: no automatic asset replacement and no hidden version overwrite.
