import { mkdtemp, rm, writeFile, mkdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  computeDiffs,
  applyDiffs,
  elementFromEntry,
} from './sync-engine.js';
import { hashContent } from './registry/index.js';
import type { RegistryEntry, KenessElement } from './types.js';

function makeEntry(
  contentPath: string,
  targetPath: string,
  writtenHash?: string,
): RegistryEntry {
  return {
    id: 'test-1',
    type: 'rule',
    name: 'no-console',
    description: 'No console',
    contentPath,
    contentHash: hashContent('Never use console.log.'),
    targets: [
      {
        appId: 'claude-code',
        scope: 'project',
        filePath: targetPath,
        contentHash: hashContent('Never use console.log.'),
        ...(writtenHash !== undefined ? { writtenHash } : {}),
        pushedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

const mockElement: KenessElement = {
  id: 'test-1',
  type: 'rule',
  name: 'no-console',
  description: 'No console',
  content: 'Never use console.log.',
  tags: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('sync-engine', () => {
  let tmpDir: string;
  // Tracks real-FS paths written by tests that use adapter-resolved paths
  const adapterWritten: string[] = [];

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'keness-se-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
    for (const p of adapterWritten.splice(0)) {
      if (existsSync(p)) await unlink(p);
    }
  });

  describe('elementFromEntry', () => {
    it('reads content from contentPath', async () => {
      const contentPath = join(tmpDir, 'content.md');
      await writeFile(contentPath, 'Hello world', 'utf8');
      const entry: RegistryEntry = {
        id: 'x', type: 'skill', name: 'x', description: '',
        contentPath, contentHash: '', targets: [], tags: [],
        createdAt: '', updatedAt: '',
      };
      const el = elementFromEntry(entry);
      expect(el.content).toBe('Hello world');
    });

    it('returns empty content when file does not exist', () => {
      const entry: RegistryEntry = {
        id: 'x', type: 'skill', name: 'x', description: '',
        contentPath: join(tmpDir, 'nonexistent.md'),
        contentHash: '', targets: [], tags: [],
        createdAt: '', updatedAt: '',
      };
      const el = elementFromEntry(entry);
      expect(el.content).toBe('');
    });
  });

  describe('computeDiffs — isNew', () => {
    it('marks target as new when file does not exist', () => {
      const entry = makeEntry(join(tmpDir, 'content.md'), join(tmpDir, 'nonexistent.md'));
      const diffs = computeDiffs(entry, mockElement);
      expect(diffs).toHaveLength(1);
      expect(diffs[0]!.isNew).toBe(true);
      expect(diffs[0]!.isUpToDate).toBe(false);
    });
  });

  describe('computeDiffs — isUpToDate', () => {
    it('marks target as up to date when file content matches adapted', async () => {
      // computeDiffs resolves the on-disk path via the adapter (not from entry.targets[].filePath)
      // so we write to the adapter-resolved path and clean up after
      const entry = makeEntry(join(tmpDir, 'content.md'), 'placeholder');
      const diffs1 = computeDiffs(entry, mockElement);
      const { filePath, adapted } = diffs1[0]!;
      await mkdir(join(filePath, '..'), { recursive: true });
      await writeFile(filePath, adapted, 'utf8');
      adapterWritten.push(filePath);

      const diffs2 = computeDiffs(entry, mockElement);
      expect(diffs2[0]!.isUpToDate).toBe(true);
      expect(diffs2[0]!.isNew).toBe(false);
    });
  });

  describe('computeDiffs — manuallyEdited', () => {
    it('detects manual edits when file differs from writtenHash', async () => {
      const entry0 = makeEntry(join(tmpDir, 'content.md'), 'placeholder');
      const diffs0 = computeDiffs(entry0, mockElement);
      const { filePath, adapted: adaptedContent } = diffs0[0]!;

      const writtenHash = hashContent(adaptedContent);
      await mkdir(join(filePath, '..'), { recursive: true });
      await writeFile(filePath, adaptedContent + '\n\n# manually added section', 'utf8');
      adapterWritten.push(filePath);

      const entry = makeEntry(join(tmpDir, 'content.md'), filePath, writtenHash);
      const diffs = computeDiffs(entry, mockElement);
      expect(diffs[0]!.manuallyEdited).toBe(true);
    });

    it('does not flag as manually edited when file matches adapted content', async () => {
      const entry0 = makeEntry(join(tmpDir, 'content.md'), 'placeholder');
      const diffs0 = computeDiffs(entry0, mockElement);
      const { filePath, adapted: adaptedContent } = diffs0[0]!;

      const writtenHash = hashContent(adaptedContent);
      await mkdir(join(filePath, '..'), { recursive: true });
      await writeFile(filePath, adaptedContent, 'utf8');
      adapterWritten.push(filePath);

      const entry = makeEntry(join(tmpDir, 'content.md'), filePath, writtenHash);
      const diffs = computeDiffs(entry, mockElement);
      expect(diffs[0]!.manuallyEdited).toBe(false);
    });

    it('does not flag as manually edited when writtenHash is absent', async () => {
      const entry0 = makeEntry(join(tmpDir, 'content.md'), 'placeholder');
      const diffs0 = computeDiffs(entry0, mockElement);
      const { filePath, adapted: adaptedContent } = diffs0[0]!;

      await mkdir(join(filePath, '..'), { recursive: true });
      await writeFile(filePath, 'some different content', 'utf8');
      adapterWritten.push(filePath);

      // No writtenHash → can't detect manual edit
      const entry = makeEntry(join(tmpDir, 'content.md'), filePath, undefined);
      const diffs = computeDiffs(entry, mockElement);
      expect(diffs[0]!.manuallyEdited).toBe(false);
    });
  });

  describe('applyDiffs — writtenHash', () => {
    it('writes file and sets writtenHash on the updated target', async () => {
      const entry = makeEntry(join(tmpDir, 'content.md'), 'placeholder');
      const diffs = computeDiffs(entry, mockElement);
      adapterWritten.push(diffs[0]!.filePath);

      const now = new Date().toISOString();
      const { written, updated } = applyDiffs(diffs, entry, now);

      expect(written).toHaveLength(1);
      const t = updated.find((u) => u.appId === 'claude-code');
      expect(t).toBeDefined();
      expect(t!.writtenHash).toBe(hashContent(diffs[0]!.adapted));
      expect(t!.pushedAt).toBe(now);
    });

    it('skips up-to-date diffs', async () => {
      const entry0 = makeEntry(join(tmpDir, 'content.md'), 'placeholder');
      const diffs0 = computeDiffs(entry0, mockElement);
      const { filePath, adapted: adaptedContent } = diffs0[0]!;

      await mkdir(join(filePath, '..'), { recursive: true });
      await writeFile(filePath, adaptedContent, 'utf8');
      adapterWritten.push(filePath);

      const entry = makeEntry(join(tmpDir, 'content.md'), filePath, hashContent(adaptedContent));
      const diffs = computeDiffs(entry, mockElement);
      expect(diffs[0]!.isUpToDate).toBe(true);

      const { written } = applyDiffs(diffs, entry, new Date().toISOString());
      expect(written).toHaveLength(0);
    });
  });
});
