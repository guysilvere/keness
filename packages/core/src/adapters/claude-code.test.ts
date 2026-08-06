import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { claudeCodeAdapter } from './claude-code.js';

const mockEl = {
  id: 'abc1',
  type: 'skill' as const,
  name: 'my-skill',
  description: 'A test skill',
  content: 'Do something useful.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('claudeCodeAdapter', () => {
  it('has correct identity', () => {
    expect(claudeCodeAdapter.id).toBe('claude-code');
    expect(claudeCodeAdapter.binaryName).toBe('claude');
    expect(claudeCodeAdapter.supports).toContain('skill');
    expect(claudeCodeAdapter.supports).toContain('agent');
    expect(claudeCodeAdapter.supports).toContain('rule');
    expect(claudeCodeAdapter.supports).toContain('mcp');
  });

  it('resolves global skill path on linux', () => {
    const p = claudeCodeAdapter.resolvePath('skill', 'my-skill', 'global', 'linux');
    expect(p).toBe(join(homedir(), '.claude', 'skills', 'my-skill', 'SKILL.md'));
  });

  it('resolves global agent path', () => {
    const p = claudeCodeAdapter.resolvePath('agent', 'my-agent', 'global', 'linux');
    expect(p).toBe(join(homedir(), '.claude', 'agents', 'my-agent', 'agent.md'));
  });

  it('resolves global rule path', () => {
    const p = claudeCodeAdapter.resolvePath('rule', 'no-console', 'global', 'linux');
    expect(p).toBe(join(homedir(), '.claude', 'rules', 'no-console.md'));
  });

  it('formats a skill with YAML frontmatter', () => {
    const { content, permissions } = claudeCodeAdapter.format(mockEl);
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('description: A test skill');
    expect(content).toContain('---\n');
    expect(content).toContain('# my-skill');
    expect(content).toContain('Do something useful.');
    expect(permissions).toBe(0o644);
  });

  it('formats a skill with tags', () => {
    const el = { ...mockEl, tags: ['git', 'hooks'] };
    const { content } = claudeCodeAdapter.format(el);
    expect(content).toContain('tags:');
  });

  it('formats an mcp config as JSON', () => {
    const el = { ...mockEl, type: 'mcp' as const, name: 'my-mcp' };
    const { content } = claudeCodeAdapter.format(el);
    const parsed = JSON.parse(content) as { mcpServers: Record<string, unknown> };
    expect(parsed).toHaveProperty('mcpServers');
    expect(parsed.mcpServers).toHaveProperty('my-mcp');
  });

  it('throws for unsupported type via resolvePath hack', () => {
    // TypeScript prevents this at compile time, but the runtime guard must also work
    expect(() =>
      claudeCodeAdapter.resolvePath(
        'unknown' as 'skill',
        'x',
        'project',
      ),
    ).toThrow();
  });
});
