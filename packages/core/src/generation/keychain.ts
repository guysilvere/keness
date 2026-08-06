import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Provider } from './types.js';
import { PROVIDER_ENV_VARS } from './types.js';

const keychainPath = join(homedir(), '.keness', 'keychain.json');

type KeychainData = Partial<Record<Provider, string>>;

function readKeychain(): KeychainData {
  if (!existsSync(keychainPath)) return {};
  try {
    return JSON.parse(readFileSync(keychainPath, 'utf8')) as KeychainData;
  } catch {
    return {};
  }
}

function writeKeychain(data: KeychainData): void {
  const dir = join(homedir(), '.keness');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(keychainPath, JSON.stringify(data, null, 2), { mode: 0o600 });
}

/** Returns the API key for the given provider, checking env var first. */
export function getApiKey(provider: Provider): string | null {
  const envVar = PROVIDER_ENV_VARS[provider];
  const fromEnv = process.env[envVar];
  if (fromEnv) return fromEnv;
  return readKeychain()[provider] ?? null;
}

/** Stores the API key for a provider in ~/.keness/keychain.json (mode 0600). */
export function setApiKey(provider: Provider, key: string): void {
  const data = readKeychain();
  data[provider] = key;
  writeKeychain(data);
}

/** Removes the stored API key for a provider. Does not affect env vars. */
export function removeApiKey(provider: Provider): void {
  const data = readKeychain();
  delete data[provider];
  writeKeychain(data);
}

/** Returns which providers have keys configured (stored or via env var). */
export function getKeyStatus(): Record<Provider, { set: boolean; source: 'env' | 'keychain' | null }> {
  const stored = readKeychain();
  const providers: Provider[] = ['anthropic', 'openai', 'google', 'custom'];
  const result = {} as ReturnType<typeof getKeyStatus>;
  for (const p of providers) {
    const envVar = PROVIDER_ENV_VARS[p];
    if (process.env[envVar]) {
      result[p] = { set: true, source: 'env' };
    } else if (stored[p]) {
      result[p] = { set: true, source: 'keychain' };
    } else {
      result[p] = { set: false, source: null };
    }
  }
  return result;
}
