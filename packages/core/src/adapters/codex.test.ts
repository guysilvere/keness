import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { codexAdapter } from './codex.js';

const mockEl = {
  id: 'abc3',
  type: 'skill' as const,
  name: 'my-skill',
  description: 'A test skill',
  content: 'Do something useful.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('codexAdapter', () => {
  it('has correct identity', () => {
    expect(codexAdapter.id).toBe('codex');
    expect(codexAdapter.binaryName).toBe('codex');
    expect(codexAdapter.supports).toContain('skill');
    expect(codexAdapter.supports).toContain('agent');
    expect(codexAdapter.supports).toContain('rule');
    expect(codexAdapter.supports).not.toContain('mcp');
  });

  it('resolves global path to AGENTS.md in home dir for skill', () => {
    const p = codexAdapter.resolvePath('skill', 'my-skill', 'global', 'linux');
    expect(p).toBe(join(homedir(), 'AGENTS.md'));
  });

  it('resolves global path to AGENTS.md for agent', () => {
    const p = codexAdapter.resolvePath('agent', 'my-agent', 'global', 'linux');
    expect(p).toBe(join(homedir(), 'AGENTS.md'));
  });

  it('resolves global path to AGENTS.md for rule', () => {
    const p = codexAdapter.resolvePath('rule', 'no-console', 'global', 'linux');
    expect(p).toBe(join(homedir(), 'AGENTS.md'));
  });

  it('formats a skill as an H2 section with description', () => {
    const { content, permissions } = codexAdapter.format(mockEl);
    expect(content).toMatch(/^## my-skill\n\n/);
    expect(content).toContain('> A test skill');
    expect(content).toContain('Do something useful.');
    expect(permissions).toBe(0o644);
  });

  it('formats a skill without description when empty', () => {
    const el = { ...mockEl, description: '' };
    const { content } = codexAdapter.format(el);
    expect(content).toMatch(/^## my-skill\n\n/);
    expect(content).not.toContain('> ');
    expect(content).toContain('Do something useful.');
  });

  it('formats an agent as an H2 section', () => {
    const el = { ...mockEl, type: 'agent' as const, name: 'my-agent' };
    const { content } = codexAdapter.format(el);
    expect(content).toMatch(/^## my-agent\n\n/);
  });

  it('path is always AGENTS.md regardless of element name', () => {
    const { path } = codexAdapter.format(mockEl);
    expect(path.endsWith('AGENTS.md')).toBe(true);
  });

  it('throws for mcp type', () => {
    expect(() =>
      codexAdapter.resolvePath('mcp' as 'skill', 'x', 'project'),
    ).toThrow('Codex: unsupported type "mcp"');
  });
});
