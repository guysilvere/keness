import {
  writeFileSync,
  mkdirSync,
  chmodSync,
  existsSync,
  readFileSync,
} from 'node:fs';
import { dirname } from 'node:path';
import type { AdaptedFile } from './types.js';

export class FileExistsError extends Error {
  constructor(public readonly path: string) {
    super(`File already exists: ${path}`);
  }
}

export interface WriteOptions {
  overwrite?: boolean;
}

/** Write an adapted file to disk, creating parent dirs and setting permissions. */
export function writeAdaptedFile(
  file: AdaptedFile,
  opts: WriteOptions = {},
): void {
  if (existsSync(file.path) && !opts.overwrite) {
    throw new FileExistsError(file.path);
  }
  mkdirSync(dirname(file.path), { recursive: true });
  writeFileSync(file.path, file.content, 'utf8');
  if (process.platform !== 'win32') {
    chmodSync(file.path, file.permissions);
  }
}

/** Read a file from disk, returning null if it does not exist. */
export function readFile(path: string): string | null {
  if (!existsSync(path)) return null;
  return readFileSync(path, 'utf8');
}
