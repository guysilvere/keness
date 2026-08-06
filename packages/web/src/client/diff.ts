import type { DiffLine } from './api.js';

/** Re-export of packages/core hunks logic, duplicated for the browser bundle. */
export function hunksFromLines(lines: DiffLine[], context = 3): DiffLine[][] {
  const result: DiffLine[][] = [];
  let hunk: DiffLine[] = [];
  let lastChangeIdx = -1;

  for (let idx = 0; idx < lines.length; idx++) {
    const l = lines[idx]!;
    if (l.type !== 'context') {
      const start = Math.max(0, idx - context);
      if (hunk.length === 0) {
        for (let k = start; k < idx; k++) hunk.push(lines[k]!);
      }
      hunk.push(l);
      lastChangeIdx = idx;
    } else if (lastChangeIdx >= 0 && idx - lastChangeIdx <= context) {
      hunk.push(l);
    } else if (hunk.length > 0) {
      result.push(hunk);
      hunk = [];
      lastChangeIdx = -1;
    }
  }
  if (hunk.length > 0) result.push(hunk);
  return result;
}
