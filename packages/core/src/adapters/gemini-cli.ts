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

function globalDir(_platform: Platform): string {
  return resolveHome('.gemini');
}

function projectDir(): string {
  return join(findProjectRoot() ?? process.cwd(), '.gemini');
}

export const geminiCliAdapter: AppAdapter = {
  id: 'gemini-cli',
  name: 'Gemini CLI',
  binaryName: 'gemini',
  supports: ['skill', 'rule'],

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
      throw new Error(`Gemini CLI: unsupported type "${type}"`);
    const base = this.configDir(scope, platform);
    // Rules fall back into the main GEMINI.md instructions file
    if (type === 'rule') return join(base, 'GEMINI.md');
    return join(base, `${name}.md`);
  },

  format(el: KenessElement, scope: Scope = 'project'): AdaptedFile {
    const path = this.resolvePath(el.type, el.name, scope);
    const content = `# ${el.name}\n\n${el.description ? `${el.description}\n\n` : ''}${el.content}`;
    return { content, path, permissions: 0o644 };
  },
};
