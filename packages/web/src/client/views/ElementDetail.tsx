import { useState, useEffect, useCallback } from 'preact/hooks';
import { api, type RegistryEntry, type KenessElement, type TargetDiff } from '../api.js';
import { navigate } from '../router.js';
import { TypeBadge } from '../components/Badge.js';
import { DiffView } from '../components/DiffView.js';

interface Props { id: string }

export function ElementDetail({ id }: Props) {
  const [data, setData] = useState<{
    entry: RegistryEntry;
    element: KenessElement;
    diffs: TargetDiff[];
  } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [busy, setBusy]         = useState(false);
  const [message, setMessage]   = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.registry.get(id)
      .then((d) => { setData(d); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function doPush() {
    if (!data || busy) return;
    setBusy(true); setMessage(null);
    try {
      const { written } = await api.registry.push(data.entry.id);
      setMessage(written.length > 0 ? `Wrote ${written.length} file(s).` : 'Nothing to write — already up to date.');
      load();
    } catch (e) {
      setMessage(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function doSync() {
    if (!data || busy) return;
    setBusy(true); setMessage(null);
    try {
      const { written } = await api.registry.sync(data.entry.id);
      setMessage(written.length > 0 ? `Synced ${written.length} file(s).` : 'Already in sync.');
      load();
    } catch (e) {
      setMessage(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function doRemove() {
    if (!data || busy) return;
    if (!confirm(`Remove "${data.entry.name}" from all targets and the registry?`)) return;
    setBusy(true);
    try {
      await api.registry.remove(data.entry.id);
      navigate('#/');
    } catch (e) {
      setMessage(`Error: ${(e as Error).message}`);
      setBusy(false);
    }
  }

  if (loading) return <p class="muted loading">Loading…</p>;
  if (error || !data) return <p class="error">{error ?? 'Not found'}</p>;

  const { entry, element, diffs } = data;
  const hasChanges = diffs.some((d) => !d.isUpToDate);

  return (
    <section>
      <div class="breadcrumb">
        <a href="#/" onClick={(e) => { e.preventDefault(); navigate('#/'); }}>Library</a>
        {' / '}{entry.name}
      </div>

      <div class="detail-header">
        <TypeBadge type={entry.type} />
        <h2 class="detail-title">{entry.name}</h2>
        <span class="muted detail-id">{entry.id}</span>
      </div>

      {entry.description && <p class="detail-desc">{entry.description}</p>}

      <div class="meta-row muted">
        <span>updated {new Date(entry.updatedAt).toLocaleDateString()}</span>
      </div>

      {/* Content */}
      <div class="section-label">Content</div>
      <pre class="content-block">{element.content || <em>empty</em>}</pre>

      {/* Targets + diffs */}
      <div class="section-label">Targets</div>
      {diffs.length === 0 ? (
        <p class="muted">No targets registered. Use Push to add one.</p>
      ) : (
        <div class="diffs">
          {diffs.map((d) => (
            <div key={d.appId} class="diff-target">
              <div class="diff-target-header">
                <span class="diff-appid">{d.appId}</span>
                <span class="diff-filepath muted">{shortenPath(d.filePath)}</span>
                {d.isNew && <span class="tag-new">new</span>}
                {d.isUpToDate && <span class="tag-ok">✓</span>}
              </div>
              <DiffView diff={d} />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div class="actions">
        <button class="btn-primary" onClick={doPush} disabled={busy || !hasChanges}>
          {busy ? '…' : 'Push'}
        </button>
        <button class="btn-secondary" onClick={doSync} disabled={busy}>
          Sync
        </button>
        <button class="btn-danger" onClick={doRemove} disabled={busy}>
          Remove
        </button>
      </div>

      {message && <p class="action-message">{message}</p>}
    </section>
  );
}

function shortenPath(p: string): string {
  const home = '~';
  if (p.includes('/home/') || p.includes('/Users/')) {
    const parts = p.split('/');
    const userIdx = parts.findIndex((s) => s === 'home' || s === 'Users');
    if (userIdx >= 0) return home + '/' + parts.slice(userIdx + 2).join('/');
  }
  return p.replace(/^.*\/\./, '~/.');
}
