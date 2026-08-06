import { intro, outro, spinner, log } from '@clack/prompts';
import chalk from 'chalk';
import { allAdapters, detectAll } from '@keness/core';

const EMERALD = '#48bf84';
const MUTED   = '#afaab9';

export async function runDetect(): Promise<void> {
  intro(chalk.hex(EMERALD).bold(' keness detect '));

  const s = spinner();
  s.start('Scanning for installed AI tools…');

  const results = await detectAll(allAdapters);

  s.stop('Scan complete');

  let found = 0;
  for (const r of results) {
    const adapter = allAdapters.find((a) => a.id === r.appId)!;
    const label = adapter.name.padEnd(14);

    if (r.detected) {
      found++;
      const detail = r.configDir ?? r.binaryPath ?? '';
      log.success(
        `${chalk.bold(label)} ${chalk.green('detected')}   ${chalk.hex(MUTED)(detail)}`,
      );
    } else {
      log.info(
        `${chalk.hex(MUTED)(label)} ${chalk.dim('not found')}`,
      );
    }
  }

  const summary =
    found === 0
      ? chalk.dim('No AI tools detected on this machine.')
      : `Found ${chalk.hex(EMERALD).bold(String(found))} of ${results.length} tools.`;

  outro(summary);
}
