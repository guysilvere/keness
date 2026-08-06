import { describe, expect, it } from 'vitest';
import { diffLines, hasDiff, hunks } from './diff.js';

describe('diffLines', () => {
  it('returns empty array for identical content', () => {
    const lines = diffLines('hello\nworld', 'hello\nworld');
    expect(lines.every((l) => l.type === 'context')).toBe(true);
    expect(hasDiff(lines)).toBe(false);
  });

  it('marks all lines as additions for empty old content', () => {
    const lines = diffLines('', 'foo\nbar');
    expect(lines).toHaveLength(2);
    expect(lines.every((l) => l.type === 'add')).toBe(true);
    expect(hasDiff(lines)).toBe(true);
  });

  it('marks all lines as removals for empty new content', () => {
    const lines = diffLines('foo\nbar', '');
    expect(lines).toHaveLength(2);
    expect(lines.every((l) => l.type === 'remove')).toBe(true);
  });

  it('detects a single changed line', () => {
    const lines = diffLines('a\nb\nc', 'a\nB\nc');
    const adds    = lines.filter((l) => l.type === 'add');
    const removes = lines.filter((l) => l.type === 'remove');
    expect(adds).toHaveLength(1);
    expect(adds[0]!.text).toBe('B');
    expect(removes).toHaveLength(1);
    expect(removes[0]!.text).toBe('b');
  });

  it('handles added lines in the middle', () => {
    const lines = diffLines('a\nc', 'a\nb\nc');
    expect(lines.filter((l) => l.type === 'add')).toHaveLength(1);
    expect(lines.filter((l) => l.type === 'remove')).toHaveLength(0);
  });

  it('handles removed lines', () => {
    const lines = diffLines('a\nb\nc', 'a\nc');
    expect(lines.filter((l) => l.type === 'remove')).toHaveLength(1);
    expect(lines.filter((l) => l.type === 'add')).toHaveLength(0);
  });

  it('preserves line text', () => {
    const lines = diffLines('hello', 'world');
    expect(lines.find((l) => l.type === 'remove')?.text).toBe('hello');
    expect(lines.find((l) => l.type === 'add')?.text).toBe('world');
  });
});

describe('hunks', () => {
  it('returns empty array when no changes', () => {
    const lines = diffLines('a\nb\nc', 'a\nb\nc');
    expect(hunks(lines)).toHaveLength(0);
  });

  it('returns a single hunk for a single change', () => {
    const lines = diffLines('a\nb\nc', 'a\nB\nc');
    const hs = hunks(lines, 1);
    expect(hs).toHaveLength(1);
    const types = hs[0]!.map((l) => l.type);
    expect(types).toContain('add');
    expect(types).toContain('remove');
  });

  it('merges nearby changes into one hunk', () => {
    // Two changes within 3-line window should be one hunk
    const a = Array.from({ length: 10 }, (_, i) => String(i)).join('\n');
    const b = a.replace('3', 'X').replace('5', 'Y');
    const lines = diffLines(a, b);
    const hs = hunks(lines, 3);
    expect(hs).toHaveLength(1);
  });

  it('produces separate hunks for distant changes', () => {
    // Changes at line 1 and line 20 should be separate hunks with context=3
    const a = Array.from({ length: 25 }, (_, i) => String(i)).join('\n');
    const b = a.replace(/^0/m, 'X').replace(/^20/m, 'Y');
    const lines = diffLines(a, b);
    const hs = hunks(lines, 3);
    expect(hs.length).toBeGreaterThanOrEqual(2);
  });
});
