# I built an open-source tool to sync your Claude Code skills/rules to Cursor, Codex, Gemini CLI and Opencode

Hey r/ClaudeAI,

If you use Claude Code alongside other AI tools, this might save you some headaches.

**The problem:** I had built up a solid library of Claude Code skills and rules over a few months — commit conventions, code review checklists, a few custom agents. Every time I switched to Cursor or tried Codex, I'd have to manually recreate everything in a different format, a different folder, with different frontmatter. And then keep them in sync when I updated something.

**What I built:** [**Keness**](https://github.com/guysilvere/keness) — an open-source CLI that manages skills, agents, rules and MCP configs across all your AI tools from a single local library.

```bash
npm install -g keness
keness create skill          # interactive wizard
keness push my-skill --to cursor,codex,gemini-cli
keness diff my-skill         # preview before writing
keness ui                    # local web dashboard
```

It currently supports Claude Code, Cursor, Codex, Gemini CLI, Antigravity, and Opencode. Each tool gets the file in its own format:

- Claude Code → YAML frontmatter `.md` in `.claude/skills/`
- Cursor → `.mdc` with `alwaysApply` + `globs` in `.cursor/rules/`
- Codex → section in `AGENTS.md`
- Gemini CLI → named `.md` in `.gemini/`

It also tracks when you manually edit a file outside Keness and warns you before overwriting.

**Optional AI generation (BYOK):**

```bash
keness auth set anthropic    # stores key in OS keychain, never in plain text
keness generate skill "enforce conventional commits" --for claude-code,cursor
```

Everything is local-first — no account, no telemetry, MIT licensed.

It's v0.1.0 / early access. Curious if this solves a real pain point for others here, and what features would be most useful next. Happy to answer questions about the adapter architecture if anyone wants to add support for another tool.
