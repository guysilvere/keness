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
  spinner,
} from '@clack/prompts';
import chalk from 'chalk';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  addEntry,
  allAdapters,
  generate,
  getAdapter,
  hashContent,
  kenessLibraryDir,
  loadRegistry,
  saveRegistry,
  type AppId,
  type ElementType,
  type Provider,
  type Scope,
  type TargetState,
} from '@keness/core';
import { writeAdaptedFile, FileExistsError } from '@keness/core';
import { BRAND, MUTED, relPath } from './_ui.js';

const ELEMENT_TYPES = ['skill', 'agent', 'rule', 'mcp'] as const;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
}

interface GenerateOpts {
  for?: string;
  dryRun?: boolean;
  provider?: string;
}

export async function runGenerate(
  typeArg: string,
  description: string,
  opts: GenerateOpts,
): Promise<void> {
  intro(chalk.hex(BRAND).bold(' keness generate '));

  // Validate type
  if (!(ELEMENT_TYPES as readonly string[]).includes(typeArg)) {
    log.error(`Unknown element type "${typeArg}". Valid: ${ELEMENT_TYPES.join(', ')}`);
    return;
  }
  const type = typeArg as ElementType;

  if (!description?.trim()) {
    log.error('Description is required. Example: keness generate skill "refactor TypeScript to ESM"');
    return;
  }

  const provider = opts.provider as Provider | undefined;

  // ── Generate ────────────────────────────────────────────────────────────────
  let content: string;
  let modelUsed: string;

  if (opts.dryRun) {
    const result = await generate(type, description.trim(), { dryRun: true });
    note(result.promptUsed ?? '', 'Prompt (dry-run — no API call made)');
    outro(chalk.hex(MUTED)('Dry-run complete.'));
    return;
  }

  const s = spinner();
  s.start('Generating with AI…');
  try {
    const result = await generate(type, description.trim(), {
      ...(provider && { provider }),
    });
    s.stop(`Generated via ${result.provider} / ${result.model}`);
    content = result.content.trim();
    modelUsed = `${result.provider}/${result.model}`;
  } catch (err) {
    s.stop('Generation failed');
    log.error(String(err));
    return;
  }

  if (!content) {
    log.error('AI returned empty content. Check your API key and try again.');
    return;
  }

  // ── Preview generated content ───────────────────────────────────────────────
  note(content, `Generated ${type}  (via ${modelUsed})`);

  // ── Ask for a name ──────────────────────────────────────────────────────────
  const { text } = await import('@clack/prompts');
  const nameRaw = await text({
    message: 'Name for this element',
    placeholder: slugify(description.slice(0, 40)),
    validate: (v) => (!v?.trim() ? 'Name is required' : undefined),
  });
  if (isCancel(nameRaw)) { cancel('Aborted — nothing saved.'); return; }
  const name = slugify(nameRaw.trim());

  // ── Description ─────────────────────────────────────────────────────────────
  const descRaw = await text({
    message: 'One-line description',
    placeholder: description.slice(0, 80),
    defaultValue: description.slice(0, 80),
  });
  if (isCancel(descRaw)) { cancel('Aborted — nothing saved.'); return; }
  const desc = (descRaw ?? description.slice(0, 80)).trim();

  // ── Target apps ─────────────────────────────────────────────────────────────
  const compatible = allAdapters.filter((a) => a.supports.includes(type));
  let selectedApps: AppId[];

  if (opts.for) {
    selectedApps = opts.for.split(',').map((s) => s.trim()) as AppId[];
  } else {
    const picked = await multiselect({
      message: 'Push to which apps?',
      options: compatible.map((a) => ({
        value: a.id as AppId,
        label: a.name,
        hint: chalk.hex(MUTED)(relPath(a.configDir('project'))),
      })),
      required: false,
    });
    if (isCancel(picked)) { cancel('Aborted — nothing saved.'); return; }
    selectedApps = (picked ?? []) as AppId[];
  }

  // ── Scope ────────────────────────────────────────────────────────────────────
  const scopePicked = await select({
    message: 'Scope',
    options: [
      { value: 'project' as Scope, label: 'project', hint: 'current repository only' },
      { value: 'global'  as Scope, label: 'global',  hint: 'all repos on this machine' },
    ],
    initialValue: 'project' as Scope,
  });
  if (isCancel(scopePicked)) { cancel('Aborted — nothing saved.'); return; }
  const scope = scopePicked as Scope;

  // ── Preview adapted output ───────────────────────────────────────────────────
  const now = new Date().toISOString();
  const id  = randomUUID().slice(0, 8);
  const element = { id, type, name, description: desc, content, createdAt: now, updatedAt: now };

  if (selectedApps.length > 0) {
    for (const appId of selectedApps) {
      const adapter = getAdapter(appId);
      if (!adapter) continue;
      const adapted = adapter.format(element);
      note(adapted.content, `Preview — ${adapter.name}  (${relPath(adapted.path)})`);
    }
  }

  // ── Confirm ──────────────────────────────────────────────────────────────────
  const go = await confirm({ message: selectedApps.length > 0 ? 'Save and write files?' : 'Save to library only?' });
  if (isCancel(go) || !go) { cancel('Aborted — nothing saved.'); return; }

  // ── Save library content ──────────────────────────────────────────────────────
  const libDir     = kenessLibraryDir(type, name);
  const contentPath = join(libDir, 'content.md');
  mkdirSync(libDir, { recursive: true });
  writeFileSync(contentPath, content + '\n', 'utf8');

  // ── Write target files ───────────────────────────────────────────────────────
  const writtenTargets: TargetState[] = [];
  for (const appId of selectedApps) {
    const adapter = getAdapter(appId);
    if (!adapter) { log.warn(`Unknown app: ${appId}`); continue; }
    const adapted = adapter.format(element);
    try {
      writeAdaptedFile(adapted);
      log.success(relPath(adapted.path));
      writtenTargets.push({
        appId,
        scope,
        filePath: adapted.path,
        contentHash: hashContent(adapted.content),
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

  // ── Register ──────────────────────────────────────────────────────────────────
  const registry = loadRegistry();
  saveRegistry(
    addEntry(registry, {
      id,
      type,
      name,
      description: desc,
      contentPath,
      contentHash: hashContent(content),
      targets: writtenTargets,
      tags: [],
      createdAt: now,
      updatedAt: now,
    }),
  );

  log.info(`Registered: ${chalk.bold(name)} ${chalk.hex(MUTED)(`(id: ${id})`)}`);
  outro(chalk.hex(BRAND)('Done.'));
}
