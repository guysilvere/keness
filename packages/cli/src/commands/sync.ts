import { cancel, confirm, intro, isCancel, log, outro, spinner } from '@clack/prompts';
import chalk from 'chalk';
import { existsSync, readFileSync } from 'node:fs';
import {
  adaptContent,
  applyDiffs,
  computeDiffs,
  elementFromEntry,
  getAdapter,
  hashContent,
  loadRegistry,
  saveRegistry,
  updateEntry,
  type KenessElement,
  type Provider,
} from '@keness/core';
import { BRAND, MUTED, relPath, renderTargetDiff } from './_ui.js';

interface SyncOpts {
  yes?: boolean;
  dryRun?: boolean;
  aiAdapt?: boolean;
  provider?: string;
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

  // --ai-adapt: rewrite content per-target using AI
  if (opts.aiAdapt) {
    const s = spinner();
    s.start('AI adapting content for each target…');
    let adaptedMap: Map<string, KenessElement>;
    try {
      adaptedMap = new Map();
      for (const t of entry.targets) {
        const adapter = getAdapter(t.appId);
        if (!adapter) continue;
        const result = await adaptContent(element, adapter.name, {
          ...(opts.provider && { provider: opts.provider as Provider }),
        });
        adaptedMap.set(t.appId, { ...element, content: result.content });
      }
      s.stop('AI adaptation complete');
    } catch (err) {
      s.stop('AI adaptation failed');
      log.error(String(err));
      return;
    }

    const diffs = entry.targets.flatMap((t) => {
      const el = adaptedMap.get(t.appId) ?? element;
      return computeDiffs(entry, el, [t.appId]);
    });

    if (diffs.length === 0) {
      outro(chalk.hex(MUTED)('No targets registered for this element.'));
      return;
    }

    for (const d of diffs) {
      const adapter = getAdapter(d.appId);
      renderTargetDiff(d, adapter?.name ?? d.appId);
    }

    if (opts.dryRun) { outro(chalk.hex(MUTED)('Dry run — nothing written.')); return; }

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
    return;
  }

  // Standard sync (no AI)
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

  if (opts.dryRun) { outro(chalk.hex(MUTED)('Dry run — nothing written.')); return; }

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
