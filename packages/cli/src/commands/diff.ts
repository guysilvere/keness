import { intro, log, outro } from '@clack/prompts';
import chalk from 'chalk';
import {
  computeDiffs,
  elementFromEntry,
  getAdapter,
  loadRegistry,
} from '@keness/core';
import { BRAND, MUTED, renderTargetDiff } from './_ui.js';

interface DiffOpts {
  for?: string;
}

export async function runDiff(id: string, opts: DiffOpts): Promise<void> {
  intro(chalk.hex(BRAND).bold(' keness diff '));

  const registry = loadRegistry();
  const entry =
    registry.entries.find((e) => e.id === id || e.id.startsWith(id)) ??
    registry.entries.find((e) => e.name === id);

  if (!entry) {
    log.error(`No element found for "${id}". Run keness list to see registered elements.`);
    return;
  }

  const element = elementFromEntry(entry);
  const diffs = computeDiffs(entry, element);

  if (diffs.length === 0) {
    outro(chalk.hex(MUTED)('No targets registered for this element.'));
    return;
  }

  let anyChanges = false;
  for (const d of diffs) {
    const adapter = getAdapter(d.appId);
    renderTargetDiff(d, adapter?.name ?? d.appId);
    if (!d.isUpToDate) anyChanges = true;
  }

  if (!anyChanges) {
    outro(chalk.hex(MUTED)('All targets are up to date.'));
  } else {
    outro(chalk.hex(MUTED)('Run keness push ' + (entry.id) + ' to apply changes.'));
  }
}
