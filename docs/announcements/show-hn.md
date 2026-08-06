# Show HN: Keness – Create AI coding skills once, sync them to all your tools

**Tagline:** Open-source CLI that keeps your Claude, Cursor, Codex, Gemini CLI, Antigravity and Opencode configs in sync — no duplication, no manual reformatting.

---

If you use more than one AI coding assistant (Claude Code at work, Cursor in the IDE, Codex in CI…), you've probably hit the same wall I did: your hard-won system prompts, rules and agent configs have to be re-created and manually maintained in each tool's own format, in its own directory, with its own permission model.

I built **Keness** to solve this.

**How it works:**

You define an element once in Keness's local library:

```bash
keness create skill
# → interactive wizard: type, name, description, content, which tools
```

Keness then adapts the content to each tool's convention and writes it to the right place:

- Claude Code skill → `~/.claude/skills/<name>/SKILL.md` with YAML frontmatter
- Cursor rule → `.cursor/rules/<name>.mdc` with MDC frontmatter + `alwaysApply`
- Codex → `AGENTS.md` section
- Gemini CLI skill → `.gemini/<name>.md`
- etc.

When you edit the content in one tool (or update the source), `keness sync` propagates it everywhere. Keness tracks `writtenHash` per target to detect manual divergences and warns before overwriting.

```bash
keness push my-skill --to cursor,codex   # push to specific tools
keness diff my-skill                      # preview diff before writing
keness sync my-skill --dry-run           # see what would change
keness ui                                 # local web dashboard with visual diff
```

**What it does NOT do:**

- No telemetry, no account, no cloud sync — everything stays on your machine
- No native modules — pure Node.js, installs without `node-gyp` friction
- No LLM required for basic use — the BYOK generation (`keness generate`) is optional

**Stack:** Node.js + TypeScript monorepo, Preact + Fastify for the dashboard, 269 tests, CI on Ubuntu/macOS/Windows.

**Install:**

```bash
npm install -g keness
keness detect  # see which tools are on your machine
```

GitHub: https://github.com/guysilvere/keness

This is an early access release — feedback on which tools to prioritize next, friction points in the UX, and adapter edge cases would be most valuable. Adapters for Windsurf, Mistral Vibe, and Qwen Code are on the medium-term list.
