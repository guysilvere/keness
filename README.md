# Keness

> Create your skills, agents, rules and MCP configs once — sync them everywhere.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/keness)](https://www.npmjs.com/package/keness)
[![Node.js ≥20](https://img.shields.io/badge/node-%E2%89%A520-brightgreen)](https://nodejs.org)

Keness is an open-source CLI + local web dashboard that lets developers who use multiple AI coding assistants (Claude Code, Cursor, Codex, Gemini CLI, Antigravity, Opencode…) create, store, sync and evolve their **skills, agents, rules and MCP configs** from one place — without manually copying them between tools or knowing each tool's conventions.

---

## Why Keness?

If you use 2+ AI coding tools in parallel, you're probably duplicating your setup manually across different formats (`SKILL.md`, `agent.md`, TOML frontmatter…), different directories (OS-dependent), different permission models. Any change in one tool drifts away from the others.

Keness solves this: define an element once, push it to any combination of tools — correctly formatted, in the right place, with the right permissions.

---

## Supported tools

| Tool | Skills | Agents | Rules | MCP |
|---|:---:|:---:|:---:|:---:|
| Claude Code | ✅ | ✅ | ✅ | ✅ |
| Cursor | ✅ | ✅ | ✅ | — |
| Codex (OpenAI) | ✅ | ✅ | — | — |
| Antigravity | — | ✅ | ✅ | — |
| Gemini CLI | ✅ | — | ✅ | — |
| Opencode | ✅ | — | ✅ | — |

---

## Installation

```bash
npm install -g keness
# or
npx keness
```

Requires Node.js ≥ 20.

---

## Quick start

```bash
# Detect which AI tools are installed on your machine
keness detect

# Create a skill and register it in Claude Code + Cursor
keness create skill

# Push an existing skill to additional tools
keness push my-skill --to codex,gemini-cli

# Preview changes before writing (default)
keness diff my-skill --for cursor

# Sync a skill after manually editing it in one tool
keness sync my-skill

# Generate a skill from a plain-text description (BYOK)
keness generate skill "check that every PR has tests before merge" --for claude-code,cursor

# Open the local web dashboard
keness ui
```

---

## Commands

| Command | Description |
|---|---|
| `keness detect` | Scan installed AI tools (PATH + config dirs) |
| `keness create <type>` | Interactive wizard to create a skill/agent/rule/mcp |
| `keness generate <type> "<description>"` | Generate content from natural language (BYOK) |
| `keness push <id> --to <apps>` | Write/adapt an element to one or more tools |
| `keness diff <id>` | Preview the adapted file before writing |
| `keness sync <id>` | Replicate a manual edit to all linked tools |
| `keness rm <id> --from <apps\|all>` | Delete an element from selected tools |
| `keness export <id>` | Archive or print equivalent shell commands |
| `keness auth set <provider>` | Store a BYOK API key (OS keychain, never plaintext) |
| `keness ui` | Open the local web dashboard at `http://localhost:<port>` |

---

## Dashboard

`keness ui` opens a local web interface (no data leaves your machine) with:

- **Library** — all your skills/agents/rules/MCP configs with per-tool sync status
- **Element detail** — source content, per-tool diff, push/sync/delete/export actions
- **Detected apps** — tools found on your machine, with config paths
- **Create** — multi-step form with live per-app file preview

---

## AI generation (BYOK)

Keness can generate or adapt content using your own API key — no key is ever shared with Keness servers. Supported providers:

- Anthropic (Claude)
- OpenAI
- Google (Gemini API)
- Any OpenAI-compatible endpoint (Mistral, Grok, Ollama, LM Studio…)

```bash
keness auth set anthropic   # stores key in OS keychain
keness generate skill "enforce conventional commits" --for claude-code,cursor
```

All generation calls show a preview and ask for confirmation before writing (or calling the API).

---

## Local-first & open-source

- **No account required.** Everything runs on your machine.
- **No telemetry.** Nothing is sent anywhere without your explicit action.
- **MIT licensed.** Fork it, extend it, contribute adapters for new tools.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) (coming soon) — adding support for a new AI tool means writing a single adapter file in `packages/core/src/adapters/`.

---

## License

MIT — see [LICENSE](LICENSE).
