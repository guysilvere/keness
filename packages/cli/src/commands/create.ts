import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  multiselect,
  note,
  outro,
  select,
  text,
} from '@clack/prompts';
import chalk from 'chalk';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FileExistsError,
  addEntry,
  allAdapters,
  getAdapter,
  hashContent,
  kenessLibraryDir,
  loadRegistry,
  saveRegistry,
  scanContent,
  writeAdaptedFile,
  type AppId,
  type ElementType,
  type KenessElement,
  type Scope,
  type TargetState,
} from '@keness/core';
import { renderScanWarnings } from './_ui.js';

const BRAND = '#48bf84';
const MUTED  = '#afaab9';
const ELEMENT_TYPES = ['skill', 'agent', 'rule', 'mcp'] as const;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
}

function relPath(abs: string): string {
  const cwd = process.cwd();
  return abs.startsWith(cwd) ? '.' + abs.slice(cwd.length) : abs;
}

export async function runCreate(
  typeArg?: string,
  opts?: { for?: string },
): Promise<void> {
  intro(chalk.hex(BRAND).bold(' keness create '));

  // ── 1. Type ──────────────────────────────────────────────────────────────
  let type: ElementType;

  if (typeArg && (ELEMENT_TYPES as readonly string[]).includes(typeArg)) {
    type = typeArg as ElementType;
  } else {
    const picked = await select({
      message: 'Element type',
      options: [
        { value: 'skill', label: 'skill', hint: 'packaged instruction set for a specific task' },
        { value: 'agent', label: 'agent', hint: 'autonomous sub-agent with a defined role' },
        { value: 'rule',  label: 'rule',  hint: 'persistent coding rule or project constraint' },
        { value: 'mcp',   label: 'mcp',   hint: 'MCP server configuration block' },
      ] as const,
    });
    if (isCancel(picked)) { cancel('Cancelled.'); return; }
    type = picked as ElementType;
  }

  // ── 2. Name ───────────────────────────────────────────────────────────────
  const nameRaw = await text({
    message: 'Name',
    placeholder: `my-${type}`,
    validate: (v) => (!v?.trim() ? 'Name is required' : undefined),
  });
  if (isCancel(nameRaw)) { cancel('Cancelled.'); return; }
  const name = slugify(nameRaw.trim());

  // ── 3. Description ────────────────────────────────────────────────────────
  const desc = await text({
    message: 'Description (one line)',
    placeholder: `What does this ${type} do?`,
    validate: (v) => (!v?.trim() ? 'Description is required' : undefined),
  });
  if (isCancel(desc)) { cancel('Cancelled.'); return; }

  // ── 4. Target apps ────────────────────────────────────────────────────────
  const compatible = allAdapters.filter((a) => a.supports.includes(type));
  let selectedApps: AppId[];

  if (opts?.for) {
    selectedApps = opts.for.split(',').map((s) => s.trim()) as AppId[];
  } else {
    const picked = await multiselect({
      message: 'Register in which apps?',
      options: compatible.map((a) => ({
        value: a.id as AppId,
        label: a.name,
        hint: chalk.hex(MUTED)(relPath(a.configDir('project'))),
      })),
      required: true,
    });
    if (isCancel(picked)) { cancel('Cancelled.'); return; }
    selectedApps = picked as AppId[];
  }

  // ── 5. Scope ──────────────────────────────────────────────────────────────
  const scopePicked = await select({
    message: 'Scope',
    options: [
      { value: 'project' as Scope, label: 'project', hint: 'current repository only' },
      { value: 'global'  as Scope, label: 'global',  hint: 'applies to all repos on this machine' },
    ],
    initialValue: 'project' as Scope,
  });
  if (isCancel(scopePicked)) { cancel('Cancelled.'); return; }
  const scope = scopePicked as Scope;

  // ── 6. Content ────────────────────────────────────────────────────────────
  const contentRaw = await text({
    message: 'Instructions / content',
    placeholder: 'Step-by-step instructions (you can edit the file for richer content)',
    defaultValue: '',
  });
  if (isCancel(contentRaw)) { cancel('Cancelled.'); return; }

  // ── 6b. Security scan ─────────────────────────────────────────────────────
  const scan = scanContent((contentRaw ?? '').trim());
  if (scan.suspicious) {
    log.warn('Suspicious patterns detected in content:');
    renderScanWarnings(scan.warnings);
    const proceed = await confirm({ message: 'Continue anyway?' });
    if (isCancel(proceed) || !proceed) { cancel('Aborted — nothing written.'); return; }
  }

  const now = new Date().toISOString();
  const id  = randomUUID().slice(0, 8);

  const element: KenessElement = {
    id,
    type,
    name,
    description: desc.trim(),
    content: (contentRaw ?? '').trim(),
    createdAt: now,
    updatedAt: now,
  };

  // ── 7. Preview ────────────────────────────────────────────────────────────
  for (const appId of selectedApps) {
    const adapter = getAdapter(appId);
    if (!adapter) continue;
    const adapted = adapter.format(element);
    note(adapted.content, `Preview — ${adapter.name}  (${relPath(adapted.path)})`);
  }

  // ── 8. Confirm ────────────────────────────────────────────────────────────
  const go = await confirm({ message: 'Write these files?' });
  if (isCancel(go) || !go) { cancel('Aborted — nothing written.'); return; }

  // ── 9. Write files ────────────────────────────────────────────────────────
  const writtenTargets: TargetState[] = [];

  for (const appId of selectedApps) {
    const adapter = getAdapter(appId);
    if (!adapter) { log.warn(`Unknown app id: ${appId}`); continue; }

    const adapted = adapter.format(element);
    try {
      writeAdaptedFile(adapted);
      log.success(relPath(adapted.path));
      writtenTargets.push({
        appId,
        scope,
        filePath: adapted.path,
        contentHash: hashContent(adapted.content),
        writtenHash: hashContent(adapted.content),
        pushedAt: now,
      });
    } catch (err) {
      if (err instanceof FileExistsError) {
        log.warn(`Skipped (already exists): ${relPath(err.path)}`);
      } else {
        log.error(`Failed: ${relPath(adapted.path)} — ${String(err)}`);
      }
    }
  }

  // ── 10. Register in ~/.keness/registry.json ───────────────────────────────
  if (writtenTargets.length > 0) {
    const libDir    = kenessLibraryDir(type, name);
    const contentPath = join(libDir, 'content.md');
    mkdirSync(libDir, { recursive: true });
    writeFileSync(contentPath, element.content, 'utf8');

    const registry = loadRegistry();
    saveRegistry(
      addEntry(registry, {
        id,
        type,
        name,
        description: element.description,
        contentPath,
        contentHash: hashContent(element.content),
        targets: writtenTargets,
        tags: [],
        createdAt: now,
        updatedAt: now,
      }),
    );

    log.info(
      `Registered: ${chalk.bold(name)} ${chalk.hex(MUTED)(`(id: ${id})`)}`,
    );
  }

  outro(chalk.hex(BRAND)('Done.'));
}
