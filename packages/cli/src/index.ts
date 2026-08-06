import { Command } from 'commander';
import { runDetect }  from './commands/detect.js';
import { runCreate }  from './commands/create.js';
import { runList }    from './commands/list.js';
import { runPush }    from './commands/push.js';
import { runDiff }    from './commands/diff.js';
import { runSync }    from './commands/sync.js';
import { runRm }      from './commands/rm.js';
import { runExport }  from './commands/export.js';
import { runGenerate } from './commands/generate.js';
import { runAuth }     from './commands/auth.js';
import { runUi }    from './commands/ui.js';
import { runConfig } from './commands/stubs.js';

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
  .command('list')
  .description('List all registered elements')
  .action(runList);

program
  .command('create [type]')
  .description('Create a skill, agent, rule or mcp config')
  .option('--for <apps>', 'Comma-separated list of target apps')
  .action(runCreate);

program
  .command('push <id>')
  .description('Write/adapt an element to one or more tools')
  .option('--to <apps>', 'Comma-separated list of target apps')
  .option('-y, --yes', 'Skip preview confirmation')
  .option('--dry-run', 'Preview changes without writing any files')
  .option('--ai-adapt', 'Use AI to rewrite content optimized for each target tool')
  .option('--provider <name>', 'AI provider for --ai-adapt: anthropic | openai | google | custom')
  .action(runPush);

program
  .command('diff <id>')
  .description('Preview pending changes before pushing')
  .option('--for <apps>', 'Comma-separated list of target apps')
  .action(runDiff);

program
  .command('sync <id>')
  .description('Re-push library content after a manual edit')
  .option('-y, --yes', 'Skip preview confirmation')
  .option('--dry-run', 'Preview changes without writing any files')
  .option('--ai-adapt', 'Use AI to rewrite content optimized for each target tool')
  .option('--provider <name>', 'AI provider for --ai-adapt: anthropic | openai | google | custom')
  .action(runSync);

program
  .command('rm <id>')
  .description('Delete an element from selected tools and/or the registry')
  .option('--from <apps>', 'Target apps to remove from (comma-separated, or "all")')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('--dry-run', 'Preview what would be deleted without removing anything')
  .action(runRm);

program
  .command('export <id>')
  .description('Archive element as JSON or portable shell script')
  .option('--out <file>', 'Write to file instead of stdout')
  .option('--format <fmt>', 'Output format: json (default) or sh')
  .action(runExport);

program
  .command('generate <type> <description>')
  .description('Generate element content from a natural language description (BYOK)')
  .option('--for <apps>', 'Comma-separated list of target apps')
  .option('--provider <name>', 'AI provider: anthropic | openai | google | custom')
  .option('--dry-run', 'Compose prompt and display it without calling the API')
  .action(runGenerate);

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
