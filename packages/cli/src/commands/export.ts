import { intro, log, outro } from '@clack/prompts';
import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  getAdapter,
  loadRegistry,
  type RegistryEntry,
} from '@keness/core';
import { BRAND, MUTED } from './_ui.js';

interface ExportOpts {
  out?: string;
  format?: 'json' | 'sh';
}

function toJson(entry: RegistryEntry, content: string): string {
  return JSON.stringify(
    {
      keness: '1',
      id: entry.id,
      type: entry.type,
      name: entry.name,
      description: entry.description,
      content,
      tags: entry.tags,
      targets: entry.targets.map((t) => t.appId),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    },
    null,
    2,
  );
}

function toShell(entry: RegistryEntry, content: string): string {
  const lines: string[] = [
    '#!/usr/bin/env sh',
    '# Exported by keness',
    `# Element: ${entry.name} (${entry.type})`,
    '',
  ];

  for (const t of entry.targets) {
    const adapter = getAdapter(t.appId);
    if (!adapter) continue;
    const adapted = adapter.format({
      id: entry.id,
      type: entry.type,
      name: entry.name,
      description: entry.description,
      content,
      tags: entry.tags,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
    const escaped = adapted.content.replace(/'/g, "'\\''");
    lines.push(`# ${adapter.name}`);
    lines.push(`mkdir -p "$(dirname '${adapted.path}')" && cat > '${adapted.path}' << 'KENESS_EOF'`);
    lines.push(adapted.content);
    lines.push('KENESS_EOF');
    lines.push('');
  }
  return lines.join('\n');
}

export async function runExport(id: string, opts: ExportOpts): Promise<void> {
  intro(chalk.hex(BRAND).bold(' keness export '));

  const registry = loadRegistry();
  const entry =
    registry.entries.find((e) => e.id === id || e.id.startsWith(id)) ??
    registry.entries.find((e) => e.name === id);

  if (!entry) {
    log.error(`No element found for "${id}". Run keness list to see registered elements.`);
    return;
  }

  const content = existsSync(entry.contentPath)
    ? readFileSync(entry.contentPath, 'utf8')
    : '';

  const fmt = opts.format ?? 'json';
  const output = fmt === 'sh' ? toShell(entry, content) : toJson(entry, content);

  if (opts.out) {
    writeFileSync(opts.out, output, 'utf8');
    log.success(`Written to ${opts.out}`);
  } else {
    process.stdout.write(output + '\n');
  }

  outro(chalk.hex(MUTED)(fmt === 'sh' ? 'Shell script ready.' : 'JSON archive ready.'));
}
