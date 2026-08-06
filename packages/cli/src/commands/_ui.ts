import chalk from 'chalk';
import { log, note } from '@clack/prompts';
import { hunks } from '@keness/core';
import type { DiffLine, TargetDiff } from '@keness/core';

const BRAND = '#48bf84';
const MUTED  = '#afaab9';

export function relPath(abs: string): string {
  const cwd = process.cwd();
  return abs.startsWith(cwd) ? '.' + abs.slice(cwd.length) : abs;
}

export function renderDiffLine(l: DiffLine): string {
  if (l.type === 'add')    return chalk.green('+ ' + l.text);
  if (l.type === 'remove') return chalk.red('- ' + l.text);
  return chalk.hex(MUTED)('  ' + l.text);
}

export function renderTargetDiff(d: TargetDiff, appName: string): void {
  const label = `${appName}  ${chalk.hex(MUTED)(relPath(d.filePath))}`;

  if (d.isUpToDate) {
    log.info(`${chalk.hex(MUTED)(appName)} — up to date`);
    return;
  }

  if (d.isNew) {
    // New file: show the full adapted content as additions
    const lines = d.adapted.split('\n').map((t) => chalk.green('+ ' + t));
    note(lines.join('\n'), `New file — ${label}`);
    return;
  }

  // Changed file: show hunks
  const hs = hunks(d.lines);
  if (hs.length === 0) { log.info(`${appName} — up to date`); return; }
  const rendered = hs
    .map((h) => h.map(renderDiffLine).join('\n'))
    .join('\n' + chalk.hex(MUTED)('·'.repeat(40)) + '\n');
  note(rendered, `Changes — ${label}`);
}

export { BRAND, MUTED };
