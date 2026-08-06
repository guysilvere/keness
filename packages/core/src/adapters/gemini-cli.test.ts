import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { geminiCliAdapter } from './gemini-cli.js';

const mockSkill = {
  id: 'abc5',
  type: 'skill' as const,
  name: 'my-skill',
  description: 'A test skill',
  content: 'Do something useful.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('geminiCliAdapter', () => {
  it('has correct identity', () => {
    expect(geminiCliAdapter.id).toBe('gemini-cli');
    expect(geminiCliAdapter.binaryName).toBe('gemini');
    expect(geminiCliAdapter.supports).toContain('skill');
    expect(geminiCliAdapter.supports).toContain('rule');
    expect(geminiCliAdapter.supports).not.toContain('agent');
    expect(geminiCliAdapter.supports).not.toContain('mcp');
  });

  it('resolves global skill path on linux', () => {
    const p = geminiCliAdapter.resolvePath('skill', 'my-skill', 'global', 'linux');
    expect(p).toBe(join(homedir(), '.gemini', 'my-skill.md'));
  });

  it('resolves global rule path to GEMINI.md', () => {
    const p = geminiCliAdapter.resolvePath('rule', 'no-console', 'global', 'linux');
    expect(p).toBe(join(homedir(), '.gemini', 'GEMINI.md'));
  });

  it('resolves global skill path on darwin', () => {
    const p = geminiCliAdapter.resolvePath('skill', 'my-skill', 'global', 'darwin');
    expect(p).toBe(join(homedir(), '.gemini', 'my-skill.md'));
  });

  it('configDir global returns ~/.gemini', () => {
    const d = geminiCliAdapter.configDir('global', 'linux');
    expect(d).toBe(join(homedir(), '.gemini'));
  });

  it('formats a skill with H1 and description', () => {
    const { content, permissions } = geminiCliAdapter.format(mockSkill);
    expect(content).toMatch(/^# my-skill\n\n/);
    expect(content).toContain('A test skill');
    expect(content).toContain('Do something useful.');
    expect(permissions).toBe(0o644);
  });

  it('formats a skill without description when empty', () => {
    const el = { ...mockSkill, description: '' };
    const { content } = geminiCliAdapter.format(el);
    expect(content).toMatch(/^# my-skill\n\n/);
    expect(content).not.toContain('A test skill');
  });

  it('formats a rule with H1 and content', () => {
    const el = { ...mockSkill, type: 'rule' as const, name: 'no-console', description: '' };
    const { content } = geminiCliAdapter.format(el);
    expect(content).toMatch(/^# no-console\n\n/);
  });

  it('rule path ends with GEMINI.md', () => {
    const el = { ...mockSkill, type: 'rule' as const, name: 'no-console' };
    const { path } = geminiCliAdapter.format(el);
    expect(path.endsWith('GEMINI.md')).toBe(true);
  });

  it('skill path ends with <name>.md', () => {
    const { path } = geminiCliAdapter.format(mockSkill);
    expect(path.endsWith('my-skill.md')).toBe(true);
  });

  it('throws for agent type', () => {
    expect(() =>
      geminiCliAdapter.resolvePath('agent' as 'skill', 'x', 'project'),
    ).toThrow('Gemini CLI: unsupported type "agent"');
  });

  it('throws for mcp type', () => {
    expect(() =>
      geminiCliAdapter.resolvePath('mcp' as 'skill', 'x', 'project'),
    ).toThrow('Gemini CLI: unsupported type "mcp"');
  });
});
