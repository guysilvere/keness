import { cancel, confirm, intro, isCancel, log, outro } from '@clack/prompts';
import chalk from 'chalk';
import { existsSync, readFileSync } from 'node:fs';
import {
  applyDiffs,
  computeDiffs,
  elementFromEntry,
  getAdapter,
  hashContent,
  loadRegistry,
  saveRegistry,
  updateEntry,
} from '@keness/core';
import { BRAND, MUTED, relPath, renderTargetDiff } from './_ui.js';

interface SyncOpts {
  yes?: boolean;
}

export async function runSync(id: string, opts: SyncOpts): Promise<void> {
  intro(chalk.hex(BRAND).bold(' keness sync '));

  const registry = loadRegistry();
  const entry =
    registry.entries.find((e) => e.id === id || e.id.startsWith(id)) ??
    registry.entries.find((e) => e.name === id);

  if (!entry) {
    log.error(`No element found for "${id}". Run keness list to see registered elements.`);
    return;
  }

  // Re-read library content
  if (!existsSync(entry.contentPath)) {
    log.error(`Library content file not found: ${relPath(entry.contentPath)}`);
    return;
  }
  const currentContent = readFileSync(entry.contentPath, 'utf8');
  const currentHash = hashContent(currentContent);
  const libraryChanged = currentHash !== entry.contentHash;

  if (libraryChanged) {
    log.info(
      `Library content has changed since last push (${chalk.hex(MUTED)(entry.contentHash.slice(0, 8) + ' → ' + currentHash.slice(0, 8))})`,
    );
  }

  const element = elementFromEntry(entry);
  const diffs = computeDiffs(entry, element);

  if (diffs.length === 0) {
    outro(chalk.hex(MUTED)('No targets registered for this element.'));
    return;
  }

  const allUpToDate = diffs.every((d) => d.isUpToDate) && !libraryChanged;
  if (allUpToDate) {
    outro(chalk.hex(MUTED)('Everything is up to date.'));
    return;
  }

  for (const d of diffs) {
    const adapter = getAdapter(d.appId);
    renderTargetDiff(d, adapter?.name ?? d.appId);
  }

  if (!opts.yes) {
    const go = await confirm({ message: 'Sync to all targets?' });
    if (isCancel(go) || !go) { cancel('Aborted — nothing written.'); return; }
  }

  const now = new Date().toISOString();
  const { written, updated } = applyDiffs(diffs, entry, now);
  for (const p of written) log.success(relPath(p));

  saveRegistry(
    updateEntry(registry, entry.id, {
      contentHash: currentHash,
      targets: updated,
      updatedAt: now,
    }),
  );

  outro(chalk.hex(BRAND)('Done.'));
}
