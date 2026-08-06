import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { antigravityAdapter } from './antigravity.js';

const mockEl = {
  id: 'abc4',
  type: 'agent' as const,
  name: 'my-agent',
  description: 'A helpful agent',
  content: 'You are a helpful assistant.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('antigravityAdapter', () => {
  it('has correct identity', () => {
    expect(antigravityAdapter.id).toBe('antigravity');
    expect(antigravityAdapter.binaryName).toBe('antigravity');
    expect(antigravityAdapter.supports).toContain('agent');
    expect(antigravityAdapter.supports).toContain('rule');
    expect(antigravityAdapter.supports).not.toContain('skill');
    expect(antigravityAdapter.supports).not.toContain('mcp');
  });

  it('resolves global agent path on linux', () => {
    const p = antigravityAdapter.resolvePath('agent', 'my-agent', 'global', 'linux');
    expect(p).toBe(join(homedir(), '.agents', 'my-agent.md'));
  });

  it('resolves global rule path on darwin', () => {
    const p = antigravityAdapter.resolvePath('rule', 'no-console', 'global', 'darwin');
    expect(p).toBe(join(homedir(), '.agents', 'no-console.md'));
  });

  it('configDir global returns ~/.agents', () => {
    const d = antigravityAdapter.configDir('global', 'linux');
    expect(d).toBe(join(homedir(), '.agents'));
  });

  it('formats an agent with YAML frontmatter and H1', () => {
    const { content, permissions } = antigravityAdapter.format(mockEl);
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('description: A helpful agent');
    expect(content).toContain('---\n\n# my-agent');
    expect(content).toContain('You are a helpful assistant.');
    expect(permissions).toBe(0o644);
  });

  it('formats a rule with frontmatter', () => {
    const el = { ...mockEl, type: 'rule' as const, name: 'no-console', description: 'No console.log' };
    const { content } = antigravityAdapter.format(el);
    expect(content).toContain('description: No console.log');
    expect(content).toContain('# no-console');
  });

  it('path is <name>.md inside .agents dir', () => {
    const { path } = antigravityAdapter.format(mockEl);
    expect(path.endsWith('my-agent.md')).toBe(true);
  });

  it('throws for skill type', () => {
    expect(() =>
      antigravityAdapter.resolvePath('skill' as 'agent', 'x', 'project'),
    ).toThrow('Antigravity: unsupported type "skill"');
  });

  it('throws for mcp type', () => {
    expect(() =>
      antigravityAdapter.resolvePath('mcp' as 'agent', 'x', 'project'),
    ).toThrow('Antigravity: unsupported type "mcp"');
  });
});
