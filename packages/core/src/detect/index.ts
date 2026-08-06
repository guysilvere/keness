import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import type { AppAdapter, DetectionResult, Platform } from '../types.js';

function findBinary(name: string): string | null {
  try {
    const cmd =
      process.platform === 'win32' ? `where "${name}"` : `which "${name}"`;
    const out = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.trim().split('\n')[0]?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function detectAdapter(adapter: AppAdapter): Promise<DetectionResult> {
  const platform = process.platform as Platform;
  const binaryPath = findBinary(adapter.binaryName);
  const configDirPath = adapter.configDir('global', platform);
  const configDirExists = existsSync(configDirPath);

  const detected = binaryPath !== null || configDirExists;
  const via =
    binaryPath !== null && configDirExists
      ? 'both'
      : binaryPath !== null
        ? 'binary'
        : configDirExists
          ? 'config-dir'
          : null;

  return {
    appId: adapter.id,
    detected,
    via,
    ...(binaryPath !== null && { binaryPath }),
    ...(configDirExists && { configDir: configDirPath }),
  };
}

export async function detectAll(
  adapters: ReadonlyArray<AppAdapter>,
): Promise<DetectionResult[]> {
  return Promise.all(adapters.map((a) => detectAdapter(a)));
}
