import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import {
  addEntry,
  allAdapters,
  applyDiffs,
  computeDiffs,
  computeDiffsForNewApps,
  detectAll,
  elementFromEntry,
  getAdapter,
  hashContent,
  kenessLibraryDir,
  loadRegistry,
  removeEntry,
  removeTargetFiles,
  saveRegistry,
  scanContent,
  updateEntry,
  type AppId,
  type ElementType,
  type RegistryEntry,
  type Scope,
} from '@keness/core';

// ── Validation helpers ────────────────────────────────────────────────────────

const VALID_TYPES = new Set<ElementType>(['skill', 'agent', 'rule', 'mcp']);
const VALID_APP_IDS = new Set<AppId>(allAdapters.map((a) => a.id));
const VALID_SCOPES = new Set<Scope>(['project', 'global']);

/**
 * Registry IDs are 8-char hex strings. Accept exact matches or unambiguous
 * prefixes of at least 4 characters. Rejects empty strings (which would match
 * every entry via startsWith) and overly short prefixes.
 */
function findEntry(entries: RegistryEntry[], id: string): RegistryEntry | undefined {
  if (!id || id.length < 4) return undefined;
  return entries.find((e) => e.id === id || e.id.startsWith(id));
}

/**
 * Reject names that contain path separators or traversal sequences.
 * Allows alphanumerics, hyphens, underscores, and single dots (no leading dot,
 * no consecutive dots). Max 64 chars.
 */
function sanitizeName(name: string): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 64) return null;
  // No path separators, no traversal, no leading dot
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_\-.]*$/.test(trimmed)) return null;
  if (trimmed.includes('..')) return null;
  return trimmed;
}

// ── Routes ────────────────────────────────────────────────────────────────────

export function registerApiRoutes(app: FastifyInstance): void {

  // ── Status ──────────────────────────────────────────────────────────────────
  app.get('/api/status', async () => ({ status: 'ok', version: '0.1.0' }));

  // ── Adapters ─────────────────────────────────────────────────────────────────
  app.get('/api/adapters', async () => ({
    adapters: allAdapters.map((a) => ({
      id: a.id,
      name: a.name,
      supports: a.supports,
    })),
  }));

  // ── Detect ────────────────────────────────────────────────────────────────────
  app.get('/api/detect', async () => {
    const results = await detectAll(allAdapters);
    return { results };
  });

  // ── Registry list ─────────────────────────────────────────────────────────────
  app.get('/api/registry', async () => {
    const registry = loadRegistry();
    return { entries: registry.entries };
  });

  // ── Element detail + diffs ────────────────────────────────────────────────────
  app.get<{ Params: { id: string } }>('/api/registry/:id', async (req, reply) => {
    const registry = loadRegistry();
    const entry = findEntry(registry.entries, req.params.id);
    if (!entry) { reply.code(404); return { error: 'Not found' }; }

    const element = elementFromEntry(entry);
    const diffs   = computeDiffs(entry, element);

    return { entry, element, diffs };
  });

  // ── Push ──────────────────────────────────────────────────────────────────────
  app.post<{
    Params: { id: string };
    Body: { to?: string[]; dryRun?: boolean };
  }>('/api/registry/:id/push', async (req, reply) => {
    const registry = loadRegistry();
    const entry = findEntry(registry.entries, req.params.id);
    if (!entry) { reply.code(404); return { error: 'Not found' }; }

    // Only allow known app IDs; silently drop the rest rather than propagating
    // untrusted strings into adapter resolution.
    const requestedIds = (req.body?.to ?? []) as string[];
    const appIds: AppId[] = requestedIds.length
      ? requestedIds.filter((id): id is AppId => VALID_APP_IDS.has(id as AppId))
      : entry.targets.map((t) => t.appId);

    const element  = elementFromEntry(entry);
    const now      = new Date().toISOString();
    const dryRun   = req.body?.dryRun === true;
    const existing = appIds.filter((id) => entry.targets.some((t) => t.appId === id));
    const newIds   = appIds.filter((id) => !entry.targets.some((t) => t.appId === id));

    const diffs = [
      ...computeDiffs(entry, element, existing.length ? existing : undefined),
      ...computeDiffsForNewApps(entry, element, newIds, 'project'),
    ];

    if (dryRun) return { written: [], diffs };

    const { written, updated } = applyDiffs(diffs, entry, now);
    saveRegistry(
      updateEntry(registry, entry.id, {
        contentHash: hashContent(element.content),
        targets: updated,
        updatedAt: now,
      }),
    );
    return { written };
  });

  // ── Sync ──────────────────────────────────────────────────────────────────────
  app.post<{
    Params: { id: string };
    Body: { dryRun?: boolean };
  }>('/api/registry/:id/sync', async (req, reply) => {
    const registry = loadRegistry();
    const entry = findEntry(registry.entries, req.params.id);
    if (!entry) { reply.code(404); return { error: 'Not found' }; }

    const element = elementFromEntry(entry);
    const now     = new Date().toISOString();
    const dryRun  = req.body?.dryRun === true;
    const diffs   = computeDiffs(entry, element);

    if (dryRun) return { written: [], diffs };

    const { written, updated } = applyDiffs(diffs, entry, now);
    saveRegistry(
      updateEntry(registry, entry.id, {
        contentHash: hashContent(element.content),
        targets: updated,
        updatedAt: now,
      }),
    );
    return { written };
  });

  // ── Remove ────────────────────────────────────────────────────────────────────
  app.delete<{
    Params: { id: string };
    Body: { from?: string[] };
  }>('/api/registry/:id', async (req, reply) => {
    const registry = loadRegistry();
    const entry = findEntry(registry.entries, req.params.id);
    if (!entry) { reply.code(404); return { error: 'Not found' }; }

    const rawFrom = req.body?.from as string[] | undefined;
    const removeFrom = rawFrom
      ? rawFrom.filter((id): id is AppId => VALID_APP_IDS.has(id as AppId))
      : undefined;

    const removed = removeTargetFiles(
      removeFrom
        ? { ...entry, targets: entry.targets.filter((t) => removeFrom.includes(t.appId)) }
        : entry,
    );

    const deleteEntry = !removeFrom || removeFrom.length >= entry.targets.length;
    if (deleteEntry) {
      saveRegistry(removeEntry(registry, entry.id));
    } else {
      saveRegistry(
        updateEntry(registry, entry.id, {
          targets: entry.targets.filter((t) => !removeFrom!.includes(t.appId)),
        }),
      );
    }
    return { removed, deletedEntry: deleteEntry };
  });

  // ── Create ────────────────────────────────────────────────────────────────────
  app.post<{
    Body: {
      type: ElementType;
      name: string;
      description: string;
      content: string;
      appIds: AppId[];
      scope: Scope;
    };
  }>('/api/registry', async (req, reply) => {
    const { type, name, description, content, appIds, scope } = req.body;

    // Validate element type
    if (!type || !VALID_TYPES.has(type)) {
      reply.code(400);
      return { error: `Invalid type. Must be one of: ${[...VALID_TYPES].join(', ')}` };
    }

    // Validate and sanitize name — reject path traversal attempts
    const safeName = sanitizeName(name);
    if (!safeName) {
      reply.code(400);
      return { error: 'Invalid name. Use alphanumerics, hyphens, underscores only (max 64 chars).' };
    }

    // Validate scope
    if (scope && !VALID_SCOPES.has(scope)) {
      reply.code(400);
      return { error: `Invalid scope. Must be one of: ${[...VALID_SCOPES].join(', ')}` };
    }

    // Validate appIds — filter to known adapters only
    if (!appIds?.length) {
      reply.code(400);
      return { error: 'type, name and appIds are required' };
    }
    const safeAppIds = appIds.filter((id): id is AppId => VALID_APP_IDS.has(id as AppId));
    if (safeAppIds.length === 0) {
      reply.code(400);
      return { error: `No valid appIds provided. Known apps: ${[...VALID_APP_IDS].join(', ')}` };
    }

    // Scan content for suspicious patterns
    const scan = scanContent(content ?? '');
    if (scan.suspicious) {
      reply.code(422);
      return { error: 'Suspicious content detected', warnings: scan.warnings };
    }

    const now = new Date().toISOString();
    const id  = randomUUID().slice(0, 8);
    const element = {
      id, type, name: safeName,
      description: description ?? '',
      content: content ?? '',
      createdAt: now, updatedAt: now,
    };

    const libDir      = kenessLibraryDir(type, safeName);
    const contentPath = join(libDir, 'content.md');
    mkdirSync(libDir, { recursive: true });
    writeFileSync(contentPath, content ?? '', 'utf8');

    const targets = [];
    for (const appId of safeAppIds) {
      const adapter = getAdapter(appId);
      if (!adapter) continue;
      const adapted = adapter.format(element);
      mkdirSync(join(adapted.path, '..'), { recursive: true });
      writeFileSync(adapted.path, adapted.content, { mode: adapted.permissions });
      targets.push({
        appId,
        scope,
        filePath: adapted.path,
        contentHash: hashContent(adapted.content),
        writtenHash: hashContent(adapted.content),
        pushedAt: now,
      });
    }

    const registry = loadRegistry();
    const entry = {
      id, type, name: safeName, description: description ?? '', contentPath,
      contentHash: hashContent(content ?? ''),
      targets, tags: [], createdAt: now, updatedAt: now,
    };
    saveRegistry(addEntry(registry, entry));
    return { entry };
  });
}
