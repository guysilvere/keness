import { cancel, confirm, intro, isCancel, log, outro } from '@clack/prompts';
import chalk from 'chalk';
import {
  loadRegistry,
  removeEntry,
  removeTargetFiles,
  saveRegistry,
} from '@keness/core';
import { BRAND, MUTED, relPath } from './_ui.js';

interface RmOpts {
  from?: string;
  yes?: boolean;
  dryRun?: boolean;
}

export async function runRm(id: string, opts: RmOpts): Promise<void> {
  intro(chalk.hex(BRAND).bold(' keness rm '));

  const registry = loadRegistry();
  const entry =
    registry.entries.find((e) => e.id === id || e.id.startsWith(id)) ??
    registry.entries.find((e) => e.name === id);

  if (!entry) {
    log.error(`No element found for "${id}". Run keness list to see registered elements.`);
    return;
  }

  const targets =
    opts.from && opts.from !== 'all'
      ? entry.targets.filter((t) =>
          opts.from!.split(',').map((s) => s.trim()).includes(t.appId),
        )
      : entry.targets;

  const removeAll = !opts.from || opts.from === 'all';

  log.message(
    `${chalk.bold(entry.name)} ${chalk.hex(MUTED)(`(${entry.type})`)} — ${targets.length} target${targets.length !== 1 ? 's' : ''}`,
  );
  for (const t of targets) {
    log.message(`  ${chalk.red('✗')} ${relPath(t.filePath)}`);
  }
  if (removeAll) {
    log.message(`  ${chalk.red('✗')} registry entry`);
  }

  if (opts.dryRun) {
    outro(chalk.hex(MUTED)('Dry run — nothing deleted.'));
    return;
  }

  if (!opts.yes) {
    const go = await confirm({
      message: removeAll
        ? 'Delete these files and remove from registry?'
        : 'Delete these files?',
    });
    if (isCancel(go) || !go) { cancel('Aborted — nothing deleted.'); return; }
  }

  // Delete files
  const removed = removeTargetFiles({ ...entry, targets });
  for (const p of removed) log.success(`Removed: ${relPath(p)}`);
  if (removed.length === 0) log.warn('No target files found on disk.');

  // Remove from registry
  if (removeAll) {
    saveRegistry(removeEntry(registry, entry.id));
    log.success(`Unregistered: ${chalk.bold(entry.name)} ${chalk.hex(MUTED)(`(id: ${entry.id})`)}`);
  }

  outro(chalk.hex(BRAND)('Done.'));
}
