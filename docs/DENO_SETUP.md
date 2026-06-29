# Deno Setup

The Supabase Edge Function tests use Deno. Robert's Mac did not have a global `deno` binary, so Phase 9 installs Deno locally in the Vyra Agents workspace.

## Install

From the repo root:

```bash
mkdir -p .tools
curl -fsSL https://deno.land/install.sh | DENO_INSTALL="/Volumes/Install macOS Sequoia/Vyra Agents/.tools/deno" sh
```

## Use

```bash
export DENO_INSTALL="/Volumes/Install macOS Sequoia/Vyra Agents/.tools/deno"
export PATH="$DENO_INSTALL/bin:$PATH"
deno --version
```

## Run Edge Function Tests

```bash
cd ~/Documents/Vyra-Part-1
deno test --allow-env --allow-net supabase/functions/agent-memory-write/index.test.ts
```

The tests are local/unit style and do not modify production data.
