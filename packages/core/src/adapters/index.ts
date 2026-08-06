import { claudeCodeAdapter } from './claude-code.js';
import { cursorAdapter } from './cursor.js';
import { codexAdapter } from './codex.js';
import { antigravityAdapter } from './antigravity.js';
import { geminiCliAdapter } from './gemini-cli.js';
import { opencodeAdapter } from './opencode.js';
import type { AppAdapter, AppId } from '../types.js';

export {
  claudeCodeAdapter,
  cursorAdapter,
  codexAdapter,
  antigravityAdapter,
  geminiCliAdapter,
  opencodeAdapter,
};

export const allAdapters: ReadonlyArray<AppAdapter> = [
  claudeCodeAdapter,
  cursorAdapter,
  codexAdapter,
  antigravityAdapter,
  geminiCliAdapter,
  opencodeAdapter,
];

export function getAdapter(id: AppId): AppAdapter | undefined {
  return allAdapters.find((a) => a.id === id);
}
