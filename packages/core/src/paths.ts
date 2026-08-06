import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';

export function homeDir(): string {
  return homedir();
}

export function kenessDir(): string {
  return process.env['KENESS_DIR'] ?? join(homedir(), '.keness');
}

export function kenessLibraryDir(type: string, name: string): string {
  return join(kenessDir(), 'library', type, name);
}

export function kenessRegistryPath(): string {
  return join(kenessDir(), 'registry.json');
}

export function resolveHome(...parts: string[]): string {
  const home = process.env['KENESS_HOME'] ?? homedir();
  return join(home, ...parts);
}

export function resolveAppData(...parts: string[]): string {
  const appData =
    process.env['APPDATA'] ?? join(homedir(), 'AppData', 'Roaming');
  return join(appData, ...parts);
}

/**
 * Walks up from `from` until a directory containing `.git` is found.
 * Returns null when called outside a git repository.
 */
export function findProjectRoot(from: string = process.cwd()): string | null {
  let current = resolve(from);
  while (true) {
    if (existsSync(join(current, '.git'))) return current;
    const parent = resolve(current, '..');
    if (parent === current) return null;
    current = parent;
  }
}
