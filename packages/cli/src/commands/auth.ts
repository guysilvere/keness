import { intro, log, outro, password, text } from '@clack/prompts';
import chalk from 'chalk';
import {
  getKeyStatus,
  removeApiKey,
  setApiKey,
  type Provider,
} from '@keness/core';
import { BRAND, MUTED } from './_ui.js';

const PROVIDERS: Provider[] = ['anthropic', 'openai', 'google', 'custom'];

function assertProvider(p: string): Provider {
  if (!PROVIDERS.includes(p as Provider)) {
    throw new Error(`Unknown provider "${p}". Valid: ${PROVIDERS.join(', ')}`);
  }
  return p as Provider;
}

export async function runAuth(
  action: string | undefined,
  provider: string | undefined,
): Promise<void> {
  intro(chalk.hex(BRAND).bold(' keness auth '));

  if (!action || action === 'status') {
    const status = getKeyStatus();
    const rows = PROVIDERS.map((p) => {
      const { set, source } = status[p];
      const tick = set ? chalk.hex(BRAND)('✔') : chalk.hex(MUTED)('–');
      const src  = source ? chalk.hex(MUTED)(` (${source})`) : '';
      return `  ${tick}  ${p.padEnd(12)}${src}`;
    });
    log.message(rows.join('\n'), { symbol: ' ' });
    outro(chalk.hex(MUTED)('keness auth set <provider>  to configure a key'));
    return;
  }

  if (action === 'set') {
    const prov = provider ? assertProvider(provider) : await askProvider();
    const key = await password({
      message: `Paste your ${prov} API key (input hidden):`,
      validate: (v) => (!v.trim() ? 'Key cannot be empty.' : undefined),
    });
    if (typeof key !== 'string') { log.warn('Aborted.'); return; }

    if (prov === 'custom') {
      const url = await text({
        message: 'Base URL for the OpenAI-compatible endpoint:',
        placeholder: 'https://api.example.com/v1',
        validate: (v) => (!v.trim() ? 'URL cannot be empty.' : undefined),
      });
      if (typeof url !== 'string') { log.warn('Aborted.'); return; }
      // store base URL prefixed so we can retrieve it separately
      setApiKey('custom', `${key.trim()}|${url.trim()}`);
    } else {
      setApiKey(prov, key.trim());
    }

    log.success(`API key stored for ${chalk.bold(prov)} in ~/.keness/keychain.json`);
    outro(chalk.hex(BRAND)('Done.'));
    return;
  }

  if (action === 'remove') {
    const prov = provider ? assertProvider(provider) : await askProvider();
    removeApiKey(prov);
    log.success(`Removed stored key for ${chalk.bold(prov)}`);
    outro(chalk.hex(MUTED)('Env vars (if set) still take precedence over stored keys.'));
    return;
  }

  log.error(`Unknown action "${action}". Use: set | status | remove`);
}

async function askProvider(): Promise<Provider> {
  const { select } = await import('@clack/prompts');
  const val = await select({
    message: 'Choose a provider:',
    options: [
      { value: 'anthropic', label: 'Anthropic (Claude)' },
      { value: 'openai',    label: 'OpenAI (GPT)' },
      { value: 'google',    label: 'Google (Gemini via OpenAI-compatible API)' },
      { value: 'custom',    label: 'Custom OpenAI-compatible endpoint' },
    ],
  });
  return val as Provider;
}
