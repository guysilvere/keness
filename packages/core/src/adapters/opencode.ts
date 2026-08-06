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
import { resolveHome, resolveAppData, findProjectRoot } from '../paths.js';
import { detectAdapter } from '../detect/index.js';

function globalDir(platform: Platform): string {
  if (platform === 'win32') return resolveAppData('opencode');
  return resolveHome('.config', 'opencode');
}

function projectDir(): string {
  return join(findProjectRoot() ?? process.cwd(), '.opencode');
}

export const opencodeAdapter: AppAdapter = {
  id: 'opencode',
  name: 'Opencode',
  binaryName: 'opencode',
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
      throw new Error(`Opencode: unsupported type "${type}"`);
    const base = this.configDir(scope, platform);
    if (type === 'rule') return join(base, 'AGENTS.md');
    return join(base, `${name}.md`);
  },

  format(el: KenessElement): AdaptedFile {
    const path = this.resolvePath(el.type, el.name, 'project');
    const content = `# ${el.name}\n\n${el.description ? `${el.description}\n\n` : ''}${el.content}`;
    return { content, path, permissions: 0o644 };
  },
};
