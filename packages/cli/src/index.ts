import { Command } from 'commander';
import { runDetect } from './commands/detect.js';
import { runCreate } from './commands/create.js';
import {
  runPush,
  runDiff,
  runSync,
  runRm,
  runExport,
  runGenerate,
  runAuth,
  runUi,
  runConfig,
} from './commands/stubs.js';

const program = new Command();

program
  .name('keness')
  .description(
    'Create, store and sync your AI coding skills, agents, rules and MCP configs — once, everywhere.',
  )
  .version('0.0.1');

program
  .command('detect')
  .description('Scan installed AI coding tools on this machine')
  .action(runDetect);

program
  .command('create [type]')
  .description('Create a skill, agent, rule or mcp config')
  .option('--for <apps>', 'Comma-separated list of target apps')
  .action(runCreate);

program
  .command('generate <type> <description>')
  .description('Generate element content from a natural language description (BYOK)')
  .option('--for <apps>', 'Comma-separated list of target apps')
  .option('--dry-run', 'Compose prompt and display it without calling the API')
  .action(runGenerate);

program
  .command('push <id>')
  .description('Write/adapt an element to one or more tools')
  .option('--to <apps>', 'Comma-separated list of target apps')
  .option('--ai-adapt', 'Use AI to adapt content when mechanical conversion loses fidelity')
  .option('--yes', 'Skip preview confirmation')
  .action(runPush);

program
  .command('diff <id>')
  .description('Preview the adapted file before writing')
  .option('--for <apps>', 'Comma-separated list of target apps')
  .action(runDiff);

program
  .command('sync <id>')
  .description('Replicate a manual edit to all linked tools')
  .option('--ai-adapt', 'Use AI when converting between incompatible formats')
  .option('--yes', 'Skip preview confirmation')
  .action(runSync);

program
  .command('rm <id>')
  .description('Delete an element from selected tools')
  .option('--from <apps|all>', 'Target apps, or "all"')
  .action(runRm);

program
  .command('export <id>')
  .description('Archive element or print equivalent shell commands')
  .action(runExport);

program
  .command('auth')
  .description('Manage BYOK provider API keys (stored in OS keychain)')
  .argument('[action]', 'set | status | remove')
  .argument('[provider]', 'anthropic | openai | google | custom')
  .action(runAuth);

program
  .command('ui')
  .description('Open the local web dashboard')
  .option('-p, --port <port>', 'Port to listen on (default: random available port)')
  .action(runUi);

program
  .command('config')
  .description('Get or set Keness configuration values')
  .argument('[key]')
  .argument('[value]')
  .action(runConfig);

program.parse();
