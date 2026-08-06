/**
 * Adapter conformance suite — runs the same checks against all 6 adapters.
 * Milestone for Step 5: every adapter must pass every test here.
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ElementType, KenessElement } from '../types.js';
import { allAdapters } from './index.js';

// ── Mock elements (one per type) ──────────────────────────────────────────────

const MOCK: Record<ElementType, KenessElement> = {
  skill: {
    id: 'cf-skill',
    type: 'skill',
    name: 'test-skill',
    description: 'A conformance test skill',
    content: 'Always write tests for every function.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  agent: {
    id: 'cf-agent',
    type: 'agent',
    name: 'test-agent',
    description: 'A conformance test agent',
    content: 'You are a helpful coding agent. Focus on correctness.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  rule: {
    id: 'cf-rule',
    type: 'rule',
    name: 'no-console',
    description: 'Disallow console.log in production code',
    content: 'Never use console.log. Use a structured logger instead.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  mcp: {
    id: 'cf-mcp',
    type: 'mcp',
    name: 'test-mcp',
    description: 'A conformance test MCP config',
    content: 'MCP server instructions',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};

const ALL_TYPES: ElementType[] = ['skill', 'agent', 'rule', 'mcp'];
const PLATFORMS = ['linux', 'darwin', 'win32'] as const;

// ── Shared conformance suite ──────────────────────────────────────────────────

describe('Adapter conformance', () => {
  for (const adapter of allAdapters) {
    describe(`${adapter.name} (${adapter.id})`, () => {

      // ── Identity ────────────────────────────────────────────────────────────

      it('has a non-empty id', () => {
        expect(adapter.id).toBeTruthy();
      });

      it('has a non-empty name', () => {
        expect(adapter.name).toBeTruthy();
      });

      it('has a non-empty binaryName', () => {
        expect(adapter.binaryName).toBeTruthy();
      });

      it('supports at least one element type', () => {
        expect(adapter.supports.length).toBeGreaterThan(0);
      });

      it('supports only known element types', () => {
        for (const t of adapter.supports) {
          expect(ALL_TYPES).toContain(t);
        }
      });

      // ── configDir ───────────────────────────────────────────────────────────

      it('configDir("project") returns a non-empty string', () => {
        const d = adapter.configDir('project');
        expect(typeof d).toBe('string');
        expect(d.length).toBeGreaterThan(0);
      });

      for (const platform of PLATFORMS) {
        it(`configDir("global", "${platform}") returns a non-empty string`, () => {
          const d = adapter.configDir('global', platform);
          expect(typeof d).toBe('string');
          expect(d.length).toBeGreaterThan(0);
        });
      }

      it('configDir("global") path starts with home dir or APPDATA', () => {
        const d = adapter.configDir('global', 'linux');
        const home = homedir();
        expect(d.startsWith(home) || d.startsWith('/'), `"${d}" should start with home or root`)
          .toBe(true);
      });

      // ── Supported types ─────────────────────────────────────────────────────

      for (const type of ALL_TYPES) {
        if (adapter.supports.includes(type)) {
          const el = MOCK[type];

          it(`resolvePath("${type}", name, "project") returns a non-empty string`, () => {
            const p = adapter.resolvePath(type, el.name, 'project');
            expect(typeof p).toBe('string');
            expect(p.length).toBeGreaterThan(0);
          });

          it(`resolvePath("${type}", name, "global", "linux") returns a non-empty string`, () => {
            const p = adapter.resolvePath(type, el.name, 'global', 'linux');
            expect(typeof p).toBe('string');
            expect(p.length).toBeGreaterThan(0);
          });

          it(`format("${type}") returns a valid AdaptedFile`, () => {
            const f = adapter.format(el);
            expect(typeof f.content).toBe('string');
            expect(f.content.length).toBeGreaterThan(0);
            expect(typeof f.path).toBe('string');
            expect(f.path.length).toBeGreaterThan(0);
            expect(f.permissions).toBe(0o644);
          });

          it(`format("${type}") content includes element name or body`, () => {
            const f = adapter.format(el);
            const hasName    = f.content.includes(el.name);
            const hasContent = f.content.includes(el.content);
            expect(hasName || hasContent).toBe(true);
          });

          it(`format("${type}") path matches resolvePath output`, () => {
            const formatted = adapter.format(el);
            const resolved  = adapter.resolvePath(type, el.name, 'project');
            expect(formatted.path).toBe(resolved);
          });

        } else {
          // ── Unsupported types ─────────────────────────────────────────────

          it(`resolvePath("${type}") throws for unsupported type`, () => {
            expect(() =>
              adapter.resolvePath(type, 'x', 'project'),
            ).toThrow();
          });
        }
      }
    });
  }
});

// ── Adapter-specific structural checks ────────────────────────────────────────

describe('Codex adapter specifics', () => {
  const codex = allAdapters.find((a) => a.id === 'codex')!;

  it('all supported types write to AGENTS.md', () => {
    for (const type of codex.supports) {
      const el = MOCK[type];
      const f = codex.format(el);
      expect(f.path.endsWith('AGENTS.md')).toBe(true);
    }
  });

  it('format produces an H2 section with element name', () => {
    const f = codex.format(MOCK.skill);
    expect(f.content).toMatch(/^## test-skill/m);
  });
});

describe('Antigravity adapter specifics', () => {
  const ag = allAdapters.find((a) => a.id === 'antigravity')!;

  it('agent path is in .agents/ directory', () => {
    const p = ag.resolvePath('agent', 'test-agent', 'project');
    expect(p).toContain('.agents');
    expect(p).toContain('test-agent.md');
  });

  it('format includes description frontmatter', () => {
    const f = ag.format(MOCK.agent);
    expect(f.content).toMatch(/^---\n/);
    expect(f.content).toContain('description:');
    expect(f.content).toContain('---');
  });
});

describe('Gemini CLI adapter specifics', () => {
  const gemini = allAdapters.find((a) => a.id === 'gemini-cli')!;

  it('skill path is under .gemini/', () => {
    const p = gemini.resolvePath('skill', 'test-skill', 'project');
    expect(p).toContain('.gemini');
    expect(p.endsWith('.md')).toBe(true);
  });

  it('rule falls back to GEMINI.md', () => {
    const p = gemini.resolvePath('rule', 'any-rule', 'project');
    expect(p.endsWith('GEMINI.md')).toBe(true);
  });
});

describe('Opencode adapter specifics', () => {
  const opencode = allAdapters.find((a) => a.id === 'opencode')!;

  it('skill path is under .opencode/', () => {
    const p = opencode.resolvePath('skill', 'test-skill', 'project');
    expect(p).toContain('.opencode');
    expect(p.endsWith('.md')).toBe(true);
  });

  it('rule falls back to AGENTS.md', () => {
    const p = opencode.resolvePath('rule', 'any-rule', 'project');
    expect(p.endsWith('AGENTS.md')).toBe(true);
  });

  it('global path on win32 uses AppData', () => {
    const d = opencode.configDir('global', 'win32');
    const appData = process.env['APPDATA'] ?? join(homedir(), 'AppData', 'Roaming');
    expect(d.startsWith(appData)).toBe(true);
  });
});

describe('Claude Code adapter specifics', () => {
  const cc = allAdapters.find((a) => a.id === 'claude-code')!;

  it('skill path contains SKILL.md', () => {
    const p = cc.resolvePath('skill', 'test-skill', 'global', 'linux');
    expect(p).toContain('SKILL.md');
  });

  it('agent path contains agent.md', () => {
    const p = cc.resolvePath('agent', 'test-agent', 'global', 'linux');
    expect(p.endsWith('agent.md')).toBe(true);
  });

  it('mcp format produces valid JSON', () => {
    const f = cc.format(MOCK.mcp);
    expect(() => JSON.parse(f.content)).not.toThrow();
    const parsed = JSON.parse(f.content) as { mcpServers: Record<string, unknown> };
    expect(parsed).toHaveProperty('mcpServers');
  });
});

describe('Cursor adapter specifics', () => {
  const cursor = allAdapters.find((a) => a.id === 'cursor')!;

  it('rule path uses .mdc extension', () => {
    const p = cursor.resolvePath('rule', 'no-console', 'project');
    expect(p.endsWith('.mdc')).toBe(true);
  });

  it('rule format contains mdc frontmatter (alwaysApply, globs)', () => {
    const f = cursor.format(MOCK.rule);
    expect(f.content).toContain('alwaysApply:');
    expect(f.content).toContain('globs:');
  });

  it('global path on win32 uses AppData', () => {
    const d = cursor.configDir('global', 'win32');
    const appData = process.env['APPDATA'] ?? join(homedir(), 'AppData', 'Roaming');
    expect(d.startsWith(appData)).toBe(true);
  });
});
