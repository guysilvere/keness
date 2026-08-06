import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cursorAdapter } from './cursor.js';

const mockRule = {
  id: 'abc2',
  type: 'rule' as const,
  name: 'no-console',
  description: 'Disallow console.log in production code',
  content: 'Never use console.log. Use a structured logger instead.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('cursorAdapter', () => {
  it('has correct identity', () => {
    expect(cursorAdapter.id).toBe('cursor');
    expect(cursorAdapter.binaryName).toBe('cursor');
    expect(cursorAdapter.supports).toContain('rule');
    expect(cursorAdapter.supports).toContain('skill');
  });

  it('resolves global rule path on linux/darwin', () => {
    const p = cursorAdapter.resolvePath('rule', 'no-console', 'global', 'linux');
    expect(p).toBe(join(homedir(), '.cursor', 'rules', 'no-console.mdc'));
  });

  it('resolves global rule path on darwin', () => {
    const p = cursorAdapter.resolvePath('rule', 'no-console', 'global', 'darwin');
    expect(p).toBe(join(homedir(), '.cursor', 'rules', 'no-console.mdc'));
  });

  it('formats a rule with mdc frontmatter', () => {
    const { content, permissions } = cursorAdapter.format(mockRule);
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('description: Disallow console.log in production code');
    expect(content).toContain('globs:');
    expect(content).toContain('alwaysApply: false');
    expect(content).toContain('# no-console');
    expect(content).toContain('Never use console.log');
    expect(permissions).toBe(0o644);
  });

  it('formats a rule with alwaysApply when provided via frontmatter', () => {
    const el = { ...mockRule, frontmatter: { alwaysApply: true, globs: '**/*.ts' } };
    const { content } = cursorAdapter.format(el);
    expect(content).toContain('alwaysApply: true');
    expect(content).toContain('globs: **/*.ts');
  });

  it('formats a skill with plain frontmatter (not mdc)', () => {
    const el = { ...mockRule, type: 'skill' as const, name: 'my-skill' };
    const { content } = cursorAdapter.format(el);
    expect(content).toContain('description:');
    expect(content).not.toContain('alwaysApply');
  });

  it('throws for mcp type', () => {
    expect(() =>
      cursorAdapter.resolvePath('mcp' as 'rule', 'x', 'project'),
    ).toThrow();
  });
});
