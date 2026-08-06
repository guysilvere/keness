# Changelog

All notable changes to Keness are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] — 2026-08-06

First public release — early access.

### Added

**Core adapter engine (`@keness/core`)**
- `AppAdapter` interface: `id`, `name`, `binaryName`, `supports`, `detect()`, `configDir()`, `resolvePath()`, `format()`
- Six adapters: Claude Code, Cursor, Codex (OpenAI), Antigravity, Gemini CLI, Opencode
- Per-adapter `detect()` (binary PATH + config-dir probe), `detectAll()` helper
- Registry: JSON manifest at `~/.keness/registry.json` — `loadRegistry`, `saveRegistry`, `addEntry`, `updateEntry`, `removeEntry`, `getEntry`, `findByName`
- Sync engine: `computeDiffs` (per-target diff with `manuallyEdited` detection via `writtenHash`), `applyDiffs`, `elementFromEntry`
- Content scanner: 7 heuristic patterns (EXEC_PIPE, EVAL_DYNAMIC, FORK_BOMB, RM_RF, DD_OVERWRITE, PLAINTEXT_SECRET, DESTRUCTIVE_SQL)
- Writer: `writeAdaptedFile` with `FileExistsError`, recursive `mkdirSync`, permission `chmod`
- Diff engine: line-level `diffLines`, unified-hunk output
- BYOK generation: Anthropic, OpenAI, Google, and any OpenAI-compatible endpoint; key stored in `~/.keness/keychain.json` (mode 0600, never logged)

**CLI (`keness`)**
- `keness detect` — list installed AI tools (binary + config dir)
- `keness create <type>` — interactive wizard (name, description, content, scope, target apps) with content security scan
- `keness push <id> [--to <apps>] [--dry-run]` — write/adapt element to one or more tools
- `keness diff <id> [--for <app>]` — preview diff without writing
- `keness sync <id> [--dry-run]` — replicate manual edits to all linked tools
- `keness rm <id> [--from <apps|all>] [--dry-run]` — remove element from tools and/or registry
- `keness export <id>` — print equivalent shell commands
- `keness generate <type> "<description>" [--for <apps>] [--dry-run]` — AI-generate content (BYOK)
- `keness auth set <provider>` — store API key in keychain (hidden input, never echoed)
- `keness ui [--port <n>]` — open local web dashboard
- `--dry-run` on all destructive commands
- `--ai-adapt` flag on `push`/`sync` (adapt via LLM per target tool)

**Web dashboard (`keness ui`)**
- Fastify local server with Preact SPA
- **Library** view — all elements with per-tool sync status badges
- **Element detail** — source content, per-tool inline diff, Push / Sync / Remove actions
- **Apps** view — detected tools with paths and status indicators
- **Create** form — type selector, name, description, content, scope, target checkboxes
- Manual-edit warning badge (⚠) on targets with diverged on-disk content
- Full dark-mode support

**Tests**
- 269 tests across 12 test files
- Per-adapter unit tests for all 6 adapters (conformance suite + per-adapter specific tests)
- Registry, diff, scanner, sync-engine (divergence detection, `writtenHash`), writer (`FileExistsError`) integration tests
- CI matrix: Ubuntu · macOS · Windows on Node 22

### Supported element types × tools

| Tool         | skill | agent | rule | mcp |
|--------------|:-----:|:-----:|:----:|:---:|
| Claude Code  |  ✅   |  ✅   |  ✅  | ✅  |
| Cursor       |  ✅   |  ✅   |  ✅  |  —  |
| Codex        |  ✅   |  ✅   |  ✅  |  —  |
| Antigravity  |   —   |  ✅   |  ✅  |  —  |
| Gemini CLI   |  ✅   |   —   |  ✅  |  —  |
| Opencode     |  ✅   |   —   |  ✅  |  —  |

---

[0.1.0]: https://github.com/guysilvere/keness/releases/tag/v0.1.0
