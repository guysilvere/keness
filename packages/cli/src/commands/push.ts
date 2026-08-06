import { cancel, confirm, intro, isCancel, log, outro } from '@clack/prompts';
import chalk from 'chalk';
import {
  applyDiffs,
  computeDiffs,
  computeDiffsForNewApps,
  elementFromEntry,
  getAdapter,
  hashContent,
  loadRegistry,
  saveRegistry,
  updateEntry,
  type AppId,
} from '@keness/core';
import { BRAND, MUTED, relPath, renderTargetDiff } from './_ui.js';

interface PushOpts {
  to?: string;
  yes?: boolean;
}

export async function runPush(id: string, opts: PushOpts): Promise<void> {
  intro(chalk.hex(BRAND).bold(' keness push '));

  const registry = loadRegistry();
  const entry =
    registry.entries.find((e) => e.id === id || e.id.startsWith(id)) ??
    registry.entries.find((e) => e.name === id);

  if (!entry) {
    log.error(`No element found for "${id}". Run keness list to see registered elements.`);
    return;
  }

  const element = elementFromEntry(entry);
  const now = new Date().toISOString();

  // Determine target app IDs
  const requestedIds = opts.to
    ? (opts.to.split(',').map((s) => s.trim()) as AppId[])
    : entry.targets.map((t) => t.appId);

  // Split into existing targets and new ones
  const existingIds = requestedIds.filter((id) =>
    entry.targets.some((t) => t.appId === id),
  );
  const newIds = requestedIds.filter(
    (id) => !entry.targets.some((t) => t.appId === id),
  );

  const diffs = [
    ...computeDiffs(entry, element, existingIds.length ? existingIds : undefined),
    ...computeDiffsForNewApps(entry, element, newIds, 'project'),
  ];

  if (diffs.length === 0) {
    log.warn('No targets found. Use --to <apps> to specify target apps.');
    outro(chalk.hex(MUTED)('Nothing to do.'));
    return;
  }

  const allUpToDate = diffs.every((d) => d.isUpToDate);
  if (allUpToDate) {
    outro(chalk.hex(MUTED)('All targets are up to date.'));
    return;
  }

  // Preview
  for (const d of diffs) {
    const adapter = getAdapter(d.appId);
    renderTargetDiff(d, adapter?.name ?? d.appId);
  }

  // Confirm (skip with --yes)
  if (!opts.yes) {
    const go = await confirm({ message: 'Write these files?' });
    if (isCancel(go) || !go) { cancel('Aborted — nothing written.'); return; }
  }

  // Apply
  const { written, updated } = applyDiffs(diffs, entry, now);
  for (const p of written) log.success(relPath(p));

  // Update registry
  const newContentHash = hashContent(element.content);
  saveRegistry(
    updateEntry(registry, entry.id, {
      contentHash: newContentHash,
      targets: updated,
      updatedAt: now,
    }),
  );

  outro(chalk.hex(BRAND)('Done.'));
}
