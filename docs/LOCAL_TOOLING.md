# Local Tooling

This workspace keeps optional local tools under:

```text
.tools/
```

`.tools/` is ignored by Git. Downloaded binaries must not be committed.

## Engineering Scanner

Run the read-only Engineering Agent scan from the repo root:

```bash
node scripts/engineering-scan.mjs
```

Or from the dashboard package:

```bash
cd dashboard
npm run scan:engineering
```

The scanner writes `dashboard/public/engineering-graph.json`.

## Local Deno

Deno is installed locally under:

```text
.tools/deno/
```

To use it in a shell:

```bash
export DENO_INSTALL="/Volumes/Install macOS Sequoia/Vyra Agents/.tools/deno"
export PATH="$DENO_INSTALL/bin:$PATH"
deno --version
```
