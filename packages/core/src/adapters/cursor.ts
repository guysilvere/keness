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

// Cursor uses .mdc format for rules (Markdown with optional frontmatter)
const SUBPATHS: Partial<Record<ElementType, (name: string) => string>> = {
  rule:  (n) => join('rules', `${n}.mdc`),
  agent: (n) => join('agents', `${n}.md`),
  skill: (n) => join('skills', `${n}.md`),
};

function globalDir(platform: Platform): string {
  if (platform === 'win32') return resolveAppData('Cursor', 'User');
  return resolveHome('.cursor');
}

function projectDir(): string {
  return join(findProjectRoot() ?? process.cwd(), '.cursor');
}

export const cursorAdapter: AppAdapter = {
  id: 'cursor',
  name: 'Cursor',
  binaryName: 'cursor',
  supports: ['skill', 'agent', 'rule'],

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
    const base = this.configDir(scope, platform);
    const sub = SUBPATHS[type]?.(name);
    if (!sub) throw new Error(`Cursor: unsupported type "${type}"`);
    return join(base, sub);
  },

  format(el: KenessElement): AdaptedFile {
    const path = this.resolvePath(el.type, el.name, 'project');
    // Cursor rules use a YAML frontmatter block then plain markdown
    const fm = el.description
      ? `---\ndescription: ${el.description}\n---\n\n`
      : '';
    const content = `${fm}# ${el.name}\n\n${el.content}`;
    return { content, path, permissions: 0o644 };
  },
};
