import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { writeAdaptedFile, FileExistsError } from './writer.js';

describe('writeAdaptedFile', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'keness-writer-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  it('writes file to disk', () => {
    const path = join(tmpDir, 'output.md');
    writeAdaptedFile({ content: 'hello', path, permissions: 0o644 });
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, 'utf8')).toBe('hello');
  });

  it('creates parent directories recursively', () => {
    const path = join(tmpDir, 'a', 'b', 'c', 'output.md');
    writeAdaptedFile({ content: 'nested', path, permissions: 0o644 });
    expect(existsSync(path)).toBe(true);
  });

  it('throws FileExistsError when file exists and overwrite is false', () => {
    const path = join(tmpDir, 'existing.md');
    writeAdaptedFile({ content: 'original', path, permissions: 0o644 });
    expect(() =>
      writeAdaptedFile({ content: 'new', path, permissions: 0o644 }, { overwrite: false }),
    ).toThrow(FileExistsError);
  });

  it('FileExistsError message contains the path', () => {
    const path = join(tmpDir, 'existing.md');
    writeAdaptedFile({ content: 'original', path, permissions: 0o644 });
    try {
      writeAdaptedFile({ content: 'new', path, permissions: 0o644 }, { overwrite: false });
    } catch (e) {
      expect(e).toBeInstanceOf(FileExistsError);
      expect((e as FileExistsError).message).toContain(path);
      expect((e as FileExistsError).path).toBe(path);
    }
  });

  it('overwrites file when overwrite is true', () => {
    const path = join(tmpDir, 'existing.md');
    writeAdaptedFile({ content: 'original', path, permissions: 0o644 });
    writeAdaptedFile({ content: 'updated', path, permissions: 0o644 }, { overwrite: true });
    expect(readFileSync(path, 'utf8')).toBe('updated');
  });

  it('does not throw when file does not exist and overwrite is false', () => {
    const path = join(tmpDir, 'new.md');
    expect(() =>
      writeAdaptedFile({ content: 'hello', path, permissions: 0o644 }, { overwrite: false }),
    ).not.toThrow();
  });
});
