import { intro, outro } from '@clack/prompts';
import chalk from 'chalk';

function notImplemented(cmd: string): () => Promise<void> {
  return async () => {
    intro(chalk.hex('#48bf84').bold(` keness ${cmd} `));
    outro(chalk.dim(`${cmd} — coming in a future release.`));
  };
}

export const runGenerate = notImplemented('generate');
export const runAuth     = notImplemented('auth');
export const runUi       = notImplemented('ui');
export const runConfig   = notImplemented('config');
