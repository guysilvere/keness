import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { opencodeAdapter } from './opencode.js';

const mockSkill = {
  id: 'abc6',
  type: 'skill' as const,
  name: 'my-skill',
  description: 'A test skill',
  content: 'Do something useful.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('opencodeAdapter', () => {
  it('has correct identity', () => {
    expect(opencodeAdapter.id).toBe('opencode');
    expect(opencodeAdapter.binaryName).toBe('opencode');
    expect(opencodeAdapter.supports).toContain('skill');
    expect(opencodeAdapter.supports).toContain('rule');
    expect(opencodeAdapter.supports).not.toContain('agent');
    expect(opencodeAdapter.supports).not.toContain('mcp');
  });

  it('resolves global skill path on linux', () => {
    const p = opencodeAdapter.resolvePath('skill', 'my-skill', 'global', 'linux');
    expect(p).toBe(join(homedir(), '.config', 'opencode', 'my-skill.md'));
  });

  it('resolves global rule path to AGENTS.md on linux', () => {
    const p = opencodeAdapter.resolvePath('rule', 'no-console', 'global', 'linux');
    expect(p).toBe(join(homedir(), '.config', 'opencode', 'AGENTS.md'));
  });

  it('resolves global skill path on darwin', () => {
    const p = opencodeAdapter.resolvePath('skill', 'my-skill', 'global', 'darwin');
    expect(p).toBe(join(homedir(), '.config', 'opencode', 'my-skill.md'));
  });

  it('resolves global skill path on win32 using APPDATA', () => {
    const appdata = process.env['APPDATA'] ?? join(homedir(), 'AppData', 'Roaming');
    const p = opencodeAdapter.resolvePath('skill', 'my-skill', 'global', 'win32');
    expect(p).toBe(join(appdata, 'opencode', 'my-skill.md'));
  });

  it('configDir global on linux returns ~/.config/opencode', () => {
    const d = opencodeAdapter.configDir('global', 'linux');
    expect(d).toBe(join(homedir(), '.config', 'opencode'));
  });

  it('formats a skill with H1 and description', () => {
    const { content, permissions } = opencodeAdapter.format(mockSkill);
    expect(content).toMatch(/^# my-skill\n\n/);
    expect(content).toContain('A test skill');
    expect(content).toContain('Do something useful.');
    expect(permissions).toBe(0o644);
  });

  it('formats a skill without description when empty', () => {
    const el = { ...mockSkill, description: '' };
    const { content } = opencodeAdapter.format(el);
    expect(content).toMatch(/^# my-skill\n\n/);
    expect(content).not.toContain('A test skill');
  });

  it('rule path ends with AGENTS.md', () => {
    const el = { ...mockSkill, type: 'rule' as const, name: 'no-console' };
    const { path } = opencodeAdapter.format(el);
    expect(path.endsWith('AGENTS.md')).toBe(true);
  });

  it('skill path ends with <name>.md', () => {
    const { path } = opencodeAdapter.format(mockSkill);
    expect(path.endsWith('my-skill.md')).toBe(true);
  });

  it('throws for agent type', () => {
    expect(() =>
      opencodeAdapter.resolvePath('agent' as 'skill', 'x', 'project'),
    ).toThrow('Opencode: unsupported type "agent"');
  });

  it('throws for mcp type', () => {
    expect(() =>
      opencodeAdapter.resolvePath('mcp' as 'skill', 'x', 'project'),
    ).toThrow('Opencode: unsupported type "mcp"');
  });
});
