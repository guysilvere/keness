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
import { detectAdapter } from '../detect/index.js';

/**
 * Antigravity uses ~/.agents/ (global) and .agents/ (project).
 * Agents are stored as individual <name>.md files.
 * The convention is a description in the third person in the frontmatter.
 */
function globalDir(_platform: Platform): string {
  return resolveHome('.agents');
}

function projectDir(): string {
  return join(findProjectRoot() ?? process.cwd(), '.agents');
}

export const antigravityAdapter: AppAdapter = {
  id: 'antigravity',
  name: 'Antigravity',
  binaryName: 'antigravity',
  supports: ['agent', 'rule'],

  async detect(): Promise<DetectionResult> {
    return detectAdapter(this);
  },

  configDir(scope: Scope, platform: Platform = process.platform as Platform): string {
    return scope === 'global' ? globalDir(platform) : projectDir();
  },

  resolvePath(
    type: ElementType,
    name: string,
    scope: Scope,
    platform?: Platform,
  ): string {
    if (!this.supports.includes(type))
      throw new Error(`Antigravity: unsupported type "${type}"`);
    return join(this.configDir(scope, platform), `${name}.md`);
  },

  format(el: KenessElement, scope: Scope = 'project'): AdaptedFile {
    const path = this.resolvePath(el.type, el.name, scope);
    // Antigravity expects description written in the third person
    const fm = `---\ndescription: ${el.description}\n---\n\n`;
    const content = `${fm}# ${el.name}\n\n${el.content}`;
    return { content, path, permissions: 0o644 };
  },
};
