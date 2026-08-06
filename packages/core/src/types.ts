export type ElementType = 'skill' | 'agent' | 'rule' | 'mcp';
export type AppId =
  | 'claude-code'
  | 'cursor'
  | 'codex'
  | 'antigravity'
  | 'gemini-cli'
  | 'opencode';
export type Scope = 'project' | 'global';
export type Platform = 'linux' | 'darwin' | 'win32';

export interface KenessElement {
  id: string;
  type: ElementType;
  name: string;
  description: string;
  content: string;
  frontmatter?: Record<string, unknown>;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DetectionResult {
  appId: AppId;
  detected: boolean;
  via: 'binary' | 'config-dir' | 'both' | null;
  binaryPath?: string;
  configDir?: string;
}

export interface AdaptedFile {
  content: string;
  path: string;
  permissions: number;
}

export interface AppAdapter {
  readonly id: AppId;
  readonly name: string;
  readonly binaryName: string;
  readonly supports: ReadonlyArray<ElementType>;
  detect(): Promise<DetectionResult>;
  configDir(scope: Scope, platform?: Platform): string;
  resolvePath(type: ElementType, name: string, scope: Scope, platform?: Platform): string;
  format(element: KenessElement, scope?: Scope): AdaptedFile;
}

export interface TargetState {
  appId: AppId;
  scope: Scope;
  filePath: string;
  contentHash: string;
  /** Hash of the adapted content actually written to disk (for divergence detection). */
  writtenHash?: string;
  pushedAt: string;
}

export interface RegistryEntry {
  id: string;
  type: ElementType;
  name: string;
  description: string;
  contentPath: string;
  contentHash: string;
  targets: TargetState[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Registry {
  version: '1';
  entries: RegistryEntry[];
}
