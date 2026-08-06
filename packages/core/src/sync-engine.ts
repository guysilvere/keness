import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import type {
  AppId,
  KenessElement,
  RegistryEntry,
  TargetState,
} from './types.js';
import { getAdapter } from './adapters/index.js';
import { writeAdaptedFile } from './writer.js';
import { hashContent } from './registry/index.js';
import { diffLines, hasDiff } from './diff.js';

export type SyncAction = 'push' | 'sync' | 'rm';

export interface TargetDiff {
  appId: AppId;
  filePath: string;
  adapted: string;
  current: string | null;
  isNew: boolean;
  isUpToDate: boolean;
  lines: ReturnType<typeof diffLines>;
}

/** Build a KenessElement from a RegistryEntry, re-reading the content file. */
export function elementFromEntry(entry: RegistryEntry): KenessElement {
  let content = '';
  if (existsSync(entry.contentPath)) {
    content = readFileSync(entry.contentPath, 'utf8');
  }
  return {
    id: entry.id,
    type: entry.type,
    name: entry.name,
    description: entry.description,
    content,
    tags: entry.tags,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

/** Compute per-target diffs between the library element and on-disk files. */
export function computeDiffs(
  entry: RegistryEntry,
  element: KenessElement,
  appIds?: AppId[],
): TargetDiff[] {
  const targets = appIds
    ? entry.targets.filter((t) => appIds.includes(t.appId))
    : entry.targets;

  return targets.map((t) => {
    const adapter = getAdapter(t.appId);
    if (!adapter) {
      return {
        appId: t.appId,
        filePath: t.filePath,
        adapted: '',
        current: null,
        isNew: true,
        isUpToDate: false,
        lines: [],
      };
    }
    const adapted = adapter.format(element);
    const current = existsSync(adapted.path)
      ? readFileSync(adapted.path, 'utf8')
      : null;
    const lines = diffLines(current ?? '', adapted.content);
    return {
      appId: t.appId,
      filePath: adapted.path,
      adapted: adapted.content,
      current,
      isNew: current === null,
      isUpToDate: current !== null && !hasDiff(lines),
      lines,
    };
  });
}

/** Compute diffs for apps NOT yet in entry.targets (for push --to new-app). */
export function computeDiffsForNewApps(
  entry: RegistryEntry,
  element: KenessElement,
  appIds: AppId[],
  scope: TargetState['scope'],
): TargetDiff[] {
  const existingIds = new Set(entry.targets.map((t) => t.appId));
  return appIds
    .filter((id) => !existingIds.has(id))
    .map((appId) => {
      const adapter = getAdapter(appId);
      if (!adapter) {
        return {
          appId,
          filePath: '',
          adapted: '',
          current: null,
          isNew: true,
          isUpToDate: false,
          lines: [],
        };
      }
      const adapted = adapter.format(element);
      const current = existsSync(adapted.path)
        ? readFileSync(adapted.path, 'utf8')
        : null;
      const lines = diffLines(current ?? '', adapted.content);
      return {
        appId,
        filePath: adapted.path,
        adapted: adapted.content,
        current,
        isNew: current === null,
        isUpToDate: current !== null && !hasDiff(lines),
        lines,
        _scope: scope,
      };
    });
}

/** Write the adapted files for the given diffs. Returns updated TargetStates. */
export function applyDiffs(
  diffs: TargetDiff[],
  entry: RegistryEntry,
  now: string,
): { written: string[]; updated: TargetState[] } {
  const written: string[] = [];
  const updated: TargetState[] = [...entry.targets];

  for (const d of diffs) {
    if (d.isUpToDate || !d.adapted) continue;
    const adapter = getAdapter(d.appId);
    if (!adapter) continue;
    writeAdaptedFile(
      { content: d.adapted, path: d.filePath, permissions: 0o644 },
      { overwrite: true },
    );
    written.push(d.filePath);

    const existing = updated.findIndex((t) => t.appId === d.appId);
    const state: TargetState = {
      appId: d.appId,
      scope: existing >= 0 ? updated[existing]!.scope : 'project',
      filePath: d.filePath,
      contentHash: hashContent(d.adapted),
      pushedAt: now,
    };
    if (existing >= 0) updated[existing] = state;
    else updated.push(state);
  }

  return { written, updated };
}

/** Remove all target files for an entry. Returns paths that were deleted. */
export function removeTargetFiles(entry: RegistryEntry): string[] {
  const removed: string[] = [];
  for (const t of entry.targets) {
    if (existsSync(t.filePath)) {
      unlinkSync(t.filePath);
      removed.push(t.filePath);
    }
  }
  return removed;
}
