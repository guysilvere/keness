import { intro, outro, log } from '@clack/prompts';
import chalk from 'chalk';
import { startServer } from '@keness/web';

export async function runUi(opts: { port?: string } = {}) {
  intro(chalk.hex('#48bf84').bold(' keness ui '));

  const port = opts.port ? parseInt(opts.port, 10) : 4242;

  log.info('Starting dashboard…');

  try {
    const { url } = await startServer(port);

    log.success(`Dashboard running at ${chalk.hex('#48bf84').bold(url)}`);
    log.info('Press Ctrl+C to stop.');

    // Try to open the browser (best-effort, no crash if not available)
    const { execSync } = await import('child_process');
    const cmds: Record<string, string> = { darwin: 'open', linux: 'xdg-open', win32: 'start' };
    const open = cmds[process.platform];
    if (open) {
      try { execSync(`${open} ${url}`, { stdio: 'ignore' }); } catch { /* ignore */ }
    }

    // Keep the process alive until Ctrl+C
    await new Promise<void>((resolve) => {
      process.on('SIGINT', () => resolve());
      process.on('SIGTERM', () => resolve());
    });

    outro(chalk.dim('Dashboard stopped.'));
  } catch (err) {
    outro(chalk.red(`Failed to start: ${(err as Error).message}`));
    process.exit(1);
  }
}
