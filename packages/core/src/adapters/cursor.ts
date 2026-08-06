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

/**
 * Cursor uses:
 *  - .mdc files for rules (.cursor/rules/<name>.mdc)
 *  - .md files for agents / skills (unofficial but conventional)
 *
 * The .mdc frontmatter schema that Cursor reads:
 *   description, globs (file patterns), alwaysApply (bool)
 */
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

function buildMdcFrontmatter(el: KenessElement): string {
  const globs: string = (el.frontmatter?.['globs'] as string) ?? '';
  const alwaysApply: boolean =
    (el.frontmatter?.['alwaysApply'] as boolean) ?? false;
  return [
    '---',
    `description: ${el.description}`,
    `globs: ${globs}`,
    `alwaysApply: ${String(alwaysApply)}`,
    '---',
    '',
  ].join('\n');
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

  format(el: KenessElement, scope: Scope = 'project'): AdaptedFile {
    const path = this.resolvePath(el.type, el.name, scope);
    const fm =
      el.type === 'rule'
        ? buildMdcFrontmatter(el)
        : `---\ndescription: ${el.description}\n---\n\n`;
    const content = `${fm}# ${el.name}\n\n${el.content}\n`;
    return { content, path, permissions: 0o644 };
  },
};
