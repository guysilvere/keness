import type { ElementType } from '../api.js';

const TYPE_COLOR: Record<ElementType, string> = {
  skill: 'badge-skill',
  agent: 'badge-agent',
  rule:  'badge-rule',
  mcp:   'badge-mcp',
};

export function TypeBadge({ type }: { type: ElementType }) {
  return <span class={`badge ${TYPE_COLOR[type]}`}>{type}</span>;
}

export function AppBadge({ appId, status }: { appId: string; status: 'ok' | 'changed' | 'new' }) {
  const cls = status === 'ok' ? 'app-badge-ok' : status === 'changed' ? 'app-badge-changed' : 'app-badge-new';
  return <span class={`app-badge ${cls}`}>{appId}</span>;
}

export function StatusDot({ ok }: { ok: boolean }) {
  return <span class={`status-dot ${ok ? 'dot-ok' : 'dot-miss'}`}>{ok ? '✓' : '–'}</span>;
}
