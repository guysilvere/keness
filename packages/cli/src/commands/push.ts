import { cancel, confirm, intro, isCancel, log, outro, spinner } from '@clack/prompts';
import chalk from 'chalk';
import {
  adaptContent,
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
  type KenessElement,
  type Provider,
  type Registry,
  type RegistryEntry,
  type TargetDiff,
} from '@keness/core';
import { BRAND, MUTED, relPath, renderTargetDiff } from './_ui.js';

interface PushOpts {
  to?: string;
  yes?: boolean;
  dryRun?: boolean;
  aiAdapt?: boolean;
  provider?: string;
}

async function applyAndFinish(
  diffs: TargetDiff[],
  entry: RegistryEntry,
  element: KenessElement,
  now: string,
  opts: Pick<PushOpts, 'yes' | 'dryRun'>,
  registry: Registry,
): Promise<void> {
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

  for (const d of diffs) {
    const adapter = getAdapter(d.appId);
    renderTargetDiff(d, adapter?.name ?? d.appId);
  }

  if (opts.dryRun) {
    outro(chalk.hex(MUTED)('Dry run — nothing written.'));
    return;
  }

  if (!opts.yes) {
    const go = await confirm({ message: 'Write these files?' });
    if (isCancel(go) || !go) { cancel('Aborted — nothing written.'); return; }
  }

  const { written, updated } = applyDiffs(diffs, entry, now);
  for (const p of written) log.success(relPath(p));

  saveRegistry(
    updateEntry(registry, entry.id, {
      contentHash: hashContent(element.content),
      targets: updated,
      updatedAt: now,
    }),
  );

  outro(chalk.hex(BRAND)('Done.'));
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

  const requestedIds = opts.to
    ? (opts.to.split(',').map((s) => s.trim()) as AppId[])
    : entry.targets.map((t) => t.appId);

  const existingIds = requestedIds.filter((appId) =>
    entry.targets.some((t) => t.appId === appId),
  );
  const newIds = requestedIds.filter(
    (appId) => !entry.targets.some((t) => t.appId === appId),
  );

  // --ai-adapt: rewrite content per-target using AI before computing diffs
  if (opts.aiAdapt) {
    const s = spinner();
    s.start('AI adapting content for each target…');
    try {
      const allIds = [...existingIds, ...newIds];
      const adaptedElements = new Map<AppId, KenessElement>();
      for (const appId of allIds) {
        const adapter = getAdapter(appId);
        if (!adapter) continue;
        const result = await adaptContent(element, adapter.name, {
          ...(opts.provider && { provider: opts.provider as Provider }),
        });
        adaptedElements.set(appId, { ...element, content: result.content });
      }
      s.stop('AI adaptation complete');

      const diffs: TargetDiff[] = [
        ...existingIds.flatMap((appId) => {
          const el = adaptedElements.get(appId) ?? element;
          return computeDiffs(entry, el, [appId]);
        }),
        ...newIds.flatMap((appId) => {
          const el = adaptedElements.get(appId) ?? element;
          return computeDiffsForNewApps(entry, el, [appId], 'project');
        }),
      ];

      await applyAndFinish(diffs, entry, element, now, opts, registry);
      return;
    } catch (err) {
      s.stop('AI adaptation failed');
      log.error(String(err));
      return;
    }
  }

  const diffs = [
    ...computeDiffs(entry, element, existingIds.length ? existingIds : undefined),
    ...computeDiffsForNewApps(entry, element, newIds, 'project'),
  ];

  await applyAndFinish(diffs, entry, element, now, opts, registry);
}
