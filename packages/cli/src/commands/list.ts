import { intro, outro } from '@clack/prompts';
import chalk from 'chalk';
import { loadRegistry } from '@keness/core';
import { BRAND, MUTED } from './_ui.js';

export async function runList(): Promise<void> {
  intro(chalk.hex(BRAND).bold(' keness list '));

  const registry = loadRegistry();

  if (registry.entries.length === 0) {
    outro(chalk.hex(MUTED)('No elements registered yet. Run keness create to add one.'));
    return;
  }

  const byType = new Map<string, typeof registry.entries>();
  for (const e of registry.entries) {
    const group = byType.get(e.type) ?? [];
    group.push(e);
    byType.set(e.type, group);
  }

  for (const [type, entries] of byType) {
    console.log(chalk.hex(BRAND).bold(`\n  ${type}s`));
    for (const e of entries) {
      const apps = e.targets.map((t) => t.appId).join(', ');
      console.log(
        `  ${chalk.bold(e.name)}  ${chalk.hex(MUTED)(`(${e.id})`)}`,
      );
      console.log(`    ${chalk.hex(MUTED)(e.description)}`);
      console.log(`    ${chalk.hex(MUTED)('→ ' + (apps || 'no targets'))}`);
    }
  }

  console.log('');
  outro(chalk.hex(MUTED)(`${registry.entries.length} element${registry.entries.length !== 1 ? 's' : ''} total`));
}
