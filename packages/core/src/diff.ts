export type DiffLine =
  | { type: 'context'; text: string }
  | { type: 'add'; text: string }
  | { type: 'remove'; text: string };

/** LCS-based line diff. Returns a flat list of annotated lines. */
export function diffLines(a: string, b: string): DiffLine[] {
  const as = a === '' ? [] : a.split('\n');
  const bs = b === '' ? [] : b.split('\n');
  const m = as.length;
  const n = bs.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        as[i - 1] === bs[j - 1]
          ? dp[i - 1]![j - 1]! + 1
          : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }

  const lines: DiffLine[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && as[i - 1] === bs[j - 1]) {
      lines.unshift({ type: 'context', text: as[i - 1]! });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      lines.unshift({ type: 'add', text: bs[j - 1]! });
      j--;
    } else {
      lines.unshift({ type: 'remove', text: as[i - 1]! });
      i--;
    }
  }
  return lines;
}

export function hasDiff(lines: DiffLine[]): boolean {
  return lines.some((l) => l.type !== 'context');
}

/**
 * Return only the changed hunks with CONTEXT lines of surrounding context,
 * separated by "@@" markers. Unchanged leading/trailing context is trimmed.
 */
export function hunks(lines: DiffLine[], context = 3): DiffLine[][] {
  const result: DiffLine[][] = [];
  let hunk: DiffLine[] = [];
  let lastChangeIdx = -1;

  for (let idx = 0; idx < lines.length; idx++) {
    const l = lines[idx]!;
    if (l.type !== 'context') {
      // flush context before this change
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
