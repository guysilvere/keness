// Typed wrappers around the Fastify REST API

export type ElementType = 'skill' | 'agent' | 'rule' | 'mcp';
export type AppId = 'claude-code' | 'cursor' | 'codex' | 'antigravity' | 'gemini-cli' | 'opencode';
export type Scope = 'project' | 'global';

export interface TargetState {
  appId: AppId;
  scope: Scope;
  filePath: string;
  contentHash: string;
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

export interface KenessElement {
  id: string;
  type: ElementType;
  name: string;
  description: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type DiffLine =
  | { type: 'context'; text: string }
  | { type: 'add';     text: string }
  | { type: 'remove';  text: string };

export interface TargetDiff {
  appId: AppId;
  filePath: string;
  adapted: string;
  current: string | null;
  isNew: boolean;
  isUpToDate: boolean;
  manuallyEdited: boolean;
  lines: DiffLine[];
}

export interface AdapterInfo {
  id: AppId;
  name: string;
  supports: ElementType[];
}

export interface DetectionResult {
  appId: AppId;
  detected: boolean;
  via: 'binary' | 'config-dir' | 'both' | null;
  binaryPath?: string;
  configDir?: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(body.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  registry: {
    list: () => apiFetch<{ entries: RegistryEntry[] }>('/api/registry'),
    get:  (id: string) =>
      apiFetch<{ entry: RegistryEntry; element: KenessElement; diffs: TargetDiff[] }>(
        `/api/registry/${id}`,
      ),
    create: (body: {
      type: ElementType;
      name: string;
      description: string;
      content: string;
      appIds: AppId[];
      scope: Scope;
    }) =>
      apiFetch<{ entry: RegistryEntry }>('/api/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    push: (id: string, to?: AppId[]) =>
      apiFetch<{ written: string[] }>(`/api/registry/${id}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      }),
    sync: (id: string) =>
      apiFetch<{ written: string[] }>(`/api/registry/${id}/sync`, { method: 'POST' }),
    remove: (id: string, from?: AppId[]) =>
      apiFetch<{ removed: string[]; deletedEntry: boolean }>(`/api/registry/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from }),
      }),
  },
  adapters: {
    list: () => apiFetch<{ adapters: AdapterInfo[] }>('/api/adapters'),
  },
  detect: {
    run: () => apiFetch<{ results: DetectionResult[] }>('/api/detect'),
  },
};
