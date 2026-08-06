import { join } from 'node:path';
import type {
  AppAdapter,
  AdaptedFile,
  DetectionResult,
  ElementType,
  KenessElement,
  Platform,
  Scope,
} from '../types.js';
import { resolveHome, findProjectRoot } from '../paths.js';
import { detectBinaryOnly } from '../detect/index.js';

/**
 * Codex (OpenAI) uses a flat AGENTS.md file model.
 * Both skills and agents are written as sections into AGENTS.md;
 * there is no per-element file — Keness manages named sections within it.
 * MCP is not supported by Codex.
 */
function agentsFilePath(scope: Scope): string {
  if (scope === 'global') return resolveHome('AGENTS.md');
  return join(findProjectRoot() ?? process.cwd(), 'AGENTS.md');
}

export const codexAdapter: AppAdapter = {
  id: 'codex',
  name: 'Codex',
  binaryName: 'codex',
  supports: ['skill', 'agent', 'rule'],

  async detect(): Promise<DetectionResult> {
    // Codex has no dedicated config dir — home dir always exists, so binary-only.
    return detectBinaryOnly(this.id, this.binaryName);
  },

  configDir(scope: Scope, _platform?: Platform): string {
    // Codex has no dedicated config dir — it reads AGENTS.md from home/project
    return scope === 'global'
      ? resolveHome('')
      : (findProjectRoot() ?? process.cwd());
  },

  resolvePath(
    _type: ElementType,
    _name: string,
    scope: Scope,
    _platform?: Platform,
  ): string {
    return agentsFilePath(scope);
  },

  format(el: KenessElement): AdaptedFile {
    const path = agentsFilePath('project');
    // Codex: elements are written as H2 sections in AGENTS.md
    const content = `## ${el.name}\n\n${el.description ? `> ${el.description}\n\n` : ''}${el.content}`;
    return { content, path, permissions: 0o644 };
  },
};
