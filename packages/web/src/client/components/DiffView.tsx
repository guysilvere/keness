import type { DiffLine, TargetDiff } from '../api.js';
import { hunksFromLines } from '../diff.js';

function DiffLineRow({ line }: { line: DiffLine }) {
  const cls =
    line.type === 'add'    ? 'diff-add' :
    line.type === 'remove' ? 'diff-rem' : 'diff-ctx';
  const prefix = line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  ';
  return <div class={`diff-line ${cls}`}>{prefix}{line.text}</div>;
}

export function DiffView({ diff }: { diff: TargetDiff }) {
  if (diff.isUpToDate) {
    return <p class="diff-ok">✓ up to date</p>;
  }

  if (diff.isNew) {
    const lines = diff.adapted.split('\n');
    return (
      <div class="diff-block">
        {lines.map((t, i) => (
          <div key={i} class="diff-line diff-add">+ {t}</div>
        ))}
      </div>
    );
  }

  const hs = hunksFromLines(diff.lines);
  if (hs.length === 0) return <p class="diff-ok">✓ no changes</p>;

  return (
    <div class="diff-block">
      {hs.map((hunk, hi) => (
        <div key={hi} class="diff-hunk">
          {hi > 0 && <div class="diff-sep">···</div>}
          {hunk.map((l, li) => <DiffLineRow key={li} line={l} />)}
        </div>
      ))}
    </div>
  );
}
