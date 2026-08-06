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

const SUBPATHS: Record<ElementType, (name: string) => string> = {
  skill: (n) => join('skills', n, 'SKILL.md'),
  agent: (n) => join('agents', n, 'agent.md'),
  rule:  (n) => join('rules', `${n}.md`),
  mcp:   (_n) => 'mcp.json',
};

function globalDir(_platform: Platform): string {
  // Claude Code uses ~/.claude on all platforms (including Windows via WSL)
  return resolveHome('.claude');
}

function projectDir(): string {
  return join(findProjectRoot() ?? process.cwd(), '.claude');
}

/**
 * Build a YAML frontmatter block.
 * Claude Code skills expect at minimum a `description` field.
 */
function buildFrontmatter(el: KenessElement): string {
  const data: Record<string, unknown> = {
    description: el.description,
    ...(el.tags?.length ? { tags: el.tags } : {}),
    ...(el.frontmatter ?? {}),
  };
  const lines = ['---'];
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'string') {
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: ${JSON.stringify(v)}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

export const claudeCodeAdapter: AppAdapter = {
  id: 'claude-code',
  name: 'Claude Code',
  binaryName: 'claude',
  supports: ['skill', 'agent', 'rule', 'mcp'],

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
    if (!sub) throw new Error(`Claude Code: unsupported type "${type}"`);
    return join(base, sub);
  },

  format(el: KenessElement, scope: Scope = 'project'): AdaptedFile {
    const path = this.resolvePath(el.type, el.name, scope);
    let content: string;

    if (el.type === 'mcp') {
      // MCP: JSON config stub — user fills in the server entries
      content = JSON.stringify(
        { mcpServers: { [el.name]: { command: '', args: [], env: {} } } },
        null,
        2,
      ) + '\n';
    } else {
      content = `${buildFrontmatter(el)}# ${el.name}\n\n${el.content}\n`;
    }

    return { content, path, permissions: 0o644 };
  },
};
