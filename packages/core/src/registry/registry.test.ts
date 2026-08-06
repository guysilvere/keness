import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  loadRegistry,
  saveRegistry,
  addEntry,
  updateEntry,
  removeEntry,
  getEntry,
  findByName,
  hashContent,
} from './index.js';
import type { RegistryEntry } from '../types.js';

function makeEntry(overrides: Partial<RegistryEntry> = {}): RegistryEntry {
  return {
    id: 'test-1',
    type: 'skill',
    name: 'my-skill',
    description: 'A test skill',
    contentPath: '/fake/path/content.md',
    contentHash: 'abc123',
    targets: [],
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('registry', () => {
  let tmpDir: string;
  let registryPath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'keness-test-'));
    registryPath = join(tmpDir, 'registry.json');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  it('returns an empty registry when file does not exist', () => {
    const reg = loadRegistry(join(tmpDir, 'nonexistent.json'));
    expect(reg.version).toBe('1');
    expect(reg.entries).toHaveLength(0);
  });

  it('saves and loads entries', () => {
    let reg = loadRegistry(registryPath);
    reg = addEntry(reg, makeEntry());
    saveRegistry(reg, registryPath);

    const loaded = loadRegistry(registryPath);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0]?.id).toBe('test-1');
  });

  it('finds an entry by id', () => {
    let reg = loadRegistry(registryPath);
    reg = addEntry(reg, makeEntry());
    expect(getEntry(reg, 'test-1')?.name).toBe('my-skill');
    expect(getEntry(reg, 'nonexistent')).toBeUndefined();
  });

  it('finds an entry by name', () => {
    let reg = loadRegistry(registryPath);
    reg = addEntry(reg, makeEntry());
    expect(findByName(reg, 'my-skill')?.id).toBe('test-1');
    expect(findByName(reg, 'other')).toBeUndefined();
  });

  it('updates an entry', () => {
    let reg = loadRegistry(registryPath);
    reg = addEntry(reg, makeEntry());
    reg = updateEntry(reg, 'test-1', { description: 'Updated description' });
    expect(getEntry(reg, 'test-1')?.description).toBe('Updated description');
  });

  it('removes an entry', () => {
    let reg = loadRegistry(registryPath);
    reg = addEntry(reg, makeEntry());
    reg = addEntry(reg, makeEntry({ id: 'test-2', name: 'other-skill' }));
    reg = removeEntry(reg, 'test-1');
    expect(reg.entries).toHaveLength(1);
    expect(reg.entries[0]?.id).toBe('test-2');
  });

  it('hashContent produces a 16-char hex string', () => {
    const h = hashContent('hello world');
    expect(h).toHaveLength(16);
    expect(h).toMatch(/^[0-9a-f]+$/);
    expect(hashContent('hello world')).toBe(h);
    expect(hashContent('other')).not.toBe(h);
  });

  it('does not crash on corrupted registry file', async () => {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(registryPath, 'not valid json', 'utf8');
    const reg = loadRegistry(registryPath);
    expect(reg.entries).toHaveLength(0);
  });
});
